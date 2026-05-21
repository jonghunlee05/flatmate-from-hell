extends Node2D

const SLOW_DURATION := 1.4
const CHAOS_ADD := 0.2

var _trip_area: Area2D

func setup(size: Vector2) -> void:
	var rect := ColorRect.new()
	rect.size = size
	rect.position = -size / 2.0
	rect.color = Color(0.1, 0.1, 0.5, 0.55)
	add_child(rect)

	var lbl := Label.new()
	lbl.text = "~~cable~~"
	lbl.add_theme_font_size_override("font_size", 9)
	lbl.add_theme_color_override("font_color", Color(0.4, 0.4, 1.0))
	lbl.position = Vector2(-size.x / 2.0, -size.y / 2.0 - 10)
	add_child(lbl)

	_trip_area = Area2D.new()
	_trip_area.collision_layer = 0
	_trip_area.collision_mask = 1
	add_child(_trip_area)

	var ac := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = size
	ac.shape = shape
	_trip_area.add_child(ac)
	_trip_area.body_entered.connect(_on_entered)

func _on_entered(body: Node2D) -> void:
	if body.has_method("apply_slow"):
		body.apply_slow(SLOW_DURATION)
		RunData.add_chaos(CHAOS_ADD)
