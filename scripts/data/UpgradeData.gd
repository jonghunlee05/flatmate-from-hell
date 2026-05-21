extends Node

var purchased: Dictionary = {}

var max_hp_bonus: int:
	get: return 2 if purchased.get("hp_i", false) else 0

var speed_bonus: float:
	get: return 0.05 if purchased.get("speed_i", false) else 0.0

var rent_retention: float:
	get: return 0.5 if purchased.get("rent_saver", false) else 0.0

var starting_consumable: bool:
	get: return purchased.get("bigger_pockets", false)
