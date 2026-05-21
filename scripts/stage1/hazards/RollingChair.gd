extends CharacterBody2D

const SPEED := 160.0
const DAMAGE := 0.6
const KNOCKBACK := 300.0

var _dir := Vector2.RIGHT
var _body: ColorRect
var _contact: Area2D
var _room_rect: Rect2
var _attack_timer := 0.0

func _ready() -> void:
	collision_layer = 8
	collision_mask = 2  # walls

	var col := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(32, 32)
	col.shape = shape
	add_child(col)

	_body = ColorRect.new()
	_body.size = Vector2(32, 32)
	_body.position = Vector2(-16, -16)
	_body.color = Color(0.45, 0.35, 0.25)
	add_child(_body)

	var lbl := Label.new()
	lbl.text = "🪑"
	lbl.add_theme_font_size_override("font_size", 20)
	lbl.position = Vector2(-10, -14)
	add_child(lbl)

	_contact = Area2D.new()
	_contact.collision_layer = 0
	_contact.collision_mask = 1
	add_child(_contact)
	var ac := CollisionShape2D.new()
	var cs := RectangleShape2D.new()
	cs.size = Vector2(34, 34)
	ac.shape = cs
	_contact.add_child(ac)
	_contact.body_entered.connect(_on_contact)

	_dir = Vector2(randf_range(-1, 1), randf_range(-1, 1)).normalized()

func setup(room_rect: Rect2) -> void:
	_room_rect = room_rect

func _physics_process(delta: float) -> void:
	_attack_timer -= delta
	velocity = _dir * SPEED
	move_and_slide()

	# Bounce off room boundaries
	if _room_rect != Rect2():
		if global_position.x < _room_rect.position.x + 30.0 or global_position.x > _room_rect.end.x - 30.0:
			_dir.x *= -1
		if global_position.y < _room_rect.position.y + 30.0 or global_position.y > _room_rect.end.y - 30.0:
			_dir.y *= -1
	else:
		# fallback: bounce off any wall collision
		if get_slide_collision_count() > 0:
			var col := get_slide_collision(0)
			_dir = _dir.bounce(col.get_normal())

	_body.rotation += delta * 4.0

func _on_contact(body: Node2D) -> void:
	if _attack_timer > 0.0:
		return
	if body.has_method("take_damage"):
		body.take_damage(DAMAGE)
		_attack_timer = 1.0
		var push := (body.global_position - global_position).normalized() * KNOCKBACK
		if body.has_method("apply_knockback"):
			body.apply_knockback(push)
