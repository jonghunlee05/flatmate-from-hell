extends CanvasLayer

# ── Global Item Slot Bar ───────────────────────────────────────────────────────
#
#   Autoload CanvasLayer (layer 6) — shows the 4 equipped item slots.
#   Hidden by default. Stage 1 calls show_bar(); Lobby/Main hide it.
#   Reads from ItemSlots autoload.
#
# ─────────────────────────────────────────────────────────────────────────────

const SLOT_SIZE   := Vector2(40, 40)
const SLOT_LABELS := ["1 Clean", "2 Combat", "3 Flex", "P"]

var _slot_icons  : Array = []   # Array[TextureRect]
var _slot_panels : Array = []   # Array[PanelContainer]

func _ready() -> void:
	layer = 6
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
	_build()
	ItemSlots.slots_changed.connect(_refresh)

func show_bar() -> void:
	visible = true
	_refresh()

func hide_bar() -> void:
	visible = false

# ── Build ─────────────────────────────────────────────────────────────────────

func _build() -> void:
	var anchor := Control.new()
	anchor.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	anchor.position = Vector2(12, -8)
	anchor.grow_vertical   = Control.GROW_DIRECTION_BEGIN
	anchor.grow_horizontal = Control.GROW_DIRECTION_END
	add_child(anchor)

	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 6)
	hbox.position = Vector2(0, -int(SLOT_SIZE.y + 28))
	anchor.add_child(hbox)

	for i in range(4):
		var vbox := VBoxContainer.new()
		vbox.add_theme_constant_override("separation", 2)
		hbox.add_child(vbox)

		var lbl := Label.new()
		lbl.text = SLOT_LABELS[i]
		lbl.add_theme_font_size_override("font_size", 9)
		lbl.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
		lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(lbl)

		var panel := PanelContainer.new()
		panel.custom_minimum_size = SLOT_SIZE
		var style := StyleBoxFlat.new()
		style.bg_color          = Color(0.1, 0.1, 0.1, 0.75)
		style.border_color      = Color(0.4, 0.4, 0.4)
		style.set_border_width_all(2)
		style.set_corner_radius_all(4)
		panel.add_theme_stylebox_override("panel", style)
		vbox.add_child(panel)

		var icon := TextureRect.new()
		icon.custom_minimum_size = SLOT_SIZE
		icon.expand_mode  = TextureRect.EXPAND_IGNORE_SIZE
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		panel.add_child(icon)

		_slot_icons.append(icon)
		_slot_panels.append(panel)

# ── Refresh icons from ItemSlots ──────────────────────────────────────────────

func _refresh() -> void:
	var slots := [ItemSlots.slot1, ItemSlots.slot2, ItemSlots.slot3, ItemSlots.passive]
	for i in range(4):
		var item : Dictionary = slots[i]
		var icon : TextureRect = _slot_icons[i]
		var panel : PanelContainer = _slot_panels[i]
		if item.is_empty():
			icon.texture = null
			_set_panel_empty(panel)
		else:
			icon.texture = ItemSlots.get_icon_texture(item.get("id", ""))
			_set_panel_filled(panel)

func _set_panel_empty(panel: PanelContainer) -> void:
	var style := StyleBoxFlat.new()
	style.bg_color     = Color(0.1, 0.1, 0.1, 0.75)
	style.border_color = Color(0.4, 0.4, 0.4)
	style.set_border_width_all(2)
	style.set_corner_radius_all(4)
	panel.add_theme_stylebox_override("panel", style)

func _set_panel_filled(panel: PanelContainer) -> void:
	var style := StyleBoxFlat.new()
	style.bg_color     = Color(0.15, 0.15, 0.15, 0.85)
	style.border_color = Color(0.6, 0.85, 0.6)
	style.set_border_width_all(2)
	style.set_corner_radius_all(4)
	panel.add_theme_stylebox_override("panel", style)
