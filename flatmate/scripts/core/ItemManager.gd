extends Node

# ── Item database ─────────────────────────────────────────────────────────────
# Each entry: { id, name, slot, description, stats, sprite }
var item_db: Dictionary = {}

# ── Synergy database ──────────────────────────────────────────────────────────
# Each entry: { id, requires: [item_a, item_b], description, effect_fn_name }
var synergy_db: Array[Dictionary] = []

func _ready() -> void:
	_register_items()
	_register_synergies()

func _register_items() -> void:
	var items: Array[Dictionary] = [
		# Weapons
		{ "id": "mop",         "name": "Mop",           "slot": "weapon",  "damage": 12, "speed": 1.0,  "desc": "Slow but wide sweep." },
		{ "id": "frying_pan",  "name": "Frying Pan",    "slot": "weapon",  "damage": 18, "speed": 0.75, "desc": "Heavy. Stunned on crit." },
		{ "id": "broom",       "name": "Broom",         "slot": "weapon",  "damage": 8,  "speed": 1.4,  "desc": "Fast, short range." },
		{ "id": "plunger",     "name": "Plunger",       "slot": "weapon",  "damage": 10, "speed": 1.1,  "desc": "Pulls enemies closer." },
		{ "id": "spray_bottle","name": "Spray Bottle",  "slot": "weapon",  "damage": 5,  "speed": 2.0,  "desc": "Rapid, short-range squirts." },
		# Passives
		{ "id": "slippers",    "name": "Slippers",      "slot": "passive", "desc": "+25% move speed." },
		{ "id": "headphones",  "name": "Headphones",    "slot": "passive", "desc": "Immune to sound-based stress." },
		{ "id": "tote_bag",    "name": "Tote Bag",      "slot": "passive", "desc": "Carry one extra active." },
		{ "id": "roomba",      "name": "Roomba",        "slot": "passive", "desc": "Pet that deflects small projectiles." },
		{ "id": "earplugs",    "name": "Earplugs",      "slot": "passive", "desc": "Reduce sound damage by 60%." },
		# Actives
		{ "id": "coffee_mug",       "name": "Coffee Mug",       "slot": "active", "cooldown": 8.0,  "desc": "Throw for damage + speed burst." },
		{ "id": "energy_drink",     "name": "Energy Drink",     "slot": "active", "cooldown": 12.0, "desc": "2s invincibility + speed." },
		{ "id": "fire_extinguisher","name": "Fire Extinguisher","slot": "active", "cooldown": 20.0, "desc": "AoE knockback + slow." },
		{ "id": "hot_sauce",        "name": "Hot Sauce",        "slot": "active", "cooldown": 10.0, "desc": "Next attack deals burn DoT." },
		{ "id": "rubber_duck",      "name": "Rubber Duck",      "slot": "active", "cooldown": 15.0, "desc": "Decoy that taunts enemies for 4s." },
	]
	for item in items:
		item_db[item["id"]] = item

func _register_synergies() -> void:
	synergy_db = [
		{
			"id": "breakfast_combo",
			"requires": ["frying_pan", "coffee_mug"],
			"name": "Breakfast Combo",
			"desc": "Heavy attacks stun. Coffee Mug CD -4s.",
			"effect": "synergy_breakfast_combo"
		},
		{
			"id": "spicy_roomba",
			"requires": ["roomba", "hot_sauce"],
			"name": "Spicy Roomba",
			"desc": "Roomba leaves a fire trail.",
			"effect": "synergy_spicy_roomba"
		},
		{
			"id": "deep_focus",
			"requires": ["headphones", "energy_drink"],
			"name": "Deep Focus",
			"desc": "Sound immune. Energy Drink also doubles attack speed for its duration.",
			"effect": "synergy_deep_focus"
		},
		{
			"id": "clean_sweep",
			"requires": ["mop", "roomba"],
			"name": "Clean Sweep",
			"desc": "Mop attacks restore 2 Composure on hit.",
			"effect": "synergy_clean_sweep"
		},
		{
			"id": "commuter_rage",
			"requires": ["broom", "slippers"],
			"name": "Commuter Rage",
			"desc": "Broom damage scales with move speed.",
			"effect": "synergy_commuter_rage"
		},
	]

func get_item(id: String) -> Dictionary:
	return item_db.get(id, {})

func check_synergies() -> void:
	var all_items: Array[String] = []
	if RunData.weapon != "":
		all_items.append(RunData.weapon)
	all_items.append_array(RunData.passives)
	all_items.append_array(RunData.actives)

	for synergy in synergy_db:
		if synergy["id"] in RunData.synergies:
			continue
		var reqs: Array = synergy["requires"]
		var match_count := 0
		for req in reqs:
			if req in all_items:
				match_count += 1
		if match_count == reqs.size():
			RunData.synergies.append(synergy["id"])
			RunData.synergy_triggered.emit(synergy["id"])

func get_random_item_pool(count: int, exclude: Array[String] = []) -> Array[Dictionary]:
	var pool: Array[Dictionary] = []
	for key in item_db:
		if key not in exclude:
			pool.append(item_db[key])
	pool.shuffle()
	return pool.slice(0, min(count, pool.size()))
