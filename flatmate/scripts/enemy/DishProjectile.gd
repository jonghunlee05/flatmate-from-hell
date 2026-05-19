extends Area2D

var direction: Vector2 = Vector2.RIGHT
var speed: float = 200.0
var damage: int = 10
var lifetime: float = 3.0

func _ready() -> void:
	add_to_group("enemy_projectile")
	set_meta("damage", damage)
	body_entered.connect(_on_body_entered)
	var sprite := $AnimatedSprite2D
	Placeholder.apply_projectile(sprite)

func _process(delta: float) -> void:
	position += direction * speed * delta
	lifetime -= delta
	if lifetime <= 0:
		queue_free()

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		queue_free()
	elif not body.is_in_group("enemy"):
		queue_free()
