extends CanvasLayer

# ── Layout (1280 × 720) ───────────────────────────────────────────────────────
#
#   TOP LEFT    HP     bar  n / max
#               Mana   bar  n / max
#               Shield bar  n / max
#               ── gap ──
#               Chaos  bar  n.n / 10
#
#   TOP RIGHT   ⚡ peace_points   [Menu]
#               Phase · Timer
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

var _pp_label    : Label   # peace points
var _phase_label : Label
var _timer_label : Label

var _boss_hp_bar   : ProgressBar
var _boss_hp_panel : PanelContainer
var _overlay_label : Label
var _chaos_tint    : ColorRect

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_ui()

func _build_ui() -> void:

	# ── TOP LEFT — HP / Mana / Shield ────────────────────────────────────────
	var left := VBoxContainer.new()
	left.position = Vector2(16, 14)
	left.add_theme_constant_override("separation", 6)
	add_child(left)

	var h  := _make_bar("HP",     Color(0.9, 0.2, 0.2), left)
	_hp_bar = h[0]; _hp_val = h[1]
	var m  := _make_bar("Mana",   Color(0.3, 0.5, 1.0), left)
	_mana_bar = m[0]; _mana_val = m[1]
	var s  := _make_bar("Shield", Color(0.4, 0.85, 1.0), left)
	_shield_bar = s[0]; _shield_val = s[1]

	# Chaos below — ambient stat, visually separated
	var gap := Control.new()
	gap.custom_minimum_size = Vector2(0, 6)
	left.add_child(gap)

	var ch := _make_bar("Chaos",  Color(0.85, 0.4, 0.0), left)
	_chaos_bar = ch[0]; _chaos_val = ch[1]

	# ── TOP RIGHT — Peace Points + Menu ──────────────────────────────────────
	var top_right := HBoxContainer.new()
	top_right.position = Vector2(1020, 14)
	top_right.add_theme_constant_override("separation", 10)
	add_child(top_right)

	_pp_label = Label.new()
	_pp_label.add_theme_font_size_override("font_size", 18)
	_pp_label.add_theme_color_override("font_color", Color(0.5, 1.0, 0.6))
	_pp_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_right.add_child(_pp_label)

	var menu_btn := Button.new()
	menu_btn.text = "Menu"
	menu_btn.custom_minimum_size = Vector2(64, 28)
	menu_btn.add_theme_font_size_override("font_size", 13)
	menu_btn.pressed.connect(_on_menu_pressed)
	top_right.add_child(menu_btn)

	# Phase + timer below the peace-points / menu row
	var phase_row := VBoxContainer.new()
	phase_row.position = Vector2(1020, 50)
	phase_row.add_theme_constant_override("separation", 2)
	add_child(phase_row)

	_phase_label = Label.new()
	_phase_label.add_theme_font_size_override("font_size", 14)
	_phase_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	_phase_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	phase_row.add_child(_phase_label)

	_timer_label = Label.new()
	_timer_label.add_theme_font_size_override("font_size", 13)
	_timer_label.add_theme_color_override("font_color", Color(0.6, 0.8, 0.6))
	_timer_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	phase_row.add_child(_timer_label)

	# ── Boss HP bar ───────────────────────────────────────────────────────────
	_boss_hp_panel = PanelContainer.new()
	_boss_hp_panel.set_anchors_preset(Control.PRESET_TOP_WIDE)
	_boss_hp_panel.position = Vector2(200, 680)
	_boss_hp_panel.custom_minimum_size = Vector2(880, 32)
	_boss_hp_panel.visible = false
	add_child(_boss_hp_panel)

	var bvbox := VBoxContainer.new()
	_boss_hp_panel.add_child(bvbox)

	var blbl := Label.new()
	blbl.text = "LOUD GAMER"
	blbl.add_theme_font_size_override("font_size", 11)
	blbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	bvbox.add_child(blbl)

	_boss_hp_bar = ProgressBar.new()
	_boss_hp_bar.custom_minimum_size = Vector2(0, 14)
	_boss_hp_bar.show_percentage = false
	var bstyle := StyleBoxFlat.new()
	bstyle.bg_color = Color(0.8, 0.1, 0.6)
	_boss_hp_bar.add_theme_stylebox_override("fill", bstyle)
	bvbox.add_child(_boss_hp_bar)

	# ── Centre overlay ────────────────────────────────────────────────────────
	_overlay_label = Label.new()
	_overlay_label.set_anchors_preset(Control.PRESET_CENTER)
	_overlay_label.position = Vector2(440, 300)
	_overlay_label.custom_minimum_size = Vector2(400, 80)
	_overlay_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_overlay_label.add_theme_font_size_override("font_size", 40)
	_overlay_label.visible = false
	add_child(_overlay_label)

	# ── Chaos screen tint ─────────────────────────────────────────────────────
	_chaos_tint = ColorRect.new()
	_chaos_tint.set_anchors_preset(Control.PRESET_FULL_RECT)
	_chaos_tint.color = Color(1.0, 0.1, 0.0, 0.0)
	_chaos_tint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_chaos_tint)

# ── Bar factory ───────────────────────────────────────────────────────────────

func _make_bar(label_text: String, fill_color: Color, parent: Node) -> Array:
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 6)
	parent.add_child(hbox)

	var lbl := Label.new()
	lbl.text = label_text
	lbl.custom_minimum_size = Vector2(52, 0)
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

# ── Update loop ───────────────────────────────────────────────────────────────

func _process(_delta: float) -> void:
	_hp_bar.max_value     = RunData.hp_max
	_hp_bar.value         = RunData.hp
	_hp_val.text          = "%d / %d" % [int(RunData.hp), int(RunData.hp_max)]

	_mana_bar.max_value   = RunData.mana_max
	_mana_bar.value       = RunData.mana
	_mana_val.text        = "%d / %d" % [int(RunData.mana), int(RunData.mana_max)]

	_shield_bar.max_value = RunData.shield_max
	_shield_bar.value     = RunData.shield
	_shield_val.text      = "%d / %d" % [int(RunData.shield), int(RunData.shield_max)]

	_chaos_bar.max_value  = RunData.chaos_max
	_chaos_bar.value      = RunData.chaos
	_chaos_val.text       = "%.1f / %d" % [RunData.chaos, int(RunData.chaos_max)]

	_pp_label.text        = "⚡ %d" % RunData.peace_points
	_phase_label.text     = RunData.PHASE_NAMES[RunData.current_phase]
	_chaos_tint.color.a   = (RunData.chaos / RunData.chaos_max) * 0.18

# ── Callbacks ─────────────────────────────────────────────────────────────────

func _on_menu_pressed() -> void:
	get_tree().paused = not get_tree().paused

func update_phase_timer(t: float) -> void:
	_timer_label.text = "%ds" % int(ceili(t))

func show_boss_bar(max_hp: float) -> void:
	_boss_hp_bar.max_value = max_hp
	_boss_hp_bar.value     = max_hp
	_boss_hp_panel.visible = true
	_timer_label.text      = ""

func update_boss_hp(hp: float) -> void:
	_boss_hp_bar.value = hp

func show_overlay(text: String, color: Color) -> void:
	_overlay_label.text = text
	_overlay_label.add_theme_color_override("font_color", color)
	_overlay_label.visible = true
