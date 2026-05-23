extends CanvasLayer

# ── Global Pause Menu ─────────────────────────────────────────────────────────
#
#   Autoload CanvasLayer — menu button + pause panel + quit confirm.
#   Call show_menu_btn(false) on MainScreen to hide the button there.
#
# ─────────────────────────────────────────────────────────────────────────────

var _menu_btn     : Button
var _pause_panel  : PanelContainer
var _quit_confirm : PanelContainer

func _ready() -> void:
	layer = 20
	process_mode = Node.PROCESS_MODE_ALWAYS
	visible = false
	_build()

func show_ui() -> void:
	visible = true

func hide_ui() -> void:
	visible = false

func _build() -> void:
	# ── Menu button — top right ───────────────────────────────────────────────
	_menu_btn = Button.new()
	_menu_btn.text = "Menu"
	_menu_btn.custom_minimum_size = Vector2(80, 32)
	_menu_btn.add_theme_font_size_override("font_size", 13)
	_menu_btn.process_mode = Node.PROCESS_MODE_ALWAYS
	_menu_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_menu_btn.position = Vector2(-92, 12)
	_menu_btn.pressed.connect(_on_menu_pressed)
	add_child(_menu_btn)

	# ── Pause panel — centred ─────────────────────────────────────────────────
	_pause_panel = PanelContainer.new()
	_pause_panel.process_mode = Node.PROCESS_MODE_ALWAYS
	_pause_panel.set_anchors_preset(Control.PRESET_CENTER)
	_pause_panel.visible = false
	add_child(_pause_panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 12)
	vbox.custom_minimum_size = Vector2(220, 0)
	_pause_panel.add_child(vbox)

	var title := Label.new()
	title.text = "MENU"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 20)
	vbox.add_child(title)

	var btn_resume := Button.new()
	btn_resume.text = "Resume"
	btn_resume.custom_minimum_size = Vector2(200, 48)
	btn_resume.process_mode = Node.PROCESS_MODE_ALWAYS
	btn_resume.pressed.connect(_on_resume)
	vbox.add_child(btn_resume)

	var btn_options := Button.new()
	btn_options.text = "Options"
	btn_options.custom_minimum_size = Vector2(200, 48)
	btn_options.process_mode = Node.PROCESS_MODE_ALWAYS
	btn_options.pressed.connect(_on_options)
	vbox.add_child(btn_options)

	var btn_quit := Button.new()
	btn_quit.text = "Quit"
	btn_quit.custom_minimum_size = Vector2(200, 48)
	btn_quit.process_mode = Node.PROCESS_MODE_ALWAYS
	btn_quit.pressed.connect(_on_quit)
	vbox.add_child(btn_quit)

	# ── Quit confirm panel ────────────────────────────────────────────────────
	_quit_confirm = PanelContainer.new()
	_quit_confirm.process_mode = Node.PROCESS_MODE_ALWAYS
	_quit_confirm.set_anchors_preset(Control.PRESET_CENTER)
	_quit_confirm.visible = false
	add_child(_quit_confirm)

	var cvbox := VBoxContainer.new()
	cvbox.add_theme_constant_override("separation", 16)
	cvbox.custom_minimum_size = Vector2(260, 0)
	_quit_confirm.add_child(cvbox)

	var clbl := Label.new()
	clbl.text = "Quit to main screen?"
	clbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	clbl.add_theme_font_size_override("font_size", 18)
	cvbox.add_child(clbl)

	var chbox := HBoxContainer.new()
	chbox.add_theme_constant_override("separation", 12)
	chbox.alignment = BoxContainer.ALIGNMENT_CENTER
	cvbox.add_child(chbox)

	var btn_yes := Button.new()
	btn_yes.text = "Yes"
	btn_yes.custom_minimum_size = Vector2(120, 44)
	btn_yes.process_mode = Node.PROCESS_MODE_ALWAYS
	btn_yes.pressed.connect(_on_quit_yes)
	chbox.add_child(btn_yes)

	var btn_no := Button.new()
	btn_no.text = "No"
	btn_no.custom_minimum_size = Vector2(120, 44)
	btn_no.process_mode = Node.PROCESS_MODE_ALWAYS
	btn_no.pressed.connect(_on_quit_no)
	chbox.add_child(btn_no)

# ── Callbacks ─────────────────────────────────────────────────────────────────

func _on_menu_pressed() -> void:
	get_tree().paused = true
	_pause_panel.visible = true

func _on_resume() -> void:
	_pause_panel.visible = false
	get_tree().paused = false

func _on_options() -> void:
	pass  # stub

func _on_quit() -> void:
	_pause_panel.visible = false
	_quit_confirm.visible = true

func _on_quit_yes() -> void:
	get_tree().paused = false
	_quit_confirm.visible = false
	get_tree().change_scene_to_file("res://scenes/ui/MainScreen.tscn")

func _on_quit_no() -> void:
	_quit_confirm.visible = false
	_pause_panel.visible = true
