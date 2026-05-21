# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Flatmate** — a 2D top-down roguelite (Godot 4.6.2) where the player survives insufferable flatmates. Currently at vertical slice stage: one character, one lobby, one run destination.

Open the project in Godot 4.6.2. There are no CLI build/lint/test tools — all iteration happens in the Godot editor. Run the project with F5 (main scene) or F6 (current scene).

## Scene flow

```
MainScreen.tscn  →  Lobby.tscn  →  Game.tscn (Stage 1)
  (title menu)      (between runs)   (The Gamer Den — fully playable)
```

`MainScreen` → Play → `Lobby` → Exit Door → `Game.tscn`. Win/lose both return to `Lobby.tscn`.

## Architecture

### Autoloads
- `UpgradeData` (`scripts/data/UpgradeData.gd`) — permanent meta-upgrades, in-memory only.
- `RunData` (`scripts/autoloads/RunData.gd`) — per-run stats: `composure`, `energy`, `chaos`, `rent`, `current_day`, `current_phase`. Reset via `RunData.reset()` at the start of each run.

### Lobby (`scripts/lobby/Lobby.gd`)
All lobby logic lives in a single script on the `Lobby` Node2D. It owns:
- **Interactables** — proximity-checked each frame against `INTERACTABLES` dict (name → Vector2 position). E key fires `_interact(name)`.
- **Character Wardrobe** — swaps `Player` sprite sheet at runtime via `load_character(path)`.
- **Item Shelf** — grid of all 15 items built procedurally in `_build_item_grid()`. Items go into a 2-slot inventory; full inventory triggers `SlotPicker`.
- **Gachapon** — spends `rent`, returns a random item from the full `ITEMS` pool.
- **Upgrade Desk** — 4 Tier 1 permanent upgrades, built procedurally in `_build_upgrade_panel()`. Purchases write to `UpgradeData.purchased` and immediately rebuild the panel.
- **Exit Door** — "Enter Stage 1?" confirm → `change_scene_to_file` to `Game.tscn`.
- **Floor items** — dropped items spawn as `Sprite2D` nodes with a 30 s lifetime, picked up on proximity + E.

All panels (CharacterSelect, ItemSelect, GachaPanel, UpgradePanel, ExitConfirm, SlotPicker, DropConfirm) use `get_tree().paused = true/false` and `process_mode = 3` (Always) so UI stays responsive while the game is paused.

### Player (`scripts/lobby/Player.gd`)
`CharacterBody2D`. Sprite sheets are sliced at runtime — no external SpriteFrames resource. `_setup_sprite(path)` cuts frames from a single PNG using hardcoded y-offsets per animation row. Animations: `walk_down/left/up`, `idle_down/left/up` (right is mirrored from left via `flip_h`). `HandAnchor/ItemSprite` is a child node that moves per facing direction to show the held item.

### Currency
`rent` is a local `int` on `Lobby.gd`. It is not persisted between sessions yet. The `rent_retention` property on `UpgradeData` is the hook for death-carry behaviour when the run loop is implemented.

## Key constants (Lobby.gd)

| Constant | Value | Purpose |
|---|---|---|
| `INTERACT_RADIUS` | 100 px | Proximity to open an interactable |
| `FLOOR_ITEM_PICKUP_RADIUS` | 60 px | Proximity to pick up dropped items |
| `FLOOR_ITEM_LIFETIME` | 30 s | Time before floor items despawn |
| `GACHA_COST` | £5 | Rent cost per gachapon roll |
| `SPEED` (Player) | 200 px/s | Base movement speed |

## Assets

Sprites live under `assets/sprites/`. All are placeholder PNGs until final art is dropped in — scripts load them by convention:
- Player sheets: `assets/sprites/player/<character_id>.png` (single sheet, rows sliced by `Player.gd`)
- Items: `assets/sprites/items/<item_id>.png`
- Lobby props: `assets/sprites/lobby/<name>.png`

### Stage 1 — The Gamer Den (`scripts/game/Game.gd`)
Everything is built programmatically — no TileMap, no per-room .tscn files. `Game.gd` creates all 5 rooms (Bedroom, Hallway, Living Room, Kitchen, Bathroom) as Node2D nodes with ColorRect floors and StaticBody2D walls. Rooms are physically connected by 82 px gaps; players walk through freely. Door Area2Ds fire `player_entered_door` signals. Encounters spawn when the player enters a room. Doors lock (blocker StaticBody2D added) during ACTIVE encounters and unlock when cleared.

Key scripts under `scripts/stage1/`:
- `PhaseManager.gd` — 60/90/120 s timers, emits `phase_started` and `midnight_started`
- `Room.gd` — IDLE → ACTIVE → CLEARED state machine with door-blocker system
- `StagePlayer.gd` — WASD move, mouse-aim LMB attack, Space dodge (costs Energy), E scavenge
- `StageHUD.gd` — Composure/Energy/Chaos bars, Rent, phase timer, boss HP bar, overlay
- `LoudGamer.gd` — 3-phase boss; attacks: sonic wave, keyboard throw, rage dash, summon drones
- `enemies/GamerDrone.gd`, `enemies/ThrownCanEnemy.gd`, `enemies/CanProjectile.gd`
- `hazards/RollingChair.gd`, `hazards/SoundwaveSpeaker.gd`, `hazards/CableTrip.gd`, `hazards/ElectricalSpark.gd`
- `ScavengeObject.gd` — 5 types (drawer/fridge/pizza_box/delivery_box/cabinet), E to loot

Scaling Day 2/3: edit `_encounter_config()` in `Game.gd` to increase `drones`, `cans`, add `"spark"` to hazards.

## What is not built yet

- Day 2 and Day 3 encounter configs (code is ready; just needs scaled values in `_encounter_config`)
- No save/load. `UpgradeData.purchased` resets on quit.
- `MainScreen` buttons for Achievements, Options, Credits are `pass` stubs.
- Rent earned in a run is not yet fed back into lobby rent on return.

## Upgrade Desk design rule

The desk is **permanent meta-progression only** — no run-specific or temporary buffs. Tier 1 upgrades are: `composure_i`, `speed_i`, `rent_saver`, `bigger_pockets`. When adding Tier 2+, add to the `UPGRADES` array in `Lobby.gd` and add a matching computed property to `UpgradeData.gd`. Categories: Survival, Mobility, Rent, Loadout.
