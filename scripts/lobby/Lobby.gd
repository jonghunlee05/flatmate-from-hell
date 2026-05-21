extends Node2D

const INTERACT_RADIUS = 100.0
const FLOOR_ITEM_PICKUP_RADIUS = 60.0
const FLOOR_ITEM_LIFETIME = 30.0

var rent: int = 20
var near_interactable: String = ""
var selected_character: String = "introvert"

# Stat bars — top-left HUD, built in _build_stat_bars()
var _hp_bar     : ProgressBar = null
var _hp_val     : Label       = null
var _mana_bar   : ProgressBar = null
var _mana_val   : Label       = null
var _shield_bar : ProgressBar = null
var _shield_val : Label       = null
var _chaos_bar  : ProgressBar = null
var _chaos_val  : Label       = null
var _e_was_pressed := false
var inventory: Array = [null, null]
var _pending_item: Dictionary = {}
var _gacha_result: Dictionary = {}
var _drop_slot: int = -1
var _floor_items: Array = []
var _near_floor_item_idx: int = -1
var _active_slot: int = 0

const INTERACTABLES := {
	"Character Wardrobe": Vector2(550, 60),
	"Item Shelf":         Vector2(112, 330),
	"Upgrade Desk":       Vector2(990, 330),
	"Exit Door":          Vector2(1010, 646),
	"Gachapon":           Vector2(550, 575),
}

const GACHA_COST := 5

const UPGRADES := [
	{"id": "hp_i",     "name": "HP I",    "category": "Survival", "desc": "+2 max HP",                  "cost": 15},
	{"id": "speed_i",        "name": "Speed I",        "category": "Mobility", "desc": "+5% movement speed",               "cost": 15},
	{"id": "rent_saver",     "name": "Rent Saver",     "category": "Rent",     "desc": "Keep 50% Rent on death",           "cost": 20},
	{"id": "bigger_pockets", "name": "Bigger Pockets", "category": "Loadout",  "desc": "Start each run with a Coffee Mug", "cost": 10},
]

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
	{"id": "coffee_mug",        "name": "Coffee Mug",        "type": "Recovery",        "rarity": "Common",    "desc": "Restores small Cortisol. Temporary focus buff after use."},
	{"id": "spray_bottle",      "name": "Spray Bottle",      "type": "Utility Active",  "rarity": "Common",    "desc": "Stuns and confuses enemies. Interrupts charges and arguments."},
	{"id": "roomba",            "name": "Roomba",            "type": "Companion",       "rarity": "Legendary", "desc": "Bumps enemies, cleans hazards, blocks you at worst moments."},
	{"id": "rubber_duck",       "name": "Rubber Duck",       "type": "Chaos",           "rarity": "Cursed",    "desc": "Random stress manipulation. Nobody knows what it does. That's the point."},
]

func _ready() -> void:
	RunData.reset()  # fully restore HP/Mana/Shield on lobby load (respawn)
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
	for i in range(2):
		$HUD/InventoryBar.get_node("Slot%d/HBox/Icon" % (i + 1)).mouse_filter = Control.MOUSE_FILTER_PASS
		$HUD/InventoryBar.get_node("Slot%d/HBox/Label" % (i + 1)).mouse_filter = Control.MOUSE_FILTER_PASS
		$HUD/InventoryBar.get_node("Slot%d/HBox" % (i + 1)).mouse_filter = Control.MOUSE_FILTER_PASS
	$HUD/DropConfirm/VBox/HBox/BtnDrop.pressed.connect(_on_drop_confirm)
	$HUD/DropConfirm/VBox/HBox/BtnKeep.pressed.connect(_on_drop_cancel)
	$HUD/UpgradePanel/VBox/BtnClose.pressed.connect(_close_upgrade_desk)
	$HUD/ExitConfirm/VBox/HBox/BtnEnter.pressed.connect(_on_exit_enter)
	$HUD/ExitConfirm/VBox/HBox/BtnBack.pressed.connect(_close_exit_confirm)
	$HUD/GachaPanel/VBox/BtnRoll.pressed.connect(_on_gacha_roll)
	$HUD/GachaPanel/VBox/ResultPanel/BtnGachaPickup.pressed.connect(_on_gacha_pickup)
	$HUD/GachaPanel/VBox/BtnGachaClose.pressed.connect(_close_gacha)
	_update_rent()
	_update_inventory_display()
	_build_stat_bars()

func _build_stat_bars() -> void:
	var vbox := VBoxContainer.new()
	vbox.position = Vector2(16, 14)
	vbox.add_theme_constant_override("separation", 6)
	$HUD.add_child(vbox)

	var h  := _make_stat_bar("HP",     Color(0.9, 0.2, 0.2), vbox)
	_hp_bar = h[0]; _hp_val = h[1]
	var m  := _make_stat_bar("Mana",   Color(0.3, 0.5, 1.0), vbox)
	_mana_bar = m[0]; _mana_val = m[1]
	var s  := _make_stat_bar("Shield", Color(0.4, 0.85, 1.0), vbox)
	_shield_bar = s[0]; _shield_val = s[1]

	# Chaos sits below with a small gap — it's ambient, not a personal stat
	var gap := Control.new()
	gap.custom_minimum_size = Vector2(0, 6)
	vbox.add_child(gap)

	var ch := _make_stat_bar("Chaos",  Color(0.85, 0.4, 0.0), vbox)
	_chaos_bar = ch[0]; _chaos_val = ch[1]

func _make_stat_bar(label_text: String, fill_color: Color, parent: Node) -> Array:
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 6)
	parent.add_child(hbox)

	var lbl := Label.new()
	lbl.text = label_text
	lbl.custom_minimum_size = Vector2(60, 0)
	lbl.add_theme_font_size_override("font_size", 12)
	hbox.add_child(lbl)

	var bar := ProgressBar.new()
	bar.custom_minimum_size = Vector2(120, 18)
	bar.show_percentage = false

	var fill := StyleBoxFlat.new()
	fill.bg_color = fill_color
	bar.add_theme_stylebox_override("fill", fill)

	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0.1, 0.1, 0.1, 0.8)
	bar.add_theme_stylebox_override("background", bg)

	hbox.add_child(bar)

	var val_lbl := Label.new()
	val_lbl.custom_minimum_size = Vector2(44, 0)
	val_lbl.add_theme_font_size_override("font_size", 12)
	val_lbl.add_theme_color_override("font_color", Color(0.95, 0.95, 0.95))
	val_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	hbox.add_child(val_lbl)

	return [bar, val_lbl]

func _process(delta: float) -> void:
	_check_proximity()
	_process_floor_items(delta)
	_update_stat_bars()

func _update_stat_bars() -> void:
	if _hp_bar == null:
		return
	_hp_bar.max_value    = RunData.hp_max
	_hp_bar.value        = RunData.hp
	_hp_val.text         = "%d / %d" % [int(RunData.hp), int(RunData.hp_max)]
	_mana_bar.max_value  = RunData.mana_max
	_mana_bar.value      = RunData.mana
	_mana_val.text       = "%d / %d" % [int(RunData.mana), int(RunData.mana_max)]
	_shield_bar.max_value = RunData.shield_max
	_shield_bar.value     = RunData.shield
	_shield_val.text      = "%d / %d" % [int(RunData.shield), int(RunData.shield_max)]
	_chaos_bar.max_value  = RunData.chaos_max
	_chaos_bar.value      = RunData.chaos
	_chaos_val.text       = "%.1f / %d" % [RunData.chaos, int(RunData.chaos_max)]
	var e_pressed := Input.is_physical_key_pressed(KEY_E)
	if e_pressed and not _e_was_pressed:
		if near_interactable != "":
			_interact(near_interactable)
		elif _near_floor_item_idx >= 0:
			_pickup_floor_item(_near_floor_item_idx)
	_e_was_pressed = e_pressed

func _check_proximity() -> void:
	var player_pos: Vector2 = $Player.position
	near_interactable = ""
	for interactable in INTERACTABLES:
		if player_pos.distance_to(INTERACTABLES[interactable]) < INTERACT_RADIUS:
			near_interactable = interactable
			break

	_near_floor_item_idx = -1
	if near_interactable == "":
		for i in range(_floor_items.size()):
			if player_pos.distance_to(_floor_items[i]["node"].position) < FLOOR_ITEM_PICKUP_RADIUS:
				_near_floor_item_idx = i
				break

	var any_open: bool = (
		$HUD/CharacterSelect.visible or $HUD/ItemSelect.visible
		or $HUD/SlotPicker.visible or $HUD/GachaPanel.visible
		or $HUD/DropConfirm.visible or $HUD/UpgradePanel.visible
		or $HUD/ExitConfirm.visible
	)
	if any_open:
		$HUD/InteractPrompt.visible = false
	elif near_interactable != "":
		$HUD/InteractPrompt.text = "Press E to interact"
		$HUD/InteractPrompt.visible = true
	elif _near_floor_item_idx >= 0:
		$HUD/InteractPrompt.text = "Press E to pick up " + _floor_items[_near_floor_item_idx]["item"]["name"]
		$HUD/InteractPrompt.visible = true
	else:
		$HUD/InteractPrompt.visible = false

func _interact(target: String) -> void:
	match target:
		"Character Wardrobe": _open_character_select()
		"Item Shelf":         _open_item_select()
		"Gachapon":           _open_gacha()
		"Upgrade Desk":       _open_upgrade_desk()
		"Exit Door":          _open_exit_confirm()

# ── Character select ──────────────────────────────────────────────────────────

func _open_character_select() -> void:
	$HUD/CharacterSelect.visible = true
	get_tree().paused = true

func _close_character_select() -> void:
	$HUD/CharacterSelect.visible = false
	get_tree().paused = false

func _select_character(key: String) -> void:
	selected_character = key
	RunData.set_character(key)
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
	get_tree().paused = true

func _on_slot_replace(slot: int) -> void:
	inventory[slot] = _pending_item
	_pending_item = {}
	_active_slot = slot
	_update_inventory_display()
	$HUD/SlotPicker.visible = false
	get_tree().paused = false

func _on_slot_cancel() -> void:
	_pending_item = {}
	$HUD/SlotPicker.visible = false
	get_tree().paused = false

func _on_slot_gui_input(event: InputEvent, slot: int) -> void:
	if not (event is InputEventMouseButton and event.pressed):
		return
	if event.button_index == MOUSE_BUTTON_LEFT:
		if _active_slot != slot:
			_active_slot = slot
			_update_inventory_display()
	elif event.button_index == MOUSE_BUTTON_RIGHT:
		if inventory[slot] != null:
			_drop_slot = slot
			$HUD/DropConfirm/VBox/Label.text = "Drop " + inventory[slot]["name"] + "?"
			$HUD/DropConfirm.visible = true
			get_tree().paused = true

func _on_drop_confirm() -> void:
	var dropped_item: Dictionary = inventory[_drop_slot]
	inventory[_drop_slot] = null
	if _drop_slot == _active_slot:
		var other := 1 - _active_slot
		if inventory[other] != null:
			_active_slot = other
	_drop_slot = -1
	_update_inventory_display()
	$HUD/DropConfirm.visible = false
	get_tree().paused = false
	_spawn_floor_item(dropped_item)

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
		slot.add_theme_stylebox_override("panel", _slot_style(i == _active_slot))
	var held_id: String = inventory[_active_slot]["id"] if inventory[_active_slot] != null else ""
	$Player.set_held_item(held_id)

func _slot_style(active: bool) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(0.12, 0.12, 0.12, 0.88)
	s.set_border_width_all(3)
	s.border_color = Color(1.0, 0.82, 0.2) if active else Color(0.35, 0.35, 0.35)
	s.set_corner_radius_all(4)
	return s

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

# ── Exit Door ─────────────────────────────────────────────────────────────────

func _open_exit_confirm() -> void:
	$HUD/ExitConfirm.visible = true
	get_tree().paused = true

func _close_exit_confirm() -> void:
	$HUD/ExitConfirm.visible = false
	get_tree().paused = false

func _on_exit_enter() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/game/Game.tscn")

# ── Upgrade Desk ──────────────────────────────────────────────────────────────

func _open_upgrade_desk() -> void:
	_build_upgrade_panel()
	$HUD/UpgradePanel.visible = true
	get_tree().paused = true

func _close_upgrade_desk() -> void:
	$HUD/UpgradePanel.visible = false
	get_tree().paused = false

func _build_upgrade_panel() -> void:
	var list := $HUD/UpgradePanel/VBox/Scroll/CardList
	for child in list.get_children():
		child.queue_free()

	var current_category := ""
	for upgrade in UPGRADES:
		if upgrade["category"] != current_category:
			current_category = upgrade["category"]
			var cat_label := Label.new()
			cat_label.text = current_category.to_upper()
			cat_label.add_theme_font_size_override("font_size", 12)
			cat_label.add_theme_color_override("font_color", Color(0.55, 0.55, 0.55))
			list.add_child(cat_label)

		var row := HBoxContainer.new()
		row.custom_minimum_size = Vector2(0, 56)
		row.add_theme_constant_override("separation", 12)
		list.add_child(row)

		var info := VBoxContainer.new()
		info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(info)

		var name_lbl := Label.new()
		name_lbl.text = upgrade["name"]
		name_lbl.add_theme_font_size_override("font_size", 15)
		info.add_child(name_lbl)

		var desc_lbl := Label.new()
		desc_lbl.text = upgrade["desc"]
		desc_lbl.add_theme_font_size_override("font_size", 11)
		desc_lbl.add_theme_color_override("font_color", Color(0.75, 0.75, 0.75))
		info.add_child(desc_lbl)

		var owned: bool = UpgradeData.purchased.get(upgrade["id"], false)
		var btn := Button.new()
		btn.custom_minimum_size = Vector2(110, 44)
		if owned:
			btn.text = "OWNED"
			btn.disabled = true
		else:
			btn.text = "BUY  £%d" % upgrade["cost"]
			btn.pressed.connect(_on_upgrade_buy.bind(upgrade))
		row.add_child(btn)

func _on_upgrade_buy(upgrade: Dictionary) -> void:
	if rent < upgrade["cost"]:
		return
	rent -= upgrade["cost"]
	UpgradeData.purchased[upgrade["id"]] = true
	_update_rent()
	_build_upgrade_panel()

# ── Floor items ───────────────────────────────────────────────────────────────

func _spawn_floor_item(item: Dictionary) -> void:
	var sprite := Sprite2D.new()
	sprite.texture = load("res://assets/sprites/items/" + item["id"] + ".png")
	sprite.position = $Player.position + Vector2(28, 24)
	sprite.scale = Vector2(1.8, 1.8)
	add_child(sprite)
	_floor_items.append({"item": item, "node": sprite, "timer": FLOOR_ITEM_LIFETIME})

func _process_floor_items(delta: float) -> void:
	var i := _floor_items.size() - 1
	while i >= 0:
		_floor_items[i]["timer"] -= delta
		if _floor_items[i]["timer"] <= 0.0:
			_floor_items[i]["node"].queue_free()
			_floor_items.remove_at(i)
		i -= 1

func _pickup_floor_item(idx: int) -> void:
	var item: Dictionary = _floor_items[idx]["item"]
	_floor_items[idx]["node"].queue_free()
	_floor_items.remove_at(idx)
	_near_floor_item_idx = -1
	if inventory[0] == null:
		inventory[0] = item
		_update_inventory_display()
	elif inventory[1] == null:
		inventory[1] = item
		_update_inventory_display()
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
