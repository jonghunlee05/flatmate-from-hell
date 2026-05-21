extends Node2D

const DAMAGE := 1.4
const CHAOS_ADD := 0.4
const DAMAGE_RADIUS := 30.0
const MIN_INTERVAL := 3.0
const MAX_INTERVAL := 6.0
const ACTIVE_DURATION := 0.5

var _timer := 0.0
var _active := false
var _body: ColorRect

func _ready() -> void:
	_timer = randf_range(MIN_INTERVAL, MAX_INTERVAL)

	_body = ColorRect.new()
	_body.size = Vector2(24, 24)
	_body.position = Vector2(-12, -12)
	_body.color = Color(0.15, 0.15, 0.15)
	add_child(_body)

	var lbl := Label.new()
	lbl.text = "⚡"
	lbl.add_theme_font_size_override("font_size", 14)
	lbl.position = Vector2(-9, -12)
	add_child(lbl)

func _process(delta: float) -> void:
	_timer -= delta
	if not _active and _timer <= 0.0:
		_activate()
	elif _active and _timer <= 0.0:
		_deactivate()

func _activate() -> void:
	_active = true
	_timer = ACTIVE_DURATION
	_body.color = Color(1.0, 0.9, 0.1)

	# Distance-based damage
	for body in get_tree().get_nodes_in_group("player"):
		if is_instance_valid(body) and body.global_position.distance_to(global_position) < DAMAGE_RADIUS:
			body.take_damage(DAMAGE)
			RunData.add_chaos(CHAOS_ADD)

func _deactivate() -> void:
	_active = false
	_timer = randf_range(MIN_INTERVAL, MAX_INTERVAL)
	_body.color = Color(0.15, 0.15, 0.15)
