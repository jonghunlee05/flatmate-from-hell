extends CharacterBody2D

const SPEED := 280.0
const DAMAGE := 1.0
const LIFETIME := 3.0

var _dir := Vector2.RIGHT
var _life := LIFETIME
var _contact: Area2D

func _ready() -> void:
	collision_layer = 0
	collision_mask = 0

	var body := ColorRect.new()
	body.size = Vector2(12, 12)
	body.position = Vector2(-6, -6)
	body.color = Color(0.6, 0.6, 0.7)
	add_child(body)

	_contact = Area2D.new()
	_contact.collision_layer = 0
	_contact.collision_mask = 1  # player
	add_child(_contact)
	var ac := CollisionShape2D.new()
	var shape := CircleShape2D.new()
	shape.radius = 7.0
	ac.shape = shape
	_contact.add_child(ac)
	_contact.body_entered.connect(_on_hit)

func set_direction(dir: Vector2) -> void:
	_dir = dir.normalized()
	rotation = _dir.angle()

func _physics_process(delta: float) -> void:
	_life -= delta
	if _life <= 0.0:
		queue_free()
		return
	global_position += _dir * SPEED * delta

func _on_hit(body: Node) -> void:
	if body.has_method("take_damage"):
		body.take_damage(DAMAGE)
	queue_free()
