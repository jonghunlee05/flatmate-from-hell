extends Node2D

const PULSE_INTERVAL := 3.0
const PULSE_DAMAGE := 1.2
const PULSE_RADIUS := 140.0
const CHAOS_ADD := 0.5

var _timer := PULSE_INTERVAL
var _wave_timer := 0.0
var _body: ColorRect

func _ready() -> void:
	_body = ColorRect.new()
	_body.size = Vector2(28, 28)
	_body.position = Vector2(-14, -14)
	_body.color = Color(0.6, 0.1, 0.8)
	add_child(_body)

	var lbl := Label.new()
	lbl.text = "🔊"
	lbl.add_theme_font_size_override("font_size", 18)
	lbl.position = Vector2(-12, -14)
	add_child(lbl)

func _process(delta: float) -> void:
	_timer -= delta

	# Animate wave ring
	if _wave_timer > 0.0:
		_wave_timer -= delta

	if _timer <= 0.0:
		_pulse()
		_timer = PULSE_INTERVAL

func _pulse() -> void:
	_wave_timer = 0.35
	_body.color = Color(1.0, 0.3, 1.0)
	get_tree().create_timer(0.15).timeout.connect(func():
		if is_instance_valid(self): _body.color = Color(0.6, 0.1, 0.8))

	# Draw expanding ring visual
	var wave := ColorRect.new()
	wave.color = Color(0.7, 0.1, 1.0, 0.4)
	var r := PULSE_RADIUS
	wave.size = Vector2(r * 2, r * 2)
	wave.position = Vector2(-r, -r)
	add_child(wave)
	get_tree().create_timer(0.35).timeout.connect(func():
		if is_instance_valid(wave): wave.queue_free())

	# Distance-based damage — reliable regardless of physics update timing
	for body in get_tree().get_nodes_in_group("player"):
		if is_instance_valid(body) and body.global_position.distance_to(global_position) < PULSE_RADIUS:
			body.take_damage(PULSE_DAMAGE)
			RunData.add_chaos(CHAOS_ADD)
