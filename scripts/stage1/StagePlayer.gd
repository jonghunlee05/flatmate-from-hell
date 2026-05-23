extends CharacterBody2D

const SPEED := 220.0
const DODGE_SPEED := 480.0
const DODGE_DURATION := 0.22
const DODGE_COST := 1.0
const MANA_REGEN := 0.5
const ATTACK_RANGE := 55.0
const ATTACK_DAMAGE := 2.0
const ATTACK_COOLDOWN := 0.45
const INVINCIBILITY_TIME := 0.9

# ── Sprite sheet data (mirrors lobby Player.gd) ───────────────────────────────
const CHARACTER_PATHS := {
	"introvert":   "res://assets/sprites/player/introvert.png",
	"petty":       "res://assets/sprites/player/petty_one.png",
	"peacekeeper": "res://assets/sprites/player/peace_keeper.png",
	"goblin":      "res://assets/sprites/player/chaos_goblin.png",
}
const CHARACTER_SHEET_DATA := {
	"introvert":   { "frame_w": 349, "frame_h": 259, "scale": 0.40,
		"anims": [["walk", 6.0, 0, 6], ["idle", 4.0, 259, 4], ["skill", 6.0, 518, 5], ["hit", 16.0, 777, 2]] },
	"goblin":      { "frame_w": 348, "frame_h": 256, "scale": 0.40,
		"anims": [["walk", 6.0, 0, 6], ["idle", 2.0, 256, 4], ["skill", 6.0, 512, 5], ["hit", 16.0, 768, 3]] },
	"peacekeeper": { "frame_w": 403, "frame_h": 291, "scale": 0.45,
		"anims": [["walk", 6.0, 0, 6], ["idle", 4.0, 291, 4], ["skill", 5.0, 582, 5], ["hit", 16.0, 873, 3]] },
	"petty":       { "frame_w": 351, "frame_h": 296, "scale": 0.45,
		"anims": [["walk", 6.0, 0, 6], ["idle", 2.0, 296, 4], ["skill", 3.0, 592, 5], ["hit", 16.0, 888, 3]] },
}

# ── Arm system ────────────────────────────────────────────────────────────────
const ARM_PIVOT_OFFSET := Vector2(0.0, -8.0)
const ARM_VISUAL_LEN   := 16.0
const FACING_UP_SIN    := -0.60

var _arm_pivot    : Node2D  = null
var _arm_line     : Line2D  = null
var _arm_right    := true
var _facing_right := true

# ── Other state ───────────────────────────────────────────────────────────────

var _sprite      : AnimatedSprite2D
var _attack_area : Area2D
var _dodging     := false
var _dodge_timer := 0.0
var _dodge_dir   := Vector2.RIGHT
var _attack_timer    := 0.0
var _inv_timer       := 0.0
var _near_scavenge   : Node2D = null
var _e_was_pressed   := false
var _knockback       := Vector2.ZERO
var _knockback_timer := 0.0
var _slow_timer      := 0.0
var _last_dir        := Vector2(1.0, 0.0)

const SLOW_FACTOR := 0.38

# ── Skill system ──────────────────────────────────────────────────────────────
const SKILL_DASH_SPEED := 900.0
const SKILL_DASH_HOLD  := 0.18
const SKILL_DASH_DECEL := 0.20
const SLAM_RADIUS      := 90.0
const SKILL_COOLDOWN_MAX := 1.0

var _skill_active   := false
var _skill_cooldown := 0.0
var _skill_hud      : CanvasLayer
var _skill_cd_bar   : ProgressBar
var _skill_cd_label : Label

# ─────────────────────────────────────────────────────────────────────────────

func _ready() -> void:
	add_to_group("player")
	collision_layer = 1
	collision_mask  = 2   # walls only

	# Collision capsule
	var col := CollisionShape2D.new()
	var cap := CapsuleShape2D.new()
	cap.radius = 13.0
	cap.height = 26.0
	col.shape  = cap
	add_child(col)

	# Character sprite
	_sprite = AnimatedSprite2D.new()
	add_child(_sprite)
	_setup_sprite()

	# Attack area
	_attack_area                  = Area2D.new()
	_attack_area.collision_layer  = 0
	_attack_area.collision_mask   = 4   # enemy layer
	add_child(_attack_area)
	var ac   := CollisionShape2D.new()
	var as_  := CircleShape2D.new()
	as_.radius = ATTACK_RANGE
	ac.shape   = as_
	ac.disabled = true
	_attack_area.add_child(ac)

	_setup_arm()
	_setup_skill_hud()

# ── Sprite setup ─────────────────────────────────────────────────────────────

func _setup_sprite() -> void:
	var char_id : String = RunData.active_character
	var path    : String = CHARACTER_PATHS[char_id] if CHARACTER_PATHS.has(char_id) else CHARACTER_PATHS["introvert"]
	var texture : Texture2D = load(path)
	var data    : Dictionary = CHARACTER_SHEET_DATA[char_id] if CHARACTER_SHEET_DATA.has(char_id) else CHARACTER_SHEET_DATA["introvert"]
	var fw      : int   = int(data["frame_w"])
	var fh      : int   = int(data["frame_h"])
	var s       : float = float(data["scale"])
	var frames  : SpriteFrames = SpriteFrames.new()
	var one_shot : Array = ["skill", "hit"]
	for anim in data["anims"] as Array:
		var anim_name : String = str(anim[0])
		var fps       : float  = float(anim[1])
		var y_start   : int    = int(anim[2])
		var count     : int    = int(anim[3])
		frames.add_animation(anim_name)
		frames.set_animation_speed(anim_name, fps)
		frames.set_animation_loop(anim_name, not (anim_name in one_shot))
		for col in range(count):
			var atlas := AtlasTexture.new()
			atlas.atlas  = texture
			atlas.region = Rect2(col * fw, y_start, fw, fh)
			frames.add_frame(anim_name, atlas)
	_sprite.sprite_frames = frames
	_sprite.scale = Vector2(s, s)
	_sprite.play("idle")

# ── Arm setup ────────────────────────────────────────────────────────────────

func _setup_arm() -> void:
	_arm_pivot          = Node2D.new()
	_arm_pivot.name     = "ArmPivot"
	_arm_pivot.position = ARM_PIVOT_OFFSET
	_arm_pivot.z_index  = 1
	add_child(_arm_pivot)

	_arm_line = Line2D.new()
	_arm_line.name = "ArmLine"
	_arm_line.add_point(Vector2.ZERO)
	_arm_line.add_point(Vector2(ARM_VISUAL_LEN, 0.0))
	_arm_line.width         = 5.0
	_arm_line.default_color = Color(0.88, 0.72, 0.56)
	_arm_pivot.add_child(_arm_line)

# ── Arm update ───────────────────────────────────────────────────────────────

func _update_arm() -> void:
	var angle := (get_global_mouse_position() - _arm_pivot.global_position).angle()
	_arm_pivot.rotation = angle
	_arm_right = cos(angle) >= 0.0

	# Arm behind body when aiming steeply upward, in front otherwise
	_arm_pivot.z_index = -1 if sin(angle) < FACING_UP_SIN else 1

# ── Physics ───────────────────────────────────────────────────────────────────

func _physics_process(delta: float) -> void:
	_tick_invincibility(delta)
	_tick_attack(delta)
	_tick_mana(delta)
	_tick_scavenge_check()
	_tick_skill_cooldown(delta)

	var e := Input.is_physical_key_pressed(KEY_E)
	if e and not _e_was_pressed and _near_scavenge != null:
		_near_scavenge.interact()
	_e_was_pressed = e

	if _knockback_timer > 0.0:
		_knockback_timer -= delta
		velocity = _knockback
		move_and_slide()
		_update_arm()
		return

	# Skill owns velocity while active
	if _skill_active:
		_update_arm()
		return

	if _dodging:
		_tick_dodge(delta)
		_update_arm()
		return

	if _slow_timer > 0.0:
		_slow_timer -= delta

	var dir := _input_dir()
	if dir != Vector2.ZERO:
		_last_dir = dir
	var spd := SPEED * (SLOW_FACTOR if _slow_timer > 0.0 else 1.0)
	velocity = dir * spd
	move_and_slide()

	# Body facing: movement drives flip, last direction sticks on idle
	if dir.x != 0:
		_facing_right = dir.x > 0
	_sprite.flip_h = not _facing_right

	# Animation
	var anim := "walk" if dir != Vector2.ZERO else "idle"
	if _sprite.animation != anim:
		_sprite.play(anim)

	_update_arm()

	# Skill — Shift key
	if Input.is_physical_key_pressed(KEY_SHIFT) and _skill_cooldown <= 0.0 and not _skill_active:
		_play_skill()

	# Dodge — Space + direction
	if Input.is_action_just_pressed("ui_accept") and dir != Vector2.ZERO:
		_begin_dodge(dir)

func _input_dir() -> Vector2:
	var d := Vector2.ZERO
	if Input.is_action_pressed("move_up"):    d.y -= 1
	if Input.is_action_pressed("move_down"):  d.y += 1
	if Input.is_action_pressed("move_left"):  d.x -= 1
	if Input.is_action_pressed("move_right"): d.x += 1
	return d.normalized()

# ── Dodge ────────────────────────────────────────────────────────────────────

func _tick_dodge(delta: float) -> void:
	_dodge_timer -= delta
	velocity = _dodge_dir * DODGE_SPEED
	move_and_slide()
	if _dodge_timer <= 0.0:
		_dodging = false

func _begin_dodge(dir: Vector2) -> void:
	if not RunData.use_mana(DODGE_COST):
		return
	_dodging    = true
	_dodge_dir  = dir
	_dodge_timer = DODGE_DURATION
	_inv_timer   = DODGE_DURATION + 0.08

# ── Attack ───────────────────────────────────────────────────────────────────

func _tick_attack(delta: float) -> void:
	_attack_timer -= delta
	if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT) and _attack_timer <= 0.0:
		_do_attack()
		_attack_timer = ATTACK_COOLDOWN

func _do_attack() -> void:
	var mouse_dir    := (get_global_mouse_position() - global_position).normalized()
	var attack_center := global_position + mouse_dir * 36.0

	var query := PhysicsShapeQueryParameters2D.new()
	var shape  := CircleShape2D.new()
	shape.radius       = ATTACK_RANGE
	query.shape        = shape
	query.transform    = Transform2D(0.0, attack_center)
	query.collision_mask = 4
	query.exclude      = [self]

	for hit in get_world_2d().direct_space_state.intersect_shape(query, 8):
		var col = hit.collider
		if col.has_method("take_damage"):
			col.take_damage(ATTACK_DAMAGE)

	# Flash on swing
	_sprite.modulate = Color(0.5, 0.9, 1.0)
	_arm_line.default_color = Color(1.0, 0.95, 0.5)
	get_tree().create_timer(0.08).timeout.connect(func():
		if is_instance_valid(self):
			_sprite.modulate        = Color.WHITE
			_arm_line.default_color = Color(0.88, 0.72, 0.56))

# ── Invincibility ─────────────────────────────────────────────────────────────

func _tick_invincibility(delta: float) -> void:
	if _inv_timer > 0.0:
		_inv_timer -= delta
		_sprite.modulate.a = 0.45 if fmod(_inv_timer, 0.14) < 0.07 else 1.0
	else:
		_sprite.modulate.a = 1.0

# ── Energy ───────────────────────────────────────────────────────────────────

func _tick_mana(delta: float) -> void:
	if not _dodging:
		RunData.mana = minf(RunData.mana_max, RunData.mana + MANA_REGEN * delta)

# ── Skill HUD ────────────────────────────────────────────────────────────────

func _setup_skill_hud() -> void:
	_skill_hud = CanvasLayer.new()
	add_child(_skill_hud)
	var box := PanelContainer.new()
	box.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	box.anchor_left = 0.5; box.anchor_right = 0.5
	box.anchor_top  = 1.0; box.anchor_bottom = 1.0
	box.offset_left = -36; box.offset_right  =  36
	box.offset_top  = -80; box.offset_bottom = -16
	_skill_hud.add_child(box)
	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 3)
	box.add_child(vbox)
	var icon_lbl := Label.new()
	icon_lbl.text = "✦"
	icon_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	icon_lbl.add_theme_font_size_override("font_size", 18)
	icon_lbl.add_theme_color_override("font_color", Color(0.5, 0.85, 1.0))
	vbox.add_child(icon_lbl)
	_skill_cd_bar = ProgressBar.new()
	_skill_cd_bar.custom_minimum_size = Vector2(60, 6)
	_skill_cd_bar.max_value = SKILL_COOLDOWN_MAX
	_skill_cd_bar.value = 0.0
	_skill_cd_bar.show_percentage = false
	var fill := StyleBoxFlat.new()
	fill.bg_color = Color(0.5, 0.85, 1.0)
	_skill_cd_bar.add_theme_stylebox_override("fill", fill)
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color(0.1, 0.1, 0.15, 0.8)
	_skill_cd_bar.add_theme_stylebox_override("background", bg)
	vbox.add_child(_skill_cd_bar)
	_skill_cd_label = Label.new()
	_skill_cd_label.text = "SHIFT"
	_skill_cd_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_skill_cd_label.add_theme_font_size_override("font_size", 10)
	_skill_cd_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
	vbox.add_child(_skill_cd_label)

func _tick_skill_cooldown(delta: float) -> void:
	if _skill_cooldown > 0.0:
		_skill_cooldown -= delta
		_skill_cd_bar.value = _skill_cooldown
		_skill_cd_label.text = "%.1fs" % maxf(_skill_cooldown, 0.0)
	else:
		_skill_cd_bar.value = 0.0
		_skill_cd_label.text = "SHIFT"

# ── Skill execution ───────────────────────────────────────────────────────────

func _play_skill() -> void:
	_skill_active = true
	var cooldowns := {"introvert": 1.0, "goblin": 1.0, "peacekeeper": 8.0, "petty": 1.0}
	_skill_cooldown = float(cooldowns.get(RunData.active_character, SKILL_COOLDOWN_MAX))
	_skill_cd_bar.max_value = _skill_cooldown
	_sprite.flip_h = not _facing_right
	_sprite.play("skill")
	match RunData.active_character:
		"introvert":  await _skill_dash()
		"goblin":     await _skill_slam()
		"peacekeeper": await _skill_barrier()
		"petty":      await _skill_shove()
		_:            await _skill_dash()
	_skill_active = false
	velocity = Vector2.ZERO
	_sprite.play("idle")

func _skill_dash() -> void:
	var dash_dir := _last_dir
	var elapsed  := 0.0
	while _sprite.is_playing():
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

func _skill_slam() -> void:
	var shadow := ColorRect.new()
	shadow.color = Color(0.0, 0.0, 0.0, 0.45)
	shadow.size  = Vector2(60, 18)
	shadow.position = Vector2(-30, 18)
	shadow.z_index  = -1
	add_child(shadow)
	var jump_targets := {0: 6.0, 1: -28.0, 2: -48.0, 3: 0.0, 4: 0.0}
	var sprite_origin : Vector2 = _sprite.position
	var last_frame := -1
	while _sprite.is_playing():
		var f      : int   = _sprite.frame
		var target : float = float(jump_targets.get(f, 0.0))
		var delta          := get_physics_process_delta_time()
		var speed  := 8.0 if f < 3 else 999.0
		var weight := minf(speed * delta, 1.0)
		_sprite.position.y = lerpf(_sprite.position.y, sprite_origin.y + target, weight)
		match f:
			0: shadow.visible = false
			1: shadow.visible = true; shadow.scale = Vector2(0.4, 0.4); shadow.position = Vector2(-12, 18)
			2: shadow.visible = true; shadow.scale = Vector2(0.7, 0.7); shadow.position = Vector2(-21, 18)
			3:
				shadow.visible = true; shadow.scale = Vector2(1.0, 1.0); shadow.position = Vector2(-30, 18)
				if last_frame != 3:
					_screen_shake(0.18, 6.0)
					_show_slam_ring()
			4: shadow.visible = true; shadow.scale = Vector2(0.5, 0.5); shadow.position = Vector2(-15, 18)
		last_frame = f
		velocity   = Vector2.ZERO
		move_and_slide()
		await get_tree().physics_frame
	_sprite.position = sprite_origin
	shadow.queue_free()

func _show_slam_ring() -> void:
	var ring := Line2D.new()
	ring.width = 4.0
	ring.default_color = Color(1.0, 0.45, 0.0, 1.0)
	ring.z_index = 2
	for i in range(41):
		var angle := (float(i) / 40) * TAU
		ring.add_point(Vector2(cos(angle), sin(angle)) * SLAM_RADIUS)
	ring.position = Vector2(0, 20)
	add_child(ring)
	var elapsed := 0.0
	while elapsed < 0.5:
		var delta := get_physics_process_delta_time()
		elapsed  += delta
		var t     := elapsed / 0.5
		ring.scale      = Vector2.ONE * (1.0 + t * 0.35)
		ring.modulate.a = 1.0 - t
		await get_tree().physics_frame
	ring.queue_free()

func _screen_shake(duration: float, strength: float) -> void:
	var origin : Vector2 = _sprite.position
	var elapsed := 0.0
	while elapsed < duration:
		var delta := get_physics_process_delta_time()
		elapsed  += delta
		var t     := 1.0 - elapsed / duration
		_sprite.position = origin + Vector2(randf_range(-strength, strength) * t, randf_range(-strength, strength) * t)
		await get_tree().physics_frame
	_sprite.position = origin

func _skill_barrier() -> void:
	while _sprite.is_playing():
		velocity = Vector2.ZERO
		move_and_slide()
		await get_tree().physics_frame
	_show_persistent_barrier()

func _show_persistent_barrier() -> void:
	const HEX_RX := 40.0
	const HEX_RY := 68.0
	var make_hex := func(rx: float, ry: float) -> PackedVector2Array:
		var p : PackedVector2Array = []
		for i in range(6):
			var a := -PI / 2.0 + i * TAU / 6.0
			p.append(Vector2(cos(a) * rx, sin(a) * ry))
		return p
	var outer := Polygon2D.new()
	outer.color = Color(0.25, 0.92, 0.42, 0.22)
	outer.polygon = make_hex.call(HEX_RX + 10.0, HEX_RY + 14.0)
	outer.z_index = 1
	add_child(outer)
	var inner := Polygon2D.new()
	inner.color = Color(0.35, 0.98, 0.50, 0.42)
	inner.polygon = make_hex.call(HEX_RX, HEX_RY)
	inner.z_index = 1
	add_child(inner)
	outer.modulate.a = 0.0; inner.modulate.a = 0.0
	var elapsed := 0.0
	while elapsed < 0.5:
		elapsed += get_physics_process_delta_time()
		var t := elapsed / 0.5
		outer.modulate.a = t; inner.modulate.a = t
		await get_tree().physics_frame
	elapsed = 0.0
	while elapsed < 3.0:
		elapsed += get_physics_process_delta_time()
		await get_tree().physics_frame
	elapsed = 0.0
	while elapsed < 1.0:
		elapsed += get_physics_process_delta_time()
		var t := elapsed / 1.0
		outer.modulate.a = 1.0 - t; inner.modulate.a = 1.0 - t
		await get_tree().physics_frame
	outer.queue_free(); inner.queue_free()

func _skill_shove() -> void:
	var last_frame := -1
	while _sprite.is_playing():
		var f : int = _sprite.frame
		if f != last_frame and f in [1, 2, 3]:
			_emit_guilt_wave(f)
		last_frame = f
		velocity   = Vector2.ZERO
		move_and_slide()
		await get_tree().physics_frame

func _emit_guilt_wave(wave_index: int) -> void:
	var colours := [Color(0.72, 0.2, 1.0, 1.0), Color(1.0, 0.25, 0.75, 1.0), Color(0.5, 0.1, 0.9, 1.0)]
	var colour : Color = colours[wave_index % colours.size()]
	var ring := Line2D.new()
	ring.width = 5.0
	ring.default_color = colour
	ring.z_index = 2
	for i in range(49):
		var angle := (float(i) / 48) * TAU
		ring.add_point(Vector2(cos(angle), sin(angle)) * 10.0)
	ring.position = Vector2(0, 10)
	add_child(ring)
	var elapsed  := 0.0
	var duration := 1.2
	var max_r    := 220.0 + wave_index * 40.0
	while elapsed < duration:
		var delta := get_physics_process_delta_time()
		elapsed  += delta
		var t     := elapsed / duration
		ring.scale      = Vector2.ONE * (lerpf(10.0, max_r, t) / 10.0)
		ring.modulate.a = 1.0 - t
		ring.width      = lerpf(5.0, 2.0, t)
		await get_tree().physics_frame
	ring.queue_free()

# ── Scavenge proximity ────────────────────────────────────────────────────────

func _tick_scavenge_check() -> void:
	var prev := _near_scavenge
	_near_scavenge = null
	for obj in get_tree().get_nodes_in_group("interactable"):
		if is_instance_valid(obj) and obj.global_position.distance_to(global_position) < 72.0:
			_near_scavenge = obj
			break
	if prev != _near_scavenge:
		if prev != null and is_instance_valid(prev):
			prev.show_prompt(false)
		if _near_scavenge != null:
			_near_scavenge.show_prompt(true)

# ── Hit response ──────────────────────────────────────────────────────────────

func apply_knockback(force: Vector2) -> void:
	_knockback       = force
	_knockback_timer = 0.18

func apply_slow(duration: float) -> void:
	_slow_timer = maxf(_slow_timer, duration)

func take_damage(amount: float) -> void:
	if _dodging or _inv_timer > 0.0:
		return
	RunData.take_damage(amount)
	RunData.add_chaos(0.35)
	_inv_timer        = INVINCIBILITY_TIME
	_sprite.modulate  = Color(1.0, 0.2, 0.2)
	get_tree().create_timer(0.12).timeout.connect(func():
		if is_instance_valid(self): _sprite.modulate = Color.WHITE)
