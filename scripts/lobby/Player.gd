extends CharacterBody2D

const SPEED = 200.0

# ── Sprite sheet ─────────────────────────────────────────────────────────────
# Soul Knight-style sheet — front-facing only, no back row.
# flip_h handles left / right. Body never shows its back.
#
#   Row 0  y=  0   walk   6 frames  – moving
#   Row 1  y=260   idle   4 frames  – standing still
#   Row 2  y=520   skill  5 frames  – unique ability
#   Row 3  y=780   hit    2 frames  – damage reaction
#
#   Sheet: 1248 × 1040 px at 208 × 260 px cells
#   Facing: movement direction sets flip_h; last direction sticks on idle.
#           Default facing is RIGHT (flip_h = false).
#
const FRAME_W := 239
const FRAME_H := 248

# ── Arm system (Soul Knight benchmark) ───────────────────────────────────────
#
#   ArmPivot   Node2D  –  sits at the shoulder, rotates to face the mouse
#   ArmLine    Line2D  –  placeholder arm; swap for Sprite2D when art is ready
#   WeaponNode Sprite2D – held item, parented to ArmPivot at the hand position
#
#   Rules mirrored from Soul Knight:
#     • Body facing  follows arm direction, NOT movement direction
#     • flip_h       driven by cos(arm_angle) < 0  (pointing left)
#     • Back sprites shown when sin(arm_angle) < FACING_UP_SIN (~45 ° above horiz)
#     • Arm z_index  = -1 behind body when aiming up, else +1 in front
#     • Weapon       flip_v when arm points left so it never looks upside-down
#
const ARM_PIVOT_OFFSET := Vector2(0.0, -8.0)   # shoulder, player-local pixels
const ARM_VISUAL_LEN   := 18.0                  # placeholder line length
const WEAPON_OFFSET    := Vector2(22.0, 0.0)    # pivot → weapon centre
const FACING_UP_SIN    := -0.60                 # sin threshold: arm z behind body

var _arm_pivot   : Node2D    = null
var _arm_line    : Line2D    = null
var _weapon_node : Sprite2D  = null
var _arm_right   := true     # arm pointing right? (weapon flip only)
var _facing_right := true    # body flip — driven by movement, sticks on idle

var _skill_active   := false   # true while skill animation is playing
var _skill_cooldown := 0.0     # seconds remaining on cooldown
const SKILL_COOLDOWN_MAX := 1.0

# ── Skill HUD ────────────────────────────────────────────────────────────────
var _skill_hud       : CanvasLayer
var _skill_cd_bar    : ProgressBar
var _skill_cd_label  : Label

# ─────────────────────────────────────────────────────────────────────────────

func _ready() -> void:
	_setup_sprite()
	_setup_arm()
	_setup_skill_hud()

func _physics_process(delta: float) -> void:
	# Tick cooldown
	if _skill_cooldown > 0.0:
		_skill_cooldown -= delta
		_skill_cd_bar.value = _skill_cooldown
		_skill_cd_label.text = "%.1fs" % maxf(_skill_cooldown, 0.0)
	else:
		_skill_cd_bar.value = 0.0
		_skill_cd_label.text = "SPACE"

	# Block movement and new inputs while skill is playing
	if _skill_active:
		velocity = Vector2.ZERO
		move_and_slide()
		_update_arm()
		return

	# Skill trigger — Space
	if Input.is_action_just_pressed("use_skill") and _skill_cooldown <= 0.0:
		_play_skill()
		return

	var direction := _input_dir()
	velocity = direction.normalized() * SPEED
	move_and_slide()
	_update_arm()
	_update_animation(direction)

func _input_dir() -> Vector2:
	var d := Vector2.ZERO
	if Input.is_physical_key_pressed(KEY_W) or Input.is_physical_key_pressed(KEY_UP):    d.y -= 1
	if Input.is_physical_key_pressed(KEY_S) or Input.is_physical_key_pressed(KEY_DOWN):  d.y += 1
	if Input.is_physical_key_pressed(KEY_A) or Input.is_physical_key_pressed(KEY_LEFT):  d.x -= 1
	if Input.is_physical_key_pressed(KEY_D) or Input.is_physical_key_pressed(KEY_RIGHT): d.x += 1
	return d

# ── Arm setup ────────────────────────────────────────────────────────────────

func _setup_arm() -> void:
	_arm_pivot = Node2D.new()
	_arm_pivot.name = "ArmPivot"
	_arm_pivot.position = ARM_PIVOT_OFFSET
	_arm_pivot.z_index = 1
	add_child(_arm_pivot)

	# Placeholder arm line — hidden in lobby, visible in-game when holding a weapon
	_arm_line = Line2D.new()
	_arm_line.name = "ArmLine"
	_arm_line.add_point(Vector2.ZERO)
	_arm_line.add_point(Vector2(ARM_VISUAL_LEN, 0.0))
	_arm_line.width = 5.0
	_arm_line.default_color = Color(0.88, 0.72, 0.56)
	_arm_line.visible = false
	_arm_pivot.add_child(_arm_line)

	# Weapon / item sprite at the hand position
	_weapon_node = Sprite2D.new()
	_weapon_node.name = "WeaponSprite"
	_weapon_node.position = WEAPON_OFFSET
	_weapon_node.scale = Vector2(0.45, 0.45)
	_arm_pivot.add_child(_weapon_node)

# ── Arm update (runs every frame) ────────────────────────────────────────────

func _update_arm() -> void:
	var angle := (get_global_mouse_position() - _arm_pivot.global_position).angle()
	_arm_pivot.rotation = angle

	_arm_right = cos(angle) >= 0.0

	# Flip weapon vertically when arm points left so it never looks upside-down
	if _weapon_node.texture:
		_weapon_node.flip_v = not _arm_right

	# Arm behind body when aiming steeply upward, in front otherwise
	_arm_pivot.z_index = -1 if sin(angle) < FACING_UP_SIN else 1

# ── Animation ────────────────────────────────────────────────────────────────

func _update_animation(direction: Vector2) -> void:
	var sprite    := $AnimatedSprite2D
	var is_moving := direction != Vector2.ZERO

	# Body facing: movement direction sets flip; last direction sticks on idle.
	# Default is right (flip_h = false). Arm rotation does NOT affect body flip.
	if is_moving and direction.x != 0:
		_facing_right = direction.x > 0
	sprite.flip_h = not _facing_right

	var anim_key := "walk" if is_moving else "idle"
	if sprite.animation != anim_key:
		sprite.play(anim_key)

# ── Skill HUD setup ──────────────────────────────────────────────────────────

func _setup_skill_hud() -> void:
	_skill_hud = CanvasLayer.new()
	_skill_hud.name = "SkillHUD"
	add_child(_skill_hud)

	# Outer box — bottom centre of screen
	var box := PanelContainer.new()
	box.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	box.anchor_left   = 0.5; box.anchor_right  = 0.5
	box.anchor_top    = 1.0; box.anchor_bottom = 1.0
	box.offset_left   = -36; box.offset_right  =  36
	box.offset_top    = -80; box.offset_bottom = -16
	_skill_hud.add_child(box)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 3)
	box.add_child(vbox)

	# Skill icon label (placeholder until we have icons)
	var icon_lbl := Label.new()
	icon_lbl.text = "✦"
	icon_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	icon_lbl.add_theme_font_size_override("font_size", 18)
	icon_lbl.add_theme_color_override("font_color", Color(0.5, 0.85, 1.0))
	vbox.add_child(icon_lbl)

	# Cooldown bar
	_skill_cd_bar = ProgressBar.new()
	_skill_cd_bar.custom_minimum_size = Vector2(60, 6)
	_skill_cd_bar.max_value  = SKILL_COOLDOWN_MAX
	_skill_cd_bar.value      = 0.0
	_skill_cd_bar.show_percentage = false
	var fill := StyleBoxFlat.new()
	fill.bg_color = Color(0.5, 0.85, 1.0)
	_skill_cd_bar.add_theme_stylebox_override("fill", fill)
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0.1, 0.1, 0.15, 0.8)
	_skill_cd_bar.add_theme_stylebox_override("background", bg)
	vbox.add_child(_skill_cd_bar)

	# Key hint / timer label
	_skill_cd_label = Label.new()
	_skill_cd_label.text = "SPACE"
	_skill_cd_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_skill_cd_label.add_theme_font_size_override("font_size", 10)
	_skill_cd_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
	vbox.add_child(_skill_cd_label)

# ── Skill ────────────────────────────────────────────────────────────────────

const SKILL_DASH_SPEED := 900.0
const SKILL_DASH_HOLD  := 0.18
const SKILL_DASH_DECEL := 0.20
const SLAM_RADIUS      := 90.0    # AOE boundary radius in px

func _play_skill() -> void:
	_skill_active = true
	_skill_cooldown = SKILL_COOLDOWN_MAX
	var sprite := $AnimatedSprite2D
	sprite.flip_h = not _facing_right
	sprite.play("skill")

	match RunData.active_character:
		"introvert":
			await _skill_dash()
		"goblin":
			await _skill_slam()
		"peacekeeper":
			await _skill_barrier()
		"petty":
			await _skill_shove()
		_:
			await _skill_dash()

	_skill_active = false
	velocity = Vector2.ZERO
	sprite.play("idle")

# Introvert — forward dash
func _skill_dash() -> void:
	var sprite   := $AnimatedSprite2D
	var dash_dir := Vector2(1.0 if _facing_right else -1.0, 0.0)
	var elapsed  := 0.0
	while sprite.is_playing():
		var delta := get_process_delta_time()
		elapsed += delta
		var spd: float
		if elapsed < SKILL_DASH_HOLD:
			spd = SKILL_DASH_SPEED
		else:
			var t := clampf((elapsed - SKILL_DASH_HOLD) / SKILL_DASH_DECEL, 0.0, 1.0)
			spd = SKILL_DASH_SPEED * (1.0 - t)
		velocity = dash_dir * spd
		move_and_slide()
		await get_tree().process_frame

# Chaos Goblin — ground slam with shadow + landing shake
func _skill_slam() -> void:
	var sprite := $AnimatedSprite2D

	# Ground shadow — dark oval beneath the character
	var shadow := ColorRect.new()
	shadow.color = Color(0.0, 0.0, 0.0, 0.45)
	shadow.size  = Vector2(60, 18)
	shadow.position = Vector2(-30, 18)   # centred below feet
	shadow.z_index  = -1
	add_child(shadow)

	# Target Y offsets per frame (sprite lifts up then slams down)
	# Negative = up on screen
	var jump_targets := {
		0:  6.0,    # crouch — sink slightly
		1: -28.0,   # rising
		2: -48.0,   # peak
		3:  0.0,    # slam back to ground
		4:  0.0,    # recovery
	}
	var sprite_origin : Vector2 = sprite.position
	var last_frame := -1

	while sprite.is_playing():
		var f      : int   = sprite.frame
		var target : float = jump_targets.get(f, 0.0)
		var delta          := get_process_delta_time()

		# Smooth lerp toward target Y — gentle float up, instant snap on slam
		var speed  := 8.0 if f < 3 else 999.0
		var weight := minf(speed * delta, 1.0)   # clamp so lerpf never overshoots
		sprite.position.y = lerpf(sprite.position.y, sprite_origin.y + target, weight)

		match f:
			0:
				shadow.visible = false
			1:
				shadow.visible  = true
				shadow.scale    = Vector2(0.4, 0.4)
				shadow.position = Vector2(-12, 18)
			2:
				shadow.visible  = true
				shadow.scale    = Vector2(0.7, 0.7)
				shadow.position = Vector2(-21, 18)
			3:
				shadow.visible  = true
				shadow.scale    = Vector2(1.0, 1.0)
				shadow.position = Vector2(-30, 18)
				if last_frame != 3:
					_screen_shake(0.18, 6.0)
					_show_slam_ring()
			4:
				shadow.visible  = true
				shadow.scale    = Vector2(0.5, 0.5)
				shadow.position = Vector2(-15, 18)

		last_frame = f
		velocity   = Vector2.ZERO
		move_and_slide()
		await get_tree().process_frame

	# Reset sprite back to original position
	sprite.position = sprite_origin
	shadow.queue_free()

func _show_slam_ring() -> void:
	# Draw a circle ring at feet level using Line2D
	var ring   := Line2D.new()
	ring.width  = 4.0
	ring.default_color = Color(1.0, 0.45, 0.0, 1.0)   # orange
	ring.z_index = 2
	# Build circle polygon
	var pts := 40
	for i in range(pts + 1):
		var angle := (float(i) / pts) * TAU
		ring.add_point(Vector2(cos(angle), sin(angle)) * SLAM_RADIUS)
	ring.position = Vector2(0, 20)   # offset to feet
	add_child(ring)

	# Expand outward and fade over 0.5s
	var elapsed := 0.0
	var duration := 0.5
	while elapsed < duration:
		var delta := get_process_delta_time()
		elapsed  += delta
		var t     := elapsed / duration
		ring.scale         = Vector2.ONE * (1.0 + t * 0.35)
		ring.modulate.a    = 1.0 - t
		await get_tree().process_frame
	ring.queue_free()

func _screen_shake(duration: float, strength: float) -> void:
	var sprite := $AnimatedSprite2D
	var origin  : Vector2 = sprite.position
	var elapsed := 0.0
	while elapsed < duration:
		var delta := get_process_delta_time()
		elapsed  += delta
		var t     := 1.0 - elapsed / duration
		sprite.position = origin + Vector2(
			randf_range(-strength, strength) * t,
			randf_range(-strength, strength) * t)
		await get_tree().process_frame
	sprite.position = origin

# Peace Keeper — barrier in place (no movement)
func _skill_barrier() -> void:
	var sprite := $AnimatedSprite2D
	while sprite.is_playing():
		velocity = Vector2.ZERO
		move_and_slide()
		await get_tree().process_frame

# Petty One — Guilt Trip: stay in place, emit colour waves
func _skill_shove() -> void:
	var sprite  := $AnimatedSprite2D
	var last_frame := -1

	while sprite.is_playing():
		var f : int = sprite.frame
		# Emit a new wave on frames 1, 2, and 3
		if f != last_frame and f in [1, 2, 3]:
			_emit_guilt_wave(f)
		last_frame  = f
		velocity    = Vector2.ZERO
		move_and_slide()
		await get_tree().process_frame

func _emit_guilt_wave(wave_index: int) -> void:
	# Each wave gets a slightly different colour and delay
	var colours := [
		Color(0.72, 0.2,  1.0, 1.0),   # purple
		Color(1.0,  0.25, 0.75, 1.0),  # pink
		Color(0.5,  0.1,  0.9, 1.0),   # deep violet
	]
	var colour : Color = colours[wave_index % colours.size()]

	var ring        := Line2D.new()
	ring.width       = 5.0
	ring.default_color = colour
	ring.z_index     = 2

	var pts := 48
	for i in range(pts + 1):
		var angle := (float(i) / pts) * TAU
		ring.add_point(Vector2(cos(angle), sin(angle)) * 10.0)
	ring.position = Vector2(0, 10)
	add_child(ring)

	# Expand outward and fade
	var elapsed  := 0.0
	var duration := 1.2
	var max_r    := 220.0 + wave_index * 40.0
	while elapsed < duration:
		var delta := get_process_delta_time()
		elapsed  += delta
		var t     := elapsed / duration
		var r     := lerpf(10.0, max_r, t)
		# Rescale all points by updating scale
		ring.scale      = Vector2.ONE * (r / 10.0)
		ring.modulate.a = 1.0 - t
		ring.width      = lerpf(5.0, 2.0, t)
		await get_tree().process_frame
	ring.queue_free()

# ── Item holding ─────────────────────────────────────────────────────────────

func set_held_item(item_id: String) -> void:
	if _weapon_node == null:
		return
	_weapon_node.texture = null if item_id == "" else \
		load("res://assets/sprites/items/" + item_id + ".png")

# ── Character loading ─────────────────────────────────────────────────────────

func load_character(path: String) -> void:
	_setup_sprite(path)
	_facing_right = true          # reset to default right-facing on character swap
	var sprite := $AnimatedSprite2D
	sprite.play("idle")
	sprite.stop()
	sprite.frame = 0

# ── Per-character animation data (output from fix_sprite_sheet.py) ────────────
#   Format per entry: { frame_w, frame_h, anims: [[name, fps, y, count], ...] }
const CHARACTER_SHEET_DATA := {
	"introvert": {
		"frame_w": 239, "frame_h": 248,
		"anims": [
			["walk",  10.0,   0, 6],
			["idle",   4.0, 248, 4],
			["skill", 12.0, 496, 5],
			["hit",   16.0, 744, 3],
		]
	},
	"goblin": {
		"frame_w": 328, "frame_h": 254,
		"anims": [
			["walk",  10.0,   0, 6],
			["idle",   2.0, 254, 4],
			["skill",  6.0, 508, 5],
			["hit",   16.0, 762, 3],
		]
	},
	"peacekeeper": {
		"frame_w": 64, "frame_h": 64,
		"anims": [
			["walk",  10.0,  0, 6],
			["idle",   4.0, 64, 4],
			["skill", 12.0,128, 5],
			["hit",   16.0,192, 3],
		]
	},
	"petty": {
		"frame_w": 351, "frame_h": 296,
		"anims": [
			["walk",  10.0,   0, 6],
			["idle",   2.0, 296, 4],
			["skill",  5.0, 592, 5],
			["hit",   16.0, 888, 3],
		]
	},
}

func _setup_sprite(path: String = "res://assets/sprites/player/introvert.png") -> void:
	var texture := load(path)
	var frames  := SpriteFrames.new()

	# Use the active character ID set by Lobby (matches CHARACTER_SHEET_DATA keys)
	var char_id := RunData.active_character
	var data    : Dictionary = CHARACTER_SHEET_DATA.get(char_id, CHARACTER_SHEET_DATA["introvert"])
	var fw      : int   = data["frame_w"]
	var fh      : int   = data["frame_h"]
	var anims   : Array = data["anims"]

	# skill and hit play once and stop — walk/idle loop continuously
	var one_shot := ["skill", "hit"]

	for anim in anims:
		var anim_name : String = anim[0]
		var fps       : float  = anim[1]
		var y_start   : int    = anim[2]
		var count     : int    = anim[3]
		frames.add_animation(anim_name)
		frames.set_animation_speed(anim_name, fps)
		frames.set_animation_loop(anim_name, not (anim_name in one_shot))
		for col in range(count):
			var atlas := AtlasTexture.new()
			atlas.atlas  = texture
			atlas.region = Rect2(col * fw, y_start, fw, fh)
			frames.add_frame(anim_name, atlas)

	var sprite := $AnimatedSprite2D
	sprite.sprite_frames = frames
	var scale_map : Dictionary = {"introvert": 0.40, "goblin": 0.40, "peacekeeper": 0.40, "petty": 0.45}
	var s : float = scale_map.get(char_id, 0.40)
	sprite.scale = Vector2(s, s)
	sprite.play("idle")
