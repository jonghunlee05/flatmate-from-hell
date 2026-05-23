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
var _last_dir    := Vector2(1.0, 0.0)   # last non-zero input direction, used for dash

var _skill_active   := false   # true while skill animation is playing
var _skill_cooldown := 0.0     # seconds remaining on cooldown
const SKILL_COOLDOWN_MAX := 1.0

# ── Skill HUD ────────────────────────────────────────────────────────────────
var _skill_hud       : CanvasLayer
var _skill_cd_bar    : ProgressBar
var _skill_cd_label  : Label

# ─────────────────────────────────────────────────────────────────────────────

func _ready() -> void:
	CharacterManager.setup_sprite($AnimatedSprite2D)
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

	# Skill coroutine owns velocity + move_and_slide — physics_process stays out
	if _skill_active:
		_update_arm()
		return

	# Skill trigger — Space
	if Input.is_action_just_pressed("use_skill") and _skill_cooldown <= 0.0:
		_play_skill()
		return

	var direction := _input_dir()
	if direction != Vector2.ZERO:
		_last_dir = direction.normalized()
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
	var cooldowns := {"introvert": 1.0, "goblin": 1.0, "peacekeeper": 8.0, "petty": 1.0}
	_skill_cooldown = cooldowns.get(RunData.active_character, SKILL_COOLDOWN_MAX)
	_skill_cd_bar.max_value = _skill_cooldown
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

# Introvert — forward dash in last movement direction
func _skill_dash() -> void:
	var sprite   := $AnimatedSprite2D
	var dash_dir := _last_dir
	var elapsed  := 0.0
	while sprite.is_playing() and is_inside_tree():
		var delta := get_physics_process_delta_time()
		elapsed += delta
		var spd: float
		if elapsed < SKILL_DASH_HOLD:
			spd = SKILL_DASH_SPEED
		else:
			var t := clampf((elapsed - SKILL_DASH_HOLD) / SKILL_DASH_DECEL, 0.0, 1.0)
			spd = SKILL_DASH_SPEED * (1.0 - t)
		velocity = dash_dir * spd
		move_and_slide()
		await get_tree().physics_frame

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
	var _last_frame := -1

	while sprite.is_playing() and is_inside_tree():
		var f      : int   = sprite.frame
		var target : float = jump_targets.get(f, 0.0)
		var delta          := get_physics_process_delta_time()

		var speed  := 8.0 if f < 3 else 999.0
		var weight := minf(speed * delta, 1.0)
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
				if _last_frame != 3:
					_screen_shake(0.18, 6.0)
					_show_slam_ring()
			4:
				shadow.visible  = true
				shadow.scale    = Vector2(0.5, 0.5)
				shadow.position = Vector2(-15, 18)

		_last_frame = f
		velocity    = Vector2.ZERO
		move_and_slide()
		await get_tree().physics_frame

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
	while elapsed < duration and is_inside_tree():
		var delta := get_physics_process_delta_time()
		elapsed  += delta
		var t     := elapsed / duration
		ring.scale         = Vector2.ONE * (1.0 + t * 0.35)
		ring.modulate.a    = 1.0 - t
		await get_tree().physics_frame
	ring.queue_free()

func _screen_shake(duration: float, strength: float) -> void:
	var sprite := $AnimatedSprite2D
	var origin  : Vector2 = sprite.position
	var elapsed := 0.0
	while elapsed < duration and is_inside_tree():
		var delta := get_physics_process_delta_time()
		elapsed  += delta
		var t     := 1.0 - elapsed / duration
		sprite.position = origin + Vector2(
			randf_range(-strength, strength) * t,
			randf_range(-strength, strength) * t)
		await get_tree().physics_frame
	sprite.position = origin

# Peace Keeper — nature mediation: expanding rings, then a persistent barrier aura
func _skill_barrier() -> void:
	var sprite := $AnimatedSprite2D
	while sprite.is_playing() and is_inside_tree():
		velocity = Vector2.ZERO
		move_and_slide()
		await get_tree().physics_frame
	_show_persistent_barrier()

func _emit_nature_ring(wave_index: int) -> void:
	var colours : Array[Color] = [
		Color(0.2,  0.85, 0.35, 1.0),   # bright green
		Color(0.35, 0.95, 0.55, 1.0),   # soft mint
		Color(0.15, 0.75, 0.45, 1.0),   # deep green
	]
	var colour : Color = colours[wave_index % colours.size()]

	var ring := Line2D.new()
	ring.width = 6.0
	ring.default_color = colour
	ring.z_index = 2
	var pts := 48
	for i in range(pts + 1):
		var angle := (float(i) / pts) * TAU
		ring.add_point(Vector2(cos(angle), sin(angle)) * 10.0)
	ring.position = Vector2(0, 8)
	add_child(ring)

	# Also spawn a few leaf particles
	for _i in range(4):
		_emit_leaf(colour)

	var elapsed  := 0.0
	var duration := 1.4
	var max_r    := 180.0 + wave_index * 30.0
	while elapsed < duration and is_inside_tree():
		var delta := get_physics_process_delta_time()
		elapsed  += delta
		var t     := elapsed / duration
		ring.scale      = Vector2.ONE * (lerpf(1.0, max_r / 10.0, t))
		ring.modulate.a = 1.0 - t
		ring.width      = lerpf(6.0, 2.0, t)
		await get_tree().physics_frame
	ring.queue_free()

func _show_persistent_barrier() -> void:
	# Pointy-top hexagon stretched on Y to wrap the character silhouette
	const HEX_RX := 40.0   # horizontal radius
	const HEX_RY := 68.0   # vertical radius (taller to cover head-to-toe)

	var make_hex := func(rx: float, ry: float) -> PackedVector2Array:
		var p : PackedVector2Array = []
		for i in range(6):
			var a := -PI / 2.0 + i * TAU / 6.0   # start at top point
			p.append(Vector2(cos(a) * rx, sin(a) * ry))
		return p

	# Outer soft halo
	var outer := Polygon2D.new()
	outer.color   = Color(0.25, 0.92, 0.42, 0.22)
	outer.polygon = make_hex.call(HEX_RX + 10.0, HEX_RY + 14.0)
	outer.z_index = 1
	add_child(outer)

	# Inner tighter glow
	var inner := Polygon2D.new()
	inner.color   = Color(0.35, 0.98, 0.50, 0.42)
	inner.polygon = make_hex.call(HEX_RX, HEX_RY)
	inner.z_index = 1
	add_child(inner)

	# Fade in over 0.5 s
	outer.modulate.a = 0.0
	inner.modulate.a = 0.0
	var elapsed := 0.0
	while elapsed < 0.5 and is_inside_tree():
		elapsed += get_physics_process_delta_time()
		var t := elapsed / 0.5
		outer.modulate.a = t
		inner.modulate.a = t
		await get_tree().physics_frame

	elapsed = 0.0
	while elapsed < 3.0 and is_inside_tree():
		elapsed += get_physics_process_delta_time()
		await get_tree().physics_frame

	elapsed = 0.0
	while elapsed < 1.0 and is_inside_tree():
		elapsed += get_physics_process_delta_time()
		var t := elapsed / 1.0
		outer.modulate.a = 1.0 - t
		inner.modulate.a = 1.0 - t
		await get_tree().physics_frame

	outer.queue_free()
	inner.queue_free()

func _emit_leaf(colour: Color) -> void:
	var leaf := ColorRect.new()
	leaf.color = colour
	leaf.size  = Vector2(8, 5)
	leaf.z_index = 3
	var angle  := randf() * TAU
	var dist   := randf_range(20.0, 60.0)
	leaf.position = Vector2(cos(angle), sin(angle)) * dist
	add_child(leaf)

	var elapsed  := 0.0
	var duration := randf_range(0.8, 1.3)
	var drift    := Vector2(randf_range(-40, 40), randf_range(-80, -30))
	var origin   : Vector2 = leaf.position
	while elapsed < duration and is_inside_tree():
		var delta := get_physics_process_delta_time()
		elapsed  += delta
		var t     := elapsed / duration
		leaf.position   = origin + drift * t
		leaf.modulate.a = 1.0 - t
		await get_tree().physics_frame
	leaf.queue_free()

# Petty One — Guilt Trip: stay in place, emit colour waves
func _skill_shove() -> void:
	var sprite      := $AnimatedSprite2D
	var _last_frame := -1
	while sprite.is_playing() and is_inside_tree():
		var f : int = sprite.frame
		if f != _last_frame and f in [1, 2, 3]:
			_emit_guilt_wave(f)
		_last_frame = f
		velocity    = Vector2.ZERO
		move_and_slide()
		await get_tree().physics_frame

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
	while elapsed < duration and is_inside_tree():
		var delta := get_physics_process_delta_time()
		elapsed  += delta
		var t     := elapsed / duration
		ring.scale      = Vector2.ONE * (lerpf(10.0, max_r, t) / 10.0)
		ring.modulate.a = 1.0 - t
		ring.width      = lerpf(5.0, 2.0, t)
		await get_tree().physics_frame
	ring.queue_free()

# ── Item holding ─────────────────────────────────────────────────────────────

func set_held_item(item_id: String) -> void:
	if _weapon_node == null:
		return
	_weapon_node.texture = null if item_id == "" else \
		load("res://assets/sprites/items/" + item_id + ".png")

# ── Character loading ─────────────────────────────────────────────────────────

func load_character(_path: String) -> void:
	_skill_active   = false
	_skill_cooldown = 0.0
	CharacterManager.setup_sprite($AnimatedSprite2D)
	_facing_right = true
