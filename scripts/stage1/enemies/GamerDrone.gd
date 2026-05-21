extends CharacterBody2D

const HP_MAX := 30.0
const SPEED := 110.0
const DAMAGE := 0.8
const ATTACK_COOLDOWN := 0.9

var _hp := HP_MAX
var _attack_timer := 0.0
var _body: ColorRect
var _contact_area: Area2D
var _player: Node2D = null

func _ready() -> void:
	add_to_group("enemy")
	collision_layer = 4
	collision_mask = 2  # walls

	var col := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 11.0
	col.shape = shape
	add_child(col)

	_body = ColorRect.new()
	_body.size = Vector2(22, 22)
	_body.position = Vector2(-11, -11)
	_body.color = Color(0.2, 0.85, 0.4)
	add_child(_body)

	# antenna
	var ant := ColorRect.new()
	ant.size = Vector2(3, 8)
	ant.position = Vector2(9, -19)
	ant.color = Color(0.1, 0.6, 0.2)
	add_child(ant)

	_contact_area = Area2D.new()
	_contact_area.collision_layer = 0
	_contact_area.collision_mask = 1  # player
	add_child(_contact_area)
	var ac := CollisionShape2D.new()
	var as_ := CircleShape2D.new()
	as_.radius = 13.0
	ac.shape = as_
	_contact_area.add_child(ac)
	_contact_area.body_entered.connect(_on_contact)

func _physics_process(delta: float) -> void:
	_attack_timer -= delta
	if _player == null or not is_instance_valid(_player):
		_player = _find_player()
		return
	var dir := (_player.global_position - global_position).normalized()
	velocity = dir * SPEED
	move_and_slide()

func _find_player() -> Node2D:
	var players := get_tree().get_nodes_in_group("player")
	return players[0] as Node2D if not players.is_empty() else null

func _on_contact(body: Node2D) -> void:
	if _attack_timer > 0.0:
		return
	if body.has_method("take_damage"):
		body.take_damage(DAMAGE)
		_attack_timer = ATTACK_COOLDOWN

func take_damage(amount: float) -> void:
	_hp -= amount
	_body.color = Color(1.0, 1.0, 0.3)
	get_tree().create_timer(0.1).timeout.connect(func():
		if is_instance_valid(self): _body.color = Color(0.2, 0.85, 0.4))
	if _hp <= 0.0:
		RunData.add_rent(randi_range(1, 3))
		queue_free()
