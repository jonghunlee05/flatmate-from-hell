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
const FRAME_W := 208
const FRAME_H := 260

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

	# Placeholder arm line — replace with Sprite2D + arm texture when art is ready
	_arm_line = Line2D.new()
	_arm_line.name = "ArmLine"
	_arm_line.add_point(Vector2.ZERO)
	_arm_line.add_point(Vector2(ARM_VISUAL_LEN, 0.0))
	_arm_line.width = 5.0
	_arm_line.default_color = Color(0.88, 0.72, 0.56)
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

const SKILL_DASH_SPEED    := 900.0   # px/s at peak
const SKILL_DASH_HOLD     := 0.18    # seconds at full speed before decelerating
const SKILL_DASH_DECEL    := 0.20    # seconds to decelerate to zero

func _play_skill() -> void:
	_skill_active = true
	_skill_cooldown = SKILL_COOLDOWN_MAX
	var sprite := $AnimatedSprite2D
	sprite.flip_h = not _facing_right
	sprite.play("skill")

	# Dash direction: facing direction (left or right)
	var dash_dir := Vector2(1.0 if _facing_right else -1.0, 0.0)

	var elapsed := 0.0
	while _skill_active and sprite.is_playing():
		var delta := get_process_delta_time()
		elapsed += delta
		var spd: float
		if elapsed < SKILL_DASH_HOLD:
			# Full speed phase
			spd = SKILL_DASH_SPEED
		else:
			# Decelerate smoothly to zero
			var t := clampf((elapsed - SKILL_DASH_HOLD) / SKILL_DASH_DECEL, 0.0, 1.0)
			spd = SKILL_DASH_SPEED * (1.0 - t)
		velocity = dash_dir * spd
		move_and_slide()
		await get_tree().process_frame

	_skill_active = false
	velocity = Vector2.ZERO
	sprite.play("idle")

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

func _setup_sprite(path: String = "res://assets/sprites/player/introvert.png") -> void:
	var texture := load(path)
	var frames  := SpriteFrames.new()

	# [anim_name, fps, y_start, frame_count]
	# All cells are FRAME_W × FRAME_H (208 × 260) — uniform grid from fix_sprite_sheet.py.
	var anims := [
		["walk",  10.0,   0, 6],
		["idle",   4.0, 260, 4],
		["skill", 12.0, 520, 5],
		["hit",   16.0, 780, 2],
	]

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
			atlas.region = Rect2(col * FRAME_W, y_start, FRAME_W, FRAME_H)
			frames.add_frame(anim_name, atlas)

	$AnimatedSprite2D.sprite_frames = frames
	$AnimatedSprite2D.play("idle")
