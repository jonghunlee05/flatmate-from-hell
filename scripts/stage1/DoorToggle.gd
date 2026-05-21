extends Node2D

var _blocker: StaticBody2D = null
var _vis: ColorRect = null
var _prompt: Label = null
var _is_open := true
var _locked_by: Array = []

func setup(size: Vector2) -> void:
	add_to_group("interactable")

	_blocker = StaticBody2D.new()
	_blocker.collision_layer = 0
	_blocker.collision_mask  = 0
	add_child(_blocker)

	var col   := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = size
	col.shape  = shape
	_blocker.add_child(col)

	_vis          = ColorRect.new()
	_vis.size     = size
	_vis.position = -size / 2.0
	_vis.color    = Color(0.55, 0.35, 0.15)
	_vis.visible  = false
	_blocker.add_child(_vis)

	_prompt = Label.new()
	_prompt.text = "[E] Close"
	_prompt.add_theme_font_size_override("font_size", 10)
	_prompt.add_theme_color_override("font_color", Color(1.0, 1.0, 0.7))
	_prompt.position = Vector2(-20, -24)
	_prompt.visible  = false
	add_child(_prompt)

func interact() -> void:
	if not _locked_by.is_empty():
		return
	_is_open             = not _is_open
	_vis.visible         = not _is_open
	_blocker.collision_layer = 0 if _is_open else 2
	_prompt.text = "[E] Close" if _is_open else "[E] Open"

func show_prompt(show: bool) -> void:
	if _prompt:
		_prompt.visible = show

func lock_by(room_id: String) -> void:
	if room_id not in _locked_by:
		_locked_by.append(room_id)

func unlock_by(room_id: String) -> void:
	_locked_by.erase(room_id)

func clear_locks() -> void:
	_locked_by.clear()
