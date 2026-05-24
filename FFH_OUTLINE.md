# FFH_OUTLINE.md — Flatmate From Hell

Codebase reference for Claude Code and contributors.

**Engine:** Godot 4.6.2 · **Genre:** 2D top-down roguelite · **Stage:** Vertical slice (Day 1 complete)

No CLI build/lint/test tools — all iteration happens in the Godot editor.
Run with F5 (main scene) or F6 (current scene).

---

## Scene Flow

```
MainScreen.tscn  →  Lobby.tscn  →  Game.tscn  (Stage 1 — The Gamer Den)
  (title menu)      (hub / prep)    (Day 1 run)
```

- **Win (boss defeated):** stay in Game.tscn, show "Day 2 coming soon" overlay
- **Death (Nerve → 0):** return to Lobby.tscn after 3 s

---

## Autoloads (`project.godot`)

| Singleton | Path | Purpose |
|---|---|---|
| `UpgradeData` | `scripts/data/UpgradeData.gd` | Permanent meta-upgrades (in-memory, resets on quit) |
| `RunData` | `scripts/autoloads/RunData.gd` | Per-run stats, currencies, phase tracking |
| `CharacterManager` | `scripts/autoloads/CharacterManager.gd` | Shared sprite data + `setup_sprite()` for all characters |
| `StatusBar` | `scripts/ui/StatusBar.gd` | Global stat bars HUD (CanvasLayer 5) |
| `PauseMenu` | `scripts/ui/PauseMenu.gd` | Global menu button + pause panel (CanvasLayer 20) |

### StatusBar
- Hidden by default. Each scene calls `StatusBar.show_bar()` or `StatusBar.hide_bar()` in `_ready()`.
- Chaos row toggled with `StatusBar.show_chaos(true/false)` — shown in-game, hidden in lobby.
- Reads `RunData` every `_process` frame.

### PauseMenu
- Hidden by default. Each scene calls `PauseMenu.show_ui()` or `PauseMenu.hide_ui()` in `_ready()`.
- Menu button anchored top-right. Opens pause panel → Resume / Options (stub) / Quit to Main.
- All buttons use `process_mode = ALWAYS` so they work while `get_tree().paused = true`.

### CharacterManager
- Single source of truth for `CHARACTER_PATHS`, `CHARACTER_SHEET_DATA`, `SKILL_COOLDOWNS`.
- `setup_sprite(sprite: AnimatedSprite2D)` reads `RunData.active_character`, builds `SpriteFrames` from atlas slices, sets scale, plays "idle".
- Both `lobby/Player.gd` and `stage1/StagePlayer.gd` call this — guaranteed identical sprites in both scenes.

---

## Stat System (RunData)

| Stat | Variable | Display name | Notes |
|---|---|---|---|
| Health | `hp` / `hp_max` | **Nerve** | No regen |
| Mana | `mana` / `mana_max` | **Energy** | Regens passively in StagePlayer (`MANA_REGEN = 0.5/s`) |
| Shield | `shield` / `shield_max` | **Patience** | Absorbs hits before Nerve; regens +1 every 3 s (RunData._process) |
| Chaos | `chaos` / `chaos_max` (10) | **Chaos** | Builds passively per phase; screen tints red as it rises |
| In-run token | `peace_points` | **Calm Coin** | Earned in run, shown top-right of StageHUD |
| Lobby currency | `rent` | **£££** | Spent at Upgrade Desk / Gachapon in lobby |

`RunData.reset()` is called at the start of each run (Game.gd `_ready`). It preserves `active_character` and restores all stats to the selected character's maximums.

### Character Profiles

| ID | Nerve | Energy | Patience | Skill |
|---|---|---|---|---|
| `introvert` | 6 | 4 | 2 | Dash — forward burst in last move direction |
| `goblin` | 9 | 6 | 0 | Slam — leap + ground slam with shockwave ring |
| `peacekeeper` | 12 | 4 | 4 | Barrier — hex shield aura for 3 s |
| `petty` | 8 | 3 | 3 | Guilt Trip — emit expanding colour waves |

Skill trigger: **Space** (`use_skill` action) in both lobby and Stage 1.
Cooldowns stored in `CharacterManager.SKILL_COOLDOWNS`.

---

## Sprite Sheets

All sheets live at `assets/sprites/player/<id>.png`. Single PNG, rows sliced at runtime by `CharacterManager.setup_sprite()`.

| Animation | Row (y offset) | Frames | FPS | Loops |
|---|---|---|---|---|
| `walk` | 0 | 6 | 6 | yes |
| `idle` | frame_h × 1 | 4 | 2–4 | yes |
| `skill` | frame_h × 2 | 5 | 3–6 | no (one-shot) |
| `hit` | frame_h × 3 | 2–3 | 16 | no (one-shot) |

Facing: `flip_h` driven by movement direction. Default faces right.

---

## Lobby (`scenes/lobby/Lobby.tscn`)

**Scripts:** `scripts/lobby/Lobby.gd`, `scripts/lobby/Player.gd`

### Interactables (E key, 100 px radius)

| Name | Position | Action |
|---|---|---|
| Character Wardrobe | (550, 60) | Open character select → `RunData.set_character()` + `$Player.load_character()` |
| Item Shelf | (112, 330) | Browse all 15 items, pick up into 2-slot inventory |
| Upgrade Desk | (990, 330) | Buy permanent Tier-1 upgrades with £££ |
| Gachapon | (550, 575) | Roll random item for £5 |
| Exit Door | (1010, 646) | Confirm → `Game.tscn` |

### Lobby Player (`Player.gd`)
- `CharacterBody2D` with `$AnimatedSprite2D` (scene node).
- `CharacterManager.setup_sprite($AnimatedSprite2D)` called in `_ready()` and `load_character()`.
- `load_character()` resets `_skill_active = false` and `_skill_cooldown = 0.0` before swapping sprites.
- Skills triggered by **Space**. All 4 character skills implemented (dash / slam / barrier / shove).
- Arm pivot rotates to face mouse. Weapon sprite at hand position.

---

## Stage 1 — The Gamer Den (`scenes/game/Game.tscn`)

**Script:** `scripts/game/Game.gd` — builds everything programmatically (no TileMap, no per-room `.tscn`).

### Rooms

| Room | Size | Notes |
|---|---|---|
| Bedroom | 500 × 420 | Player spawn |
| Hallway | 280 × 620 | Central hub |
| Living Room | 600 × 420 | Boss arena (Midnight only) |
| Kitchen | 380 × 340 | |
| Bathroom | 300 × 280 | |

Rooms connect via 82 px door gaps. `Area2D` door triggers fire `player_entered_door` signal → encounter activates in new room.

### Door Toggles (`scripts/stage1/DoorToggle.gd`)
Player can open/close doors with **E** key (72 px proximity). Living room door excluded (roommate's room — never togglable). Doors lock automatically during active encounters; unlock when room is cleared.

### Phase System (`scripts/stage1/PhaseManager.gd`)

| Phase | Name | Duration | Chaos rate |
|---|---|---|---|
| 0 | Morning | 50 s | 0.025/s |
| 1 | Afternoon | 50 s | 0.06/s |
| 2 | Evening | 50 s | 0.14/s |
| 3 | Midnight | — | 0.0 (boss fight) |

On each new phase: non-boss rooms reset to IDLE, door toggle locks clear, encounter activates in current room.
Midnight: all non-boss rooms force-clear, player teleports to Living Room, boss spawns.

### Stage Player (`scripts/stage1/StagePlayer.gd`)
- `CharacterBody2D` created programmatically. `AnimatedSprite2D` added as child.
- `CharacterManager.setup_sprite(_sprite)` called in `_ready()`.
- Controls: WASD move · LMB attack · **Space** skill · Space + direction dodge (when skill on cooldown) · E scavenge
- Invincibility frames during dodge and after taking damage.
- Skills: identical implementations to lobby Player.gd (same coroutine logic, same visual effects), using `_sprite` instead of `$AnimatedSprite2D`.

### StageHUD (`scripts/stage1/StageHUD.gd`)
- Calm Coin counter (top right, with icon)
- Phase name + countdown timer
- Boss HP bar (bottom, hidden until Midnight)
- Centre overlay label (win / lose messages)
- Full-screen chaos tint (red, scales with `RunData.chaos / chaos_max`)
- Calls `StatusBar.show_bar()`, `StatusBar.show_chaos(true)`, `PauseMenu.show_ui()` in `_ready()`.

### Encounter Config (scale here for Day 2/3)
Edit `_encounter_config(phase)` in `Game.gd`:

| Phase | Drones | Cans | Hazards |
|---|---|---|---|
| Morning | 2 | 0 | cable |
| Afternoon | 3 | 1 | chair, cable |
| Evening | 4 | 1 | chair, speaker |

### Enemies & Hazards

| Script | Type | Notes |
|---|---|---|
| `enemies/GamerDrone.gd` | Enemy | Patrol + chase |
| `enemies/ThrownCanEnemy.gd` | Enemy | Thrown projectile enemy |
| `enemies/CanProjectile.gd` | Projectile | Spawned by ThrownCanEnemy |
| `LoudGamer.gd` | Boss | 3-phase: sonic wave, keyboard throw, rage dash, drone summon |
| `hazards/RollingChair.gd` | Hazard | Bounces around room |
| `hazards/SoundwaveSpeaker.gd` | Hazard | Periodic AoE pulse |
| `hazards/CableTrip.gd` | Hazard | Trips / slows player |
| `hazards/ElectricalSpark.gd` | Hazard | Static zone damage |
| `ScavengeObject.gd` | Loot | E key: drawer / fridge / pizza_box / delivery_box / cabinet |

---

## UI Scenes

| Scene | Script | Notes |
|---|---|---|
| `scenes/ui/MainScreen.tscn` | `scripts/ui/MainScreen.gd` | Title menu. Hides StatusBar + PauseMenu. Achievements/Options/Credits are stubs. |

---

## Assets

```
assets/sprites/
  player/         introvert.png, petty_one.png, peace_keeper.png, chaos_goblin.png
  items/          <item_id>.png  (15 items)
  lobby/          lobby prop sprites
  ui/             icon_nerve.png, icon_energy.png, icon_patience.png,
                  icon_chaos.png, icon_calm_coin.png, icon_pounds.png
```

---

## Game Design — Item & Weapon System

### Slot System

| Slot | Purpose | Who can go here |
|---|---|---|
| Slot 1 | Cleaning item | Cleaning items only |
| Slot 2 | Combat weapon | Combat items only |
| Slot 3 | Flex slot | Combat items OR Consumables |
| Passive slot | Always-on buff | Passives only |
| Skill | Character ability | Character-locked, Space key |

### Key Rules
- **Cleaning items** are dual-purpose — they clean mess AND can fight, but deal weak damage
- **Every weapon/active has its own Energy cost** (0 or more) per use
- **Energy fallback** — if you try to use a weapon with 0 Energy, the game falls back to a default melee punch automatically
- **Character Skill (Space)** is free — has its own cooldown, never costs Energy
- **Consumables** are one-time use and disappear after

### Enemy Drops (on kill — instant)
- **Energy** — amount scales per enemy type (small enemy = 0.5–1, large = 1–2, boss = large burst)
- **Calm Coin** — instant on kill, feeds the in-run economy

---

### 🧹 Cleaning Items (Slot 1)
*Dual purpose — weak in combat, essential for Chaos management*

| Item | Melee/Ranged | Combat | Cleaning |
|---|---|---|---|
| Cleaning Towel | Melee | Weakest damage, tiny arc | Smallest area, slowest — default starter |
| Broom | Melee | Low damage, wide arc | Wide sweep, fast |
| Mop | Melee | Low damage, trail slows enemies | Medium area, leaves wet defensive trail |
| Spray Bottle | Ranged | Low damage, short range, stuns | Disinfects small area |
| Vacuum | Ranged | Pulls enemies toward you | Sucks up mess, largest area |

### ⚔️ Combat Items (Slot 2 or 3)
*Pure fighting — no cleaning ability*

| Item | Melee/Ranged | Effect |
|---|---|---|
| Frying Pan | Melee | High damage, slow swing, stun |
| Plunger | Melee | Medium damage, pins enemies to wall |
| Hot Sauce | Ranged | Burn damage over time |
| Fire Extinguisher | Ranged | Cone knockback, brief freeze |

### 🧃 Consumables (Slot 3 only)
*One-time use — disappears after*

| Item | Effect |
|---|---|
| Energy Drink | Speed + attack boost, Chaos spike after |
| Coffee Mug | Restores small Nerve, temporary focus buff |
| Rubber Duck | Random chaos — could help or hurt |

### 🛡️ Passives (Passive slot)
*Always-on — no activation needed*

| Item | Effect |
|---|---|
| Headphones | Reduces Nerve damage from sound-based enemies |
| Earplugs | Slows Chaos buildup passively |
| Slippers | Faster movement, immune to wet floor slow |
| Tote Bag | Unlocks a 4th slot |
| Roomba | Auto-cleans mess while you fight |

---

## Game Design — Cleaning System

### What is Mess?
Enemies and hazards leave mess behind as they move, attack, and die. The room visually degrades during fights.

### How Cleaning Works
- **Default** — walking over mess cleans it (tiny radius, slow)
- **Cleaning items** — larger clean radius around the player as they move + active cleaning animation effect
- **No extra character animation needed** — the item effect sprite handles both combat and cleaning visually

### Why Cleaning Matters
- Mess feeds the **Chaos meter** — the messier the room, the faster Chaos climbs
- Cleaning rewards **Calm Coin** and slows Chaos buildup
- At max Chaos — screen distorts, enemies get faster, Energy regens slower

### Core Tension
> Do I chase that enemy down and kill it, or clean the mess it left before Chaos spikes?

---

## Game Design — Day Structure

Stage 1 lasts **3 days**. Each day follows the same phase structure but gets harder.

### Day Structure (per day)

| Phase | Combat | Cleaning |
|---|---|---|
| Morning | No enemies — safe | Mess appears, cleaning only |
| Afternoon | Moving hazards + enemies begin | Clean while fighting |
| Evening | Same as Afternoon but harder | More mess, more pressure |
| Midnight | Boss fight in Living Room | No cleaning — pure combat |

### Between Days — Bedroom Shop
- After each day clears, player returns to **Bedroom** before next day starts
- Spend **Calm Coin** earned during the day to buy or upgrade items
- Safe room — no enemies

### Day Scaling

| Day | Intensity | Notes |
|---|---|---|
| Day 1 | Normal | Tutorial-level pressure |
| Day 2 | Harder | More enemies, new sprite designs |
| Day 3 | Hardest | Maximum chaos, hardest encounters |

---

## Game Design — Item Acquisition

| Source | When | Currency | Notes |
|---|---|---|---|
| Gachapon (Lobby) | Before run | £££ | Random item roll |
| Item Shelf (Lobby) | Before run | Free | Browse and pick |
| Scavenging (In-run) | During run | Free | Drawers, fridge, boxes drop items |
| Enemy drops (In-run) | During run | Free | Rare chance on kill |
| Bedroom Shop | Between days | Calm Coin | Buy/upgrade items between days |

---

## What Is Not Built Yet

- Day 2 / Day 3 encounter configs (`_encounter_config` values only — code structure is ready)
- Save / load — `UpgradeData.purchased` resets on quit
- Rent earned in a run is not fed back into lobby £££ on return
- MainScreen: Achievements, Options, Credits buttons are `pass` stubs
- Options menu inside PauseMenu is a stub

---

## Key Rules When Editing

- **Autoloads are the pattern for global UI** — StatusBar (layer 5), PauseMenu (layer 20), CharacterManager. Add new global systems the same way.
- **Never duplicate character/sprite data** — `CharacterManager` is the single source. Edit `CHARACTER_SHEET_DATA` and `CHARACTER_PATHS` there only.
- **Upgrade Desk = permanent meta-progression only** — no run-specific buffs at the desk. Add new upgrades to `UPGRADES` in `Lobby.gd` and a matching computed property in `UpgradeData.gd`.
- **Stage 1 is fully programmatic** — no TileMap, no per-room `.tscn`. All geometry built in `Game.gd`.
- **Skill coroutines must guard `is_inside_tree()`** — all `while` loops that `await get_tree().physics_frame` must include `and is_inside_tree()` to survive scene transitions.
