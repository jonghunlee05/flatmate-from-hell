extends CharacterBody2D

signal boss_defeated()

const HP_MAX := 300.0
const SPEED_BASE := 85.0
const DASH_SPEED := 420.0

var _hp := HP_MAX
var _phase := 1  # 1, 2, 3 (changes at 200 and 100 HP)
var _body: ColorRect
var _contact_area: Area2D
var _attack_timer := 0.0
var _attack_queue: Array = []
var _dashing := false
var _dash_dir := Vector2.ZERO
var _dash_timer := 0.0
var _player: Node2D = null

const ATTACK_PATTERNS: Dictionary = {
	1: ["sonic_wave", "keyboard_throw"],
	2: ["sonic_wave", "keyboard_throw", "rage_dash"],
	3: ["sonic_wave", "keyboard_throw", "rage_dash", "summon_drones"],
}

func _ready() -> void:
	add_to_group("enemy")
	collision_layer = 4
	collision_mask = 2

	var col := CollisionShape2D.new()
	var shape := CapsuleShape2D.new()
	shape.radius = 22.0
	shape.height = 44.0
	col.shape = shape
	add_child(col)

	# Body
	_body = ColorRect.new()
	_body.size = Vector2(44, 56)
	_body.position = Vector2(-22, -28)
	_body.color = Color(0.7, 0.15, 0.7)
	add_child(_body)

	# Headset
	var hs := ColorRect.new()
	hs.size = Vector2(50, 10)
	hs.position = Vector2(-3, -36)
	hs.color = Color(0.2, 0.2, 0.8)
	add_child(hs)

	# Name label
	var lbl := Label.new()
	lbl.text = "LOUD GAMER"
	lbl.add_theme_font_size_override("font_size", 10)
	lbl.add_theme_color_override("font_color", Color(1, 0.6, 1))
	lbl.position = Vector2(-28, -52)
	add_child(lbl)

	# RGB glow effect
	var glow := ColorRect.new()
	glow.size = Vector2(52, 64)
	glow.position = Vector2(-26, -32)
	glow.color = Color(0, 1, 0, 0.12)
	glow.name = "Glow"
	add_child(glow)

	_contact_area = Area2D.new()
	_contact_area.collision_layer = 0
	_contact_area.collision_mask = 1
	add_child(_contact_area)
	var cac := CollisionShape2D.new()
	var cas_ := CapsuleShape2D.new()
	cas_.radius = 24.0
	cas_.height = 48.0
	cac.shape = cas_
	_contact_area.add_child(cac)
	_contact_area.body_entered.connect(_on_contact)

	_attack_timer = 1.5  # brief delay before first attack
	_shuffle_attacks()

func _process(delta: float) -> void:
	# RGB pulse on glow
	if has_node("Glow"):
		var glow := get_node("Glow") as ColorRect
		var t := Time.get_ticks_msec() * 0.003
		glow.color = Color(
			0.5 + 0.5 * sin(t),
			0.5 + 0.5 * sin(t + 2.094),
			0.5 + 0.5 * sin(t + 4.189),
			0.15)

func _physics_process(delta: float) -> void:
	if _player == null or not is_instance_valid(_player):
		_player = _find_player()
		return

	_attack_timer -= delta
	if _attack_timer <= 0.0 and not _dashing:
		_next_attack()

	if _dashing:
		_tick_dash(delta)
		return

	# Move toward player slowly
	var dir := (_player.global_position - global_position).normalized()
	velocity = dir * SPEED_BASE
	move_and_slide()

func _shuffle_attacks() -> void:
	_attack_queue = ATTACK_PATTERNS[_phase].duplicate()
	_attack_queue.shuffle()

func _next_attack() -> void:
	if _attack_queue.is_empty():
		_shuffle_attacks()
	var attack: String = _attack_queue.pop_front()
	_do_attack(attack)

func _do_attack(attack: String) -> void:
	match attack:
		"sonic_wave":
			_attack_sonic_wave()
			_attack_timer = 1.8
		"keyboard_throw":
			_attack_keyboard_throw()
			_attack_timer = 1.5
		"rage_dash":
			_attack_rage_dash()
			_attack_timer = 2.5
		"summon_drones":
			_attack_summon_drones()
			_attack_timer = 3.0

# ── Attack implementations ────────────────────────────────────────

func _attack_sonic_wave() -> void:
	_body.color = Color(1.0, 0.5, 1.0)
	get_tree().create_timer(0.1).timeout.connect(func():
		if is_instance_valid(self): _body.color = Color(0.7, 0.15, 0.7))

	var wave := Area2D.new()
	wave.collision_layer = 0
	wave.collision_mask = 1
	get_tree().current_scene.add_child(wave)
	wave.global_position = global_position

	var wshape := CollisionShape2D.new()
	var circle := CircleShape2D.new()
	circle.radius = 100.0
	wshape.shape = circle
	wave.add_child(wshape)

	var visual := ColorRect.new()
	visual.color = Color(0.8, 0.2, 1.0, 0.35)
	visual.size = Vector2(200, 200)
	visual.position = Vector2(-100, -100)
	wave.add_child(visual)

	for body in wave.get_overlapping_bodies():
		if body.has_method("take_damage"):
			body.take_damage(1.4)
			RunData.add_chaos(0.5)

	get_tree().create_timer(0.3).timeout.connect(func():
		if is_instance_valid(wave): wave.queue_free())

func _attack_keyboard_throw() -> void:
	if _player == null:
		return
	var base_dir := (_player.global_position - global_position).normalized()
	var spread_angles := [-25.0, -12.0, 0.0, 12.0, 25.0]
	for ang in spread_angles:
		var rotated := base_dir.rotated(deg_to_rad(ang))
		_spawn_keyboard_proj(rotated)

func _spawn_keyboard_proj(dir: Vector2) -> void:
	var p := CharacterBody2D.new()
	p.set_script(load("res://scripts/stage1/enemies/CanProjectile.gd"))
	get_tree().current_scene.add_child(p)
	p.global_position = global_position
	p.set_direction(dir)

func _attack_rage_dash() -> void:
	if _player == null:
		return
	_dash_dir = (_player.global_position - global_position).normalized()
	_dashing = true
	_dash_timer = 0.4
	_body.color = Color(1.0, 0.0, 0.0)

func _tick_dash(delta: float) -> void:
	_dash_timer -= delta
	velocity = _dash_dir * DASH_SPEED
	move_and_slide()
	if _dash_timer <= 0.0:
		_dashing = false
		_body.color = Color(0.7, 0.15, 0.7)

func _attack_summon_drones() -> void:
	for i in range(2):
		var drone := CharacterBody2D.new()
		drone.set_script(load("res://scripts/stage1/enemies/GamerDrone.gd"))
		get_tree().current_scene.add_child(drone)
		drone.global_position = global_position + Vector2(randf_range(-60, 60), randf_range(-60, 60))

# ── Hit / death ───────────────────────────────────────────────────

func _on_contact(body: Node2D) -> void:
	if body.has_method("take_damage"):
		body.take_damage(1.6)

func take_damage(amount: float) -> void:
	_hp -= amount
	_body.color = Color(1.0, 1.0, 0.5)
	get_tree().create_timer(0.1).timeout.connect(func():
		if is_instance_valid(self): _body.color = Color(0.7, 0.15, 0.7))

	# Phase transitions
	if _hp <= 100.0 and _phase < 3:
		_phase = 3
		_shuffle_attacks()
		_body.color = Color(1.0, 0.0, 0.3)
	elif _hp <= 200.0 and _phase < 2:
		_phase = 2
		_shuffle_attacks()

	if _hp <= 0.0:
		_die()

func _die() -> void:
	RunData.add_rent(30)
	emit_signal("boss_defeated")
	queue_free()

func _find_player() -> Node2D:
	var players := get_tree().get_nodes_in_group("player")
	return players[0] as Node2D if not players.is_empty() else null
