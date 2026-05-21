extends CharacterBody2D

const HP_MAX := 55.0
const SPEED := 70.0
const THROW_COOLDOWN := 2.2
const PREFERRED_DIST := 200.0

var _hp := HP_MAX
var _throw_timer := THROW_COOLDOWN
var _body: ColorRect
var _player: Node2D = null
var _wander_dir := Vector2.RIGHT
var _wander_timer := 1.2

func _ready() -> void:
	add_to_group("enemy")
	collision_layer = 4
	collision_mask = 2

	var col := CollisionShape2D.new()
	var shape := CapsuleShape2D.new()
	shape.radius = 12.0
	shape.height = 24.0
	col.shape = shape
	add_child(col)

	_body = ColorRect.new()
	_body.size = Vector2(24, 32)
	_body.position = Vector2(-12, -16)
	_body.color = Color(0.85, 0.35, 0.15)
	add_child(_body)

	var cap_lbl := Label.new()
	cap_lbl.text = "🥤"
	cap_lbl.add_theme_font_size_override("font_size", 14)
	cap_lbl.position = Vector2(-8, -16)
	add_child(cap_lbl)

	_wander_dir = Vector2(randf_range(-1, 1), randf_range(-1, 1)).normalized()

func _physics_process(delta: float) -> void:
	if _player == null or not is_instance_valid(_player):
		_player = _find_player()

	_throw_timer -= delta
	if _throw_timer <= 0.0 and _player != null:
		_throw_can()
		_throw_timer = THROW_COOLDOWN

	_wander_timer -= delta
	if _wander_timer <= 0.0:
		_wander_dir = Vector2(randf_range(-1, 1), randf_range(-1, 1)).normalized()
		_wander_timer = randf_range(0.8, 1.6)

	var move_dir := _wander_dir
	if _player != null:
		var dist := global_position.distance_to(_player.global_position)
		if dist < PREFERRED_DIST - 30.0:
			move_dir = (global_position - _player.global_position).normalized()
		elif dist > PREFERRED_DIST + 30.0:
			move_dir = (_player.global_position - global_position).normalized()

	velocity = move_dir * SPEED
	move_and_slide()

func _throw_can() -> void:
	var proj := _make_can_projectile()
	get_tree().current_scene.add_child(proj)
	proj.global_position = global_position
	var dir := (_player.global_position - global_position).normalized()
	proj.set_direction(dir)

func _make_can_projectile() -> CharacterBody2D:
	var p := CharacterBody2D.new()
	p.collision_layer = 0
	p.collision_mask = 0
	p.set_script(load("res://scripts/stage1/enemies/CanProjectile.gd"))
	return p

func _find_player() -> Node2D:
	var players := get_tree().get_nodes_in_group("player")
	return players[0] as Node2D if not players.is_empty() else null

func take_damage(amount: float) -> void:
	_hp -= amount
	_body.color = Color(1.0, 0.8, 0.6)
	get_tree().create_timer(0.1).timeout.connect(func():
		if is_instance_valid(self): _body.color = Color(0.85, 0.35, 0.15))
	if _hp <= 0.0:
		RunData.add_rent(randi_range(2, 5))
		queue_free()
