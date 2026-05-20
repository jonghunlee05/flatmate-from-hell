extends CharacterBody2D

const SPEED = 200.0
const FRAME_W = 256
const FRAME_H = 256

var _facing := "down"

func _ready() -> void:
	_setup_sprite()

func _physics_process(_delta: float) -> void:
	var direction := Vector2.ZERO

	if Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP):
		direction.y -= 1
	if Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN):
		direction.y += 1
	if Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT):
		direction.x -= 1
	if Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT):
		direction.x += 1

	velocity = direction.normalized() * SPEED
	move_and_slide()
	_update_animation(direction)

func _update_animation(direction: Vector2) -> void:
	var sprite := $AnimatedSprite2D
	var target_anim: String

	if direction == Vector2.ZERO:
		target_anim = "idle_" + _facing
	else:
		if abs(direction.x) >= abs(direction.y):
			_facing = "right" if direction.x > 0 else "left"
		else:
			_facing = "down" if direction.y > 0 else "up"
		target_anim = "walk_" + _facing

	# mirror left for right
	sprite.flip_h = _facing == "right"

	var anim_key := target_anim.replace("_right", "_left")
	match anim_key:
		"walk_left":
			sprite.offset.y = 20.0
		"walk_up":
			sprite.offset.y = 40.0
		_:
			sprite.offset.y = 0.0

	if sprite.animation != anim_key:
		if anim_key.begins_with("idle"):
			sprite.play(anim_key)
			sprite.stop()
			sprite.frame = 0
		else:
			sprite.play(anim_key)

func _setup_sprite() -> void:
	var texture = load("res://assets/sprites/player/player.png")
	var frames := SpriteFrames.new()

	var anims := [
		["idle_down", 0, 2],
		["idle_left", 1, 2],
		["idle_up",   2, 2],
		["walk_down", 3, 4],
		["walk_left", 4, 4],
		["walk_up",   5, 4],
	]

	for anim in anims:
		var anim_name: String = anim[0]
		var row: int = anim[1]
		var count: int = anim[2]

		frames.add_animation(anim_name)
		var speed := 4.0 if anim_name.begins_with("idle") else 8.0
		frames.set_animation_speed(anim_name, speed)
		frames.set_animation_loop(anim_name, true)

		for col in range(count):
			var atlas := AtlasTexture.new()
			atlas.atlas = texture
			atlas.region = Rect2(col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H)
			frames.add_frame(anim_name, atlas)

	$AnimatedSprite2D.sprite_frames = frames
	$AnimatedSprite2D.play("idle_down")
