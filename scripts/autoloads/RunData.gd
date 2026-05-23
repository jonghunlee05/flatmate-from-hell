extends Node

# ── Per-run stats ─────────────────────────────────────────────────────────────
var hp:         float = 6.0
var hp_max:     float = 6.0
var mana:       float = 4.0
var mana_max:   float = 4.0
var shield:     float = 2.0
var shield_max: float = 2.0
var chaos:      float = 0.0
var chaos_max:  float = 10.0

# ── Currencies ────────────────────────────────────────────────────────────────
var rent:         int = 0   # lobby currency (spent between runs)
var peace_points: int = 0   # in-run currency (earned during a run)

# ── Run tracking ──────────────────────────────────────────────────────────────
var current_day:   int = 1
var current_phase: int = 0  # 0=Morning 1=Afternoon 2=Evening 3=Midnight

const PHASE_NAMES  := ["Morning", "Afternoon", "Evening", "Midnight"]
const CHAOS_RATES  := [0.025, 0.06, 0.14, 0.0]  # per second per phase

# ── Character profiles ────────────────────────────────────────────────────────
#   hp_max     — health pool
#   mana_max   — resource for dodge / skills
#   shield_max — buffer that absorbs hits before HP (0 = no shield)
#
var active_character := "introvert"

const CHARACTER_PROFILES := {
	"introvert":   {"hp_max": 6,  "mana_max": 4, "shield_max": 2},
	"goblin":      {"hp_max": 9,  "mana_max": 6, "shield_max": 0},
	"peacekeeper": {"hp_max": 12, "mana_max": 4, "shield_max": 4},
	"petty":       {"hp_max": 8,  "mana_max": 3, "shield_max": 3},
}

func set_character(id: String) -> void:
	active_character = id
	var profile := CHARACTER_PROFILES.get(id, CHARACTER_PROFILES["introvert"]) as Dictionary
	hp_max     = profile["hp_max"]
	mana_max   = profile["mana_max"]
	shield_max = profile["shield_max"]

# Call at lobby load (respawn) and at the start of each run
func reset() -> void:
	set_character(active_character)
	hp           = hp_max
	mana         = mana_max
	shield       = shield_max
	chaos        = 0.0
	peace_points = 0
	rent         = 0
	current_day  = 1
	current_phase = 0

# ── Damage & restoration ──────────────────────────────────────────────────────

# Shield absorbs hits first; remainder drains HP
func take_damage(amount: float) -> void:
	if shield > 0.0:
		var absorbed := minf(shield, amount)
		shield = maxf(0.0, shield - absorbed)
		amount -= absorbed
	hp = maxf(0.0, hp - amount)

func add_chaos(amount: float) -> void:
	chaos = minf(chaos_max, chaos + amount)

func restore_hp(amount: float) -> void:
	hp = minf(hp_max, hp + amount)

func restore_mana(amount: float) -> void:
	mana = minf(mana_max, mana + amount)

func restore_shield(amount: float) -> void:
	shield = minf(shield_max, shield + amount)

func use_mana(amount: float) -> bool:
	if mana >= amount:
		mana -= amount
		return true
	return false

# ── Shield regen (+1 every 3 seconds, only when below max) ───────────────────
var _shield_regen_timer: float = 0.0
const SHIELD_REGEN_INTERVAL: float = 3.0

func _process(delta: float) -> void:
	if shield >= shield_max or shield_max <= 0.0:
		_shield_regen_timer = 0.0
		return
	_shield_regen_timer += delta
	if _shield_regen_timer >= SHIELD_REGEN_INTERVAL:
		_shield_regen_timer = 0.0
		shield = minf(shield_max, shield + 1.0)

# ── Currency ──────────────────────────────────────────────────────────────────

func add_rent(amount: int) -> void:
	rent += amount

func add_peace_points(amount: int) -> void:
	peace_points += amount
