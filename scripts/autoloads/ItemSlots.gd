extends Node

# Global item slot state — persists between lobby and stage.
# Lobby writes here; Stage reads from here.
#
# Slot layout (matches FFH_OUTLINE design):
#   slot1   — cleaning item  (always has one; defaults to broom)
#   slot2   — combat item
#   slot3   — flex (combat or consumable)
#   passive — always-on buff

# Which item IDs belong to which slot
const SLOT_MAP := {
	"broom":             "slot1",
	"mop":               "slot1",
	"spray_bottle":      "slot1",
	"frying_pan":        "slot2",
	"plunger":           "slot2",
	"hot_sauce":         "slot2",
	"fire_extinguisher": "slot2",
	"energy_drink":      "slot3",
	"coffee_mug":        "slot3",
	"rubber_duck":       "slot3",
	"headphones":        "passive",
	"earplugs":          "passive",
	"slippers":          "passive",
	"tote_bag":          "passive",
	"roomba":            "passive",
}

# Maps item ID to its icon subfolder under assets/sprites/items/
const ICON_FOLDER := {
	"broom":             "cleaning",
	"mop":               "cleaning",
	"spray_bottle":      "cleaning",
	"frying_pan":        "combat",
	"plunger":           "combat",
	"hot_sauce":         "combat",
	"fire_extinguisher": "combat",
	"energy_drink":      "consumable",
	"coffee_mug":        "consumable",
	"rubber_duck":       "consumable",
	"headphones":        "passive",
	"earplugs":          "passive",
	"slippers":          "passive",
	"tote_bag":          "passive",
	"roomba":            "passive",
}

# Default loadout — broom always starts in slot1
var slot1   : Dictionary = {"id": "broom", "name": "Broom"}
var slot2   : Dictionary = {}
var slot3   : Dictionary = {}
var passive : Dictionary = {}

signal slots_changed

func reset() -> void:
	slot1   = {"id": "broom", "name": "Broom"}
	slot2   = {}
	slot3   = {}
	passive = {}
	emit_signal("slots_changed")

# Equip a single item into its correct slot based on SLOT_MAP
func equip(item: Dictionary) -> void:
	var dest: String = SLOT_MAP.get(item.get("id", ""), "slot2")
	match dest:
		"slot1":   slot1   = item
		"slot2":   slot2   = item
		"slot3":   slot3   = item
		"passive": passive = item
	emit_signal("slots_changed")

# Called by Lobby._update_inventory_display — syncs the lobby's 2-slot array
func sync_from_lobby(inventory: Array) -> void:
	# Route each picked item into its correct slot by item ID
	for item in inventory:
		if item == null or (item is Dictionary and item.is_empty()):
			continue
		var dest : String = SLOT_MAP.get(item.get("id", ""), "slot2")
		match dest:
			"slot1":   slot1   = item
			"slot2":   slot2   = item
			"slot3":   slot3   = item
			"passive": passive = item
	emit_signal("slots_changed")

# Items that have a full 3×3 animation spritesheet (idle / attack / clean rows)
const HAS_SHEET := ["broom", "spray_bottle"]

# Path for a given item's sprite file
func get_icon_path(item_id: String) -> String:
	var folder: String = ICON_FOLDER.get(item_id, "combat")
	return "res://assets/sprites/items/" + folder + "/" + item_id + ".png"

func get_sheet_path(item_id: String) -> String:
	return get_icon_path(item_id)

# Returns a Texture2D safe for icon display:
# - Spritesheets → AtlasTexture cropped to frame 0 (top-left cell)
# - Single-frame sprites → raw texture
func get_icon_texture(item_id: String) -> Texture2D:
	var tex := load(get_icon_path(item_id)) as Texture2D
	if tex == null:
		return null
	if item_id in HAS_SHEET:
		var fw := tex.get_width()  / 3
		var fh := tex.get_height() / 3
		var at := AtlasTexture.new()
		at.atlas  = tex
		at.region = Rect2(0, 0, fw, fh)
		return at
	return tex

func has_slot1() -> bool:
	return not slot1.is_empty()

func has_slot2() -> bool:
	return not slot2.is_empty()
