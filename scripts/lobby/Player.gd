extends CharacterBody2D

const SPEED = 200.0
const FRAME_W = 181
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
		sprite.play(anim_key)

func load_character(path: String) -> void:
	_setup_sprite(path)
	_facing = "down"
	var sprite := $AnimatedSprite2D
	sprite.play("idle_down")
	sprite.stop()
	sprite.frame = 0

func _setup_sprite(path: String = "res://assets/sprites/player/introvert.png") -> void:
	var texture = load(path)
	var frames := SpriteFrames.new()

	# [anim_name, fps, [[y_start, row_h, count], ...]]
	var anims := [
		["walk_down", 10.0, [[20,  168, 8]]],
		["walk_left", 10.0, [[199, 159, 8]]],
		["walk_up",   10.0, [[370, 168, 8]]],
		["idle_down",  3.0, [[549, 153, 4]]],
		["idle_left",  3.0, [[712, 156, 4]]],
		["idle_up",    3.0, [[876, 167, 4]]],
	]

	for anim in anims:
		var anim_name: String = anim[0]
		var fps: float        = anim[1]
		var segments: Array   = anim[2]

		frames.add_animation(anim_name)
		frames.set_animation_speed(anim_name, fps)
		frames.set_animation_loop(anim_name, true)

		for seg in segments:
			var y_start: int = seg[0]
			var row_h: int   = seg[1]
			var count: int   = seg[2]
			for col in range(count):
				var atlas := AtlasTexture.new()
				atlas.atlas = texture
				atlas.region = Rect2(col * FRAME_W, y_start, FRAME_W, row_h)
				frames.add_frame(anim_name, atlas)

	$AnimatedSprite2D.sprite_frames = frames
	$AnimatedSprite2D.play("idle_down")
