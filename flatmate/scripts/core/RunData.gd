extends Node

# Holds all mutable state for the current run.
# Reset by GameManager.start_run().

# ── Stats (base + lobby upgrades applied at run start) ───────────────────────
var max_composure: int = 100
var composure: int = 100
var move_speed: float = 150.0
var dodge_speed: float = 280.0
var dodge_duration: float = 0.18
var attack_damage_mult: float = 1.0

# ── Inventory ─────────────────────────────────────────────────────────────────
var weapon: String = ""          # item id
var passives: Array[String] = []
var actives: Array[String] = []
var active_cooldowns: Dictionary = {}

# ── Active synergies this run ─────────────────────────────────────────────────
var synergies: Array[String] = []

# ── Signals ───────────────────────────────────────────────────────────────────
signal composure_changed(current: int, maximum: int)
signal item_added(item_id: String)
signal synergy_triggered(synergy_id: String)
signal player_died

func reset() -> void:
	var gm := GameManager
	max_composure = 100 + gm.lobby_upgrades.get("max_composure_bonus", 0)
	composure = max_composure
	move_speed = 150.0 + gm.lobby_upgrades.get("move_speed_bonus", 0.0)
	dodge_speed = 280.0
	dodge_duration = 0.18
	attack_damage_mult = 1.0
	weapon = ""
	passives.clear()
	actives.clear()
	active_cooldowns.clear()
	synergies.clear()

func take_damage(amount: int) -> void:
	composure = max(0, composure - amount)
	emit_signal("composure_changed", composure, max_composure)
	if composure <= 0:
		emit_signal("player_died")

func heal(amount: int) -> void:
	composure = min(max_composure, composure + amount)
	emit_signal("composure_changed", composure, max_composure)

func add_item(item_id: String, slot: String) -> void:
	match slot:
		"weapon":
			weapon = item_id
		"passive":
			if item_id not in passives:
				passives.append(item_id)
		"active":
			if item_id not in actives:
				actives.append(item_id)
	emit_signal("item_added", item_id)
	ItemManager.check_synergies()
