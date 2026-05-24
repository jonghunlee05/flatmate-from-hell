extends Node2D

# Placeholder mess tile — hold L for 2 seconds to clean it.

const CLEAN_TIME := 2.0

var _used        := false
var _prompt      : Label
var _bar_bg      : ColorRect
var _bar_fill    : ColorRect

func _ready() -> void:
	add_to_group("mess")

	# Dirty floor stain
	var rect := ColorRect.new()
	rect.size = Vector2(48, 32)
	rect.position = Vector2(-24, -16)
	rect.color = Color(0.45, 0.28, 0.10, 0.85)
	add_child(rect)

	# Inner darker smudge
	var smudge := ColorRect.new()
	smudge.size = Vector2(28, 16)
	smudge.position = Vector2(-14, -8)
	smudge.color = Color(0.30, 0.16, 0.06, 0.9)
	add_child(smudge)

	# Label
	var lbl := Label.new()
	lbl.text = "~~mess~~"
	lbl.add_theme_font_size_override("font_size", 9)
	lbl.add_theme_color_override("font_color", Color(0.8, 0.6, 0.3, 0.7))
	lbl.position = Vector2(-18, -28)
	add_child(lbl)

	# Prompt
	_prompt = Label.new()
	_prompt.text = "[L] Hold to Clean"
	_prompt.add_theme_font_size_override("font_size", 11)
	_prompt.add_theme_color_override("font_color", Color(0.4, 1.0, 0.6))
	_prompt.position = Vector2(-38, -44)
	_prompt.visible = false
	add_child(_prompt)

	# Progress bar background
	_bar_bg = ColorRect.new()
	_bar_bg.size = Vector2(48, 6)
	_bar_bg.position = Vector2(-24, -56)
	_bar_bg.color = Color(0.15, 0.15, 0.15, 0.85)
	_bar_bg.visible = false
	add_child(_bar_bg)

	# Progress bar fill
	_bar_fill = ColorRect.new()
	_bar_fill.size = Vector2(0, 6)
	_bar_fill.position = Vector2(-24, -56)
	_bar_fill.color = Color(0.3, 1.0, 0.45)
	_bar_fill.visible = false
	add_child(_bar_fill)

func show_prompt(show: bool) -> void:
	if _prompt:
		_prompt.visible = show and not _used

func set_clean_progress(t: float) -> void:
	# t is 0.0 → 1.0
	if _used:
		return
	var showing := t > 0.0
	_bar_bg.visible   = showing
	_bar_fill.visible = showing
	_bar_fill.size.x  = 48.0 * t

func clean() -> void:
	if _used:
		return
	_used = true
	queue_free()
