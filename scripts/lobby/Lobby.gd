extends Node2D

const INTERACT_RADIUS = 100.0

var rent: int = 0
var near_interactable: String = ""
var selected_character: String = "introvert"
var _e_was_pressed := false
var inventory: Array = [null, null]
var _pending_item: Dictionary = {}
var _gacha_result: Dictionary = {}
var _drop_slot: int = -1

const INTERACTABLES := {
	"Character Wardrobe": Vector2(550, 60),
	"Item Shelf":         Vector2(112, 330),
	"Upgrade Desk":       Vector2(990, 330),
	"Exit Door":          Vector2(1010, 646),
	"Gachapon":           Vector2(550, 575),
}

const GACHA_COST := 5

const CHARACTER_PATHS := {
	"introvert":   "res://assets/sprites/player/introvert.png",
	"petty":       "res://assets/sprites/player/petty_one.png",
	"peacekeeper": "res://assets/sprites/player/peace_keeper.png",
	"chaos":       "res://assets/sprites/player/chaos_goblin.png",
}

const ITEMS := [
	{"id": "broom",             "name": "Broom",             "type": "Melee Weapon",    "rarity": "Common",    "desc": "Wide sweeping attack with medium knockback."},
	{"id": "mop",               "name": "Mop",               "type": "Crowd Control",   "rarity": "Common",    "desc": "Leaves slippery water trail. Enemies slip and lose tracking."},
	{"id": "frying_pan",        "name": "Frying Pan",        "type": "Heavy Melee",     "rarity": "Uncommon",  "desc": "Slow but high stun chance. Critical hits go CLANG."},
	{"id": "plunger",           "name": "Plunger",           "type": "Utility Weapon",  "rarity": "Uncommon",  "desc": "Sticks enemies to surfaces temporarily."},
	{"id": "headphones",        "name": "Headphones",        "type": "Passive",         "rarity": "Uncommon",  "desc": "Reduces sound-based stress damage from loud flatmates."},
	{"id": "earplugs",          "name": "Earplugs",          "type": "Passive",         "rarity": "Common",    "desc": "Reduces panic buildup. Tradeoff: smaller awareness radius."},
	{"id": "slippers",          "name": "Slippers",          "type": "Passive",         "rarity": "Common",    "desc": "Faster movement indoors. Less slipping on wet floors."},
	{"id": "tote_bag",          "name": "Tote Bag",          "type": "Passive",         "rarity": "Uncommon",  "desc": "Carry an extra consumable or active item."},
	{"id": "energy_drink",      "name": "Energy Drink",      "type": "Active",          "rarity": "Rare",      "desc": "Speed and attack boost. Stress spike when it wears off."},
	{"id": "fire_extinguisher", "name": "Fire Extinguisher", "type": "Active AoE",      "rarity": "Rare",      "desc": "Cone blast pushes enemies back. Removes fire and smoke."},
	{"id": "hot_sauce",         "name": "Hot Sauce",         "type": "Damage Modifier", "rarity": "Uncommon",  "desc": "Adds burn effect to attacks."},
	{"id": "coffee_mug",        "name": "Coffee Mug",        "type": "Recovery",        "rarity": "Common",    "desc": "Restores small Composure. Temporary focus buff after use."},
	{"id": "spray_bottle",      "name": "Spray Bottle",      "type": "Utility Active",  "rarity": "Common",    "desc": "Stuns and confuses enemies. Interrupts charges and arguments."},
	{"id": "roomba",            "name": "Roomba",            "type": "Companion",       "rarity": "Legendary", "desc": "Bumps enemies, cleans hazards, blocks you at worst moments."},
	{"id": "rubber_duck",       "name": "Rubber Duck",       "type": "Chaos",           "rarity": "Cursed",    "desc": "Random stress manipulation. Nobody knows what it does. That's the point."},
]

func _ready() -> void:
	_setup_character_previews()
	_build_item_grid()
	$HUD/BtnMenu.pressed.connect(_on_menu_pressed)
	$HUD/PauseMenu/VBox/BtnResume.pressed.connect(_close_menu)
	$HUD/PauseMenu/VBox/BtnOptions.pressed.connect(_on_options_pressed)
	$HUD/PauseMenu/VBox/BtnQuit.pressed.connect(_on_quit_pressed)
	$HUD/SaveConfirm/VBox/HBox/BtnYes.pressed.connect(_on_save_yes)
	$HUD/SaveConfirm/VBox/HBox/BtnNo.pressed.connect(_on_save_no)
	$HUD/CharacterSelect/VBox/Cards/CardIntrovert/VBox/BtnSelect.pressed.connect(_on_select_introvert)
	$HUD/CharacterSelect/VBox/Cards/CardPetty/VBox/BtnSelect.pressed.connect(_on_select_petty)
	$HUD/CharacterSelect/VBox/Cards/CardPeacekeeper/VBox/BtnSelect.pressed.connect(_on_select_peacekeeper)
	$HUD/CharacterSelect/VBox/Cards/CardChaos/VBox/BtnSelect.pressed.connect(_on_select_chaos)
	$HUD/CharacterSelect/VBox/BtnClose.pressed.connect(_close_character_select)
	$HUD/ItemSelect/VBox/BtnClose.pressed.connect(_close_item_select)
	$HUD/SlotPicker/VBox/HBox/BtnSlot1.pressed.connect(_on_slot_replace.bind(0))
	$HUD/SlotPicker/VBox/HBox/BtnSlot2.pressed.connect(_on_slot_replace.bind(1))
	$HUD/SlotPicker/VBox/BtnCancel.pressed.connect(_on_slot_cancel)
	$HUD/InventoryBar/Slot1.gui_input.connect(_on_slot_gui_input.bind(0))
	$HUD/InventoryBar/Slot2.gui_input.connect(_on_slot_gui_input.bind(1))
	$HUD/DropConfirm/VBox/HBox/BtnDrop.pressed.connect(_on_drop_confirm)
	$HUD/DropConfirm/VBox/HBox/BtnKeep.pressed.connect(_on_drop_cancel)
	$HUD/GachaPanel/VBox/BtnRoll.pressed.connect(_on_gacha_roll)
	$HUD/GachaPanel/VBox/ResultPanel/BtnGachaPickup.pressed.connect(_on_gacha_pickup)
	$HUD/GachaPanel/VBox/BtnGachaClose.pressed.connect(_close_gacha)
	_update_rent()
	_update_inventory_display()

func _process(_delta: float) -> void:
	_check_proximity()
	var e_pressed := Input.is_physical_key_pressed(KEY_E)
	if e_pressed and not _e_was_pressed and near_interactable != "":
		_interact(near_interactable)
	_e_was_pressed = e_pressed

func _check_proximity() -> void:
	var player_pos: Vector2 = $Player.position
	near_interactable = ""
	for interactable in INTERACTABLES:
		if player_pos.distance_to(INTERACTABLES[interactable]) < INTERACT_RADIUS:
			near_interactable = interactable
			break
	var any_open: bool = (
		$HUD/CharacterSelect.visible or $HUD/ItemSelect.visible
		or $HUD/SlotPicker.visible or $HUD/GachaPanel.visible
		or $HUD/DropConfirm.visible
	)
	$HUD/InteractPrompt.visible = near_interactable != "" and not any_open

func _interact(target: String) -> void:
	match target:
		"Character Wardrobe": _open_character_select()
		"Item Shelf":         _open_item_select()
		"Gachapon":           _open_gacha()
		"Upgrade Desk":       pass
		"Exit Door":          pass

# ── Character select ──────────────────────────────────────────────────────────

func _open_character_select() -> void:
	$HUD/CharacterSelect.visible = true
	get_tree().paused = true

func _close_character_select() -> void:
	$HUD/CharacterSelect.visible = false
	get_tree().paused = false

func _select_character(key: String) -> void:
	selected_character = key
	$Player.load_character(CHARACTER_PATHS[key])
	_close_character_select()

func _on_select_introvert() -> void:   _select_character("introvert")
func _on_select_petty() -> void:       _select_character("petty")
func _on_select_peacekeeper() -> void: _select_character("peacekeeper")
func _on_select_chaos() -> void:       _select_character("chaos")

func _setup_character_previews() -> void:
	var previews := {
		"CardIntrovert":   "res://assets/sprites/player/introvert.png",
		"CardPetty":       "res://assets/sprites/player/petty_one.png",
		"CardPeacekeeper": "res://assets/sprites/player/peace_keeper.png",
		"CardChaos":       "res://assets/sprites/player/chaos_goblin.png",
	}
	for card in previews:
		var texture = load(previews[card])
		var atlas := AtlasTexture.new()
		atlas.atlas = texture
		atlas.region = Rect2(0, 0, 256, 256)
		$HUD/CharacterSelect/VBox/Cards.get_node(card + "/VBox/Sprite").texture = atlas
		$HUD/CharacterSelect/VBox/Cards.get_node(card + "/VBox/Sprite").visible = true

# ── Item select ───────────────────────────────────────────────────────────────

func _open_item_select() -> void:
	$HUD/ItemSelect.visible = true
	get_tree().paused = true

func _close_item_select() -> void:
	$HUD/ItemSelect.visible = false
	get_tree().paused = false

func _build_item_grid() -> void:
	var grid := $HUD/ItemSelect/VBox/Scroll/Grid
	for item in ITEMS:
		var card := PanelContainer.new()
		card.custom_minimum_size = Vector2(155, 215)

		var vbox := VBoxContainer.new()
		vbox.add_theme_constant_override("separation", 5)
		card.add_child(vbox)

		var icon := TextureRect.new()
		icon.custom_minimum_size = Vector2(64, 64)
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.texture = load("res://assets/sprites/items/" + item["id"] + ".png")
		vbox.add_child(icon)

		var name_lbl := Label.new()
		name_lbl.text = item["name"]
		name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		name_lbl.add_theme_font_size_override("font_size", 13)
		vbox.add_child(name_lbl)

		var type_lbl := Label.new()
		type_lbl.text = item["type"]
		type_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		type_lbl.add_theme_font_size_override("font_size", 10)
		type_lbl.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
		vbox.add_child(type_lbl)

		var rarity_lbl := Label.new()
		rarity_lbl.text = item["rarity"]
		rarity_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		rarity_lbl.add_theme_font_size_override("font_size", 11)
		rarity_lbl.add_theme_color_override("font_color", _rarity_color(item["rarity"]))
		vbox.add_child(rarity_lbl)

		var desc_lbl := Label.new()
		desc_lbl.text = item["desc"]
		desc_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		desc_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		desc_lbl.add_theme_font_size_override("font_size", 10)
		desc_lbl.custom_minimum_size = Vector2(0, 56)
		vbox.add_child(desc_lbl)

		var btn := Button.new()
		btn.text = "PICK UP"
		btn.pressed.connect(_on_item_picked.bind(item))
		vbox.add_child(btn)

		grid.add_child(card)

func _rarity_color(rarity: String) -> Color:
	match rarity:
		"Common":    return Color(0.8, 0.8, 0.8)
		"Uncommon":  return Color(0.3, 0.85, 0.3)
		"Rare":      return Color(0.3, 0.5, 1.0)
		"Cursed":    return Color(0.75, 0.2, 0.95)
		"Legendary": return Color(1.0, 0.75, 0.1)
	return Color.WHITE

func _on_item_picked(item: Dictionary) -> void:
	if inventory[0] == null:
		inventory[0] = item
		_update_inventory_display()
		_close_item_select()
	elif inventory[1] == null:
		inventory[1] = item
		_update_inventory_display()
		_close_item_select()
	else:
		_pending_item = item
		$HUD/ItemSelect.visible = false
		_open_slot_picker()

func _open_slot_picker() -> void:
	$HUD/SlotPicker/VBox/HBox/BtnSlot1.text = "Slot 1: " + inventory[0]["name"]
	$HUD/SlotPicker/VBox/HBox/BtnSlot2.text = "Slot 2: " + inventory[1]["name"]
	$HUD/SlotPicker.visible = true

func _on_slot_replace(slot: int) -> void:
	inventory[slot] = _pending_item
	_pending_item = {}
	_update_inventory_display()
	$HUD/SlotPicker.visible = false
	get_tree().paused = false

func _on_slot_cancel() -> void:
	_pending_item = {}
	$HUD/SlotPicker.visible = false
	get_tree().paused = false

func _on_slot_gui_input(event: InputEvent, slot: int) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if inventory[slot] != null:
			_drop_slot = slot
			$HUD/DropConfirm/VBox/Label.text = "Drop " + inventory[slot]["name"] + "?"
			$HUD/DropConfirm.visible = true
			get_tree().paused = true

func _on_drop_confirm() -> void:
	inventory[_drop_slot] = null
	_drop_slot = -1
	_update_inventory_display()
	$HUD/DropConfirm.visible = false
	get_tree().paused = false

func _on_drop_cancel() -> void:
	_drop_slot = -1
	$HUD/DropConfirm.visible = false
	get_tree().paused = false

func _update_inventory_display() -> void:
	for i in range(2):
		var slot := $HUD/InventoryBar.get_node("Slot%d" % (i + 1))
		var icon: TextureRect = slot.get_node("HBox/Icon")
		var label: Label = slot.get_node("HBox/Label")
		if inventory[i] == null:
			icon.texture = null
			icon.visible = false
			label.text = "[ empty ]"
			slot.mouse_filter = Control.MOUSE_FILTER_IGNORE
		else:
			icon.texture = load("res://assets/sprites/items/" + inventory[i]["id"] + ".png")
			icon.visible = true
			label.text = inventory[i]["name"]
			slot.mouse_filter = Control.MOUSE_FILTER_STOP

# ── Gachapon ──────────────────────────────────────────────────────────────────

func _open_gacha() -> void:
	var vbox := $HUD/GachaPanel/VBox
	vbox.get_node("ResultPanel").visible = false
	vbox.get_node("BtnRoll").text = "ROLL!  (£%d)" % GACHA_COST
	vbox.get_node("StatusLabel").text = ""
	$HUD/GachaPanel.visible = true
	get_tree().paused = true

func _close_gacha() -> void:
	$HUD/GachaPanel.visible = false
	_gacha_result = {}
	get_tree().paused = false

func _on_gacha_roll() -> void:
	var status_lbl: Label = $HUD/GachaPanel/VBox/StatusLabel
	if rent < GACHA_COST:
		status_lbl.text = "Not enough rent! Need £%d." % GACHA_COST
		status_lbl.add_theme_color_override("font_color", Color(1.0, 0.35, 0.35))
		return
	rent -= GACHA_COST
	_update_rent()
	status_lbl.text = ""

	_gacha_result = ITEMS[randi() % ITEMS.size()]
	var result := $HUD/GachaPanel/VBox/ResultPanel
	result.get_node("ResultIcon").texture = load("res://assets/sprites/items/" + _gacha_result["id"] + ".png")
	result.get_node("ResultName").text = _gacha_result["name"]
	result.get_node("ResultType").text = _gacha_result["type"]
	var rlbl: Label = result.get_node("ResultRarity")
	rlbl.text = _gacha_result["rarity"]
	rlbl.add_theme_color_override("font_color", _rarity_color(_gacha_result["rarity"]))
	result.get_node("ResultDesc").text = _gacha_result["desc"]
	result.visible = true
	$HUD/GachaPanel/VBox/BtnRoll.text = "ROLL AGAIN  (£%d)" % GACHA_COST

func _on_gacha_pickup() -> void:
	var item := _gacha_result
	_gacha_result = {}
	$HUD/GachaPanel.visible = false
	if inventory[0] == null:
		inventory[0] = item
		_update_inventory_display()
		get_tree().paused = false
	elif inventory[1] == null:
		inventory[1] = item
		_update_inventory_display()
		get_tree().paused = false
	else:
		_pending_item = item
		_open_slot_picker()

# ── HUD / Menu ────────────────────────────────────────────────────────────────

func _update_rent() -> void:
	$HUD/RentLabel.text = "Rent: £%d" % rent

func _on_menu_pressed() -> void:
	$HUD/PauseMenu.visible = true
	get_tree().paused = true

func _close_menu() -> void:
	$HUD/PauseMenu.visible = false
	get_tree().paused = false

func _on_options_pressed() -> void:
	pass

func _on_quit_pressed() -> void:
	$HUD/PauseMenu.visible = false
	$HUD/SaveConfirm.visible = true

func _on_save_yes() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/ui/MainScreen.tscn")

func _on_save_no() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/ui/MainScreen.tscn")
