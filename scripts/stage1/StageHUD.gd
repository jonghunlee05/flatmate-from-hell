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

var _pp_label    : Label   # peace points
var _phase_label : Label
var _timer_label : Label

var _boss_hp_bar   : ProgressBar
var _boss_hp_panel : PanelContainer
var _overlay_label : Label
var _chaos_tint    : ColorRect

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	StatusBar.show_bar()
	StatusBar.show_chaos(true)
	PauseMenu.show_ui()
	_build_ui()

func _build_ui() -> void:

	# ── TOP RIGHT — Peace Points + Menu ──────────────────────────────────────
	var top_right := HBoxContainer.new()
	top_right.position = Vector2(1020, 14)
	top_right.add_theme_constant_override("separation", 10)
	add_child(top_right)

	var cc_icon := TextureRect.new()
	cc_icon.texture = load("res://assets/sprites/ui/icon_calm_coin.png")
	cc_icon.custom_minimum_size = Vector2(48, 48)
	cc_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	cc_icon.expand_mode  = TextureRect.EXPAND_FIT_WIDTH_PROPORTIONAL
	top_right.add_child(cc_icon)

	_pp_label = Label.new()
	_pp_label.add_theme_font_size_override("font_size", 18)
	_pp_label.add_theme_color_override("font_color", Color(0.5, 1.0, 0.6))
	_pp_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	top_right.add_child(_pp_label)


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

# ── Update loop ───────────────────────────────────────────────────────────────

func _process(_delta: float) -> void:
	_pp_label.text      = "%d" % RunData.peace_points
	_phase_label.text   = RunData.PHASE_NAMES[RunData.current_phase]
	_chaos_tint.color.a = (RunData.chaos / RunData.chaos_max) * 0.18

# ── Callbacks ─────────────────────────────────────────────────────────────────

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
