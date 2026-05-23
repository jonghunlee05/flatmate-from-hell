extends CanvasLayer

# ── Global Status Bar ─────────────────────────────────────────────────────────
#
#   Autoload CanvasLayer — always visible, reads from RunData every frame.
#   Shown in Lobby and in-game. Chaos row hidden in Lobby, shown in-game.
#
# ─────────────────────────────────────────────────────────────────────────────

var _hp_bar     : ProgressBar
var _hp_val     : Label
var _mana_bar   : ProgressBar
var _mana_val   : Label
var _shield_bar : ProgressBar
var _shield_val : Label
var _chaos_bar  : ProgressBar
var _chaos_val  : Label
var _chaos_row  : Control   # the full HBox row — toggled visible/hidden

func _ready() -> void:
	layer = 5
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false   # hidden by default — Lobby/Game call show_bar()
	_build()

func show_bar() -> void:
	visible = true

func hide_bar() -> void:
	visible = false

func _build() -> void:
	# Dark rounded panel
	var panel := PanelContainer.new()
	panel.position = Vector2(10, 10)
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color                   = Color(0.08, 0.08, 0.08, 0.82)
	panel_style.corner_radius_top_left     = 6
	panel_style.corner_radius_top_right    = 6
	panel_style.corner_radius_bottom_left  = 6
	panel_style.corner_radius_bottom_right = 6
	panel_style.set_content_margin_all(8)
	panel.add_theme_stylebox_override("panel", panel_style)
	add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 5)
	panel.add_child(vbox)

	# Nerve (HP) — red
	var h := _make_bar("res://assets/sprites/ui/icon_nerve.png",    Color(0.9, 0.2, 0.2),  vbox)
	_hp_bar = h[0]; _hp_val = h[1]

	# Energy (Mana) — blue
	var m := _make_bar("res://assets/sprites/ui/icon_energy.png",   Color(0.3, 0.5, 1.0),  vbox)
	_mana_bar = m[0]; _mana_val = m[1]

	# Patience (Shield) — cyan
	var s := _make_bar("res://assets/sprites/ui/icon_patience.png", Color(0.4, 0.85, 1.0), vbox)
	_shield_bar = s[0]; _shield_val = s[1]

	# Chaos — orange, hidden in lobby
	var gap := Control.new()
	gap.custom_minimum_size = Vector2(0, 4)
	vbox.add_child(gap)

	var ch := _make_bar("res://assets/sprites/ui/icon_chaos.png", Color(0.85, 0.4, 0.0), vbox)
	_chaos_bar = ch[0]; _chaos_val = ch[1]
	_chaos_row = _chaos_bar.get_parent()
	_chaos_row.visible = false

func _make_bar(icon_path: String, fill_color: Color, parent: Node) -> Array:
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 6)
	hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	parent.add_child(hbox)

	if icon_path != "":
		var icon := TextureRect.new()
		icon.texture = load(icon_path)
		icon.custom_minimum_size = Vector2(24, 24)
		icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		icon.expand_mode  = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
		hbox.add_child(icon)
	else:
		var spacer := Control.new()
		spacer.custom_minimum_size = Vector2(24, 24)
		hbox.add_child(spacer)

	var bar := ProgressBar.new()
	bar.custom_minimum_size = Vector2(140, 24)
	bar.show_percentage = false

	var fill := StyleBoxFlat.new()
	fill.bg_color                   = fill_color
	fill.corner_radius_top_left     = 3
	fill.corner_radius_top_right    = 3
	fill.corner_radius_bottom_left  = 3
	fill.corner_radius_bottom_right = 3
	bar.add_theme_stylebox_override("fill", fill)

	var bg := StyleBoxFlat.new()
	bg.bg_color                   = Color(0.08, 0.08, 0.08, 0.9)
	bg.corner_radius_top_left     = 3
	bg.corner_radius_top_right    = 3
	bg.corner_radius_bottom_left  = 3
	bg.corner_radius_bottom_right = 3
	bar.add_theme_stylebox_override("background", bg)

	hbox.add_child(bar)

	var val_lbl := Label.new()
	val_lbl.custom_minimum_size        = Vector2(52, 0)
	val_lbl.add_theme_font_size_override("font_size", 12)
	val_lbl.add_theme_color_override("font_color", Color(0.95, 0.95, 0.95))
	val_lbl.horizontal_alignment       = HORIZONTAL_ALIGNMENT_LEFT
	val_lbl.vertical_alignment         = VERTICAL_ALIGNMENT_CENTER
	hbox.add_child(val_lbl)

	return [bar, val_lbl]

func _process(_delta: float) -> void:
	_hp_bar.max_value     = RunData.hp_max
	_hp_bar.value         = RunData.hp
	_hp_val.text          = "%d / %d" % [int(RunData.hp),     int(RunData.hp_max)]

	_mana_bar.max_value   = RunData.mana_max
	_mana_bar.value       = RunData.mana
	_mana_val.text        = "%d / %d" % [int(RunData.mana),   int(RunData.mana_max)]

	_shield_bar.max_value = RunData.shield_max
	_shield_bar.value     = RunData.shield
	_shield_val.text      = "%d / %d" % [int(RunData.shield), int(RunData.shield_max)]

	_chaos_bar.max_value  = RunData.chaos_max
	_chaos_bar.value      = RunData.chaos
	_chaos_val.text       = "%.1f / %d" % [RunData.chaos, int(RunData.chaos_max)]

# ── Public API ────────────────────────────────────────────────────────────────

func show_chaos(visible: bool) -> void:
	if _chaos_row:
		_chaos_row.visible = visible
