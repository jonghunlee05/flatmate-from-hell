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

# ── Arm system (Soul Knight benchmark) ───────────────────────────────────────
#
#   Same rules as lobby Player:
#     • Body facing follows movement direction; last direction sticks on idle
#     • Arm rotates freely 360° toward the mouse every frame
#     • Arm z_index = -1 (behind body) when aiming steeply up
#     • Placeholder: Line2D arm + eye-position flip on ColorRect body
#       → both swap for Sprite2D once art is ready
#
const ARM_PIVOT_OFFSET := Vector2(0.0, -8.0)
const ARM_VISUAL_LEN   := 16.0
const FACING_UP_SIN    := -0.60    # sin threshold for "show back"

var _arm_pivot    : Node2D  = null
var _arm_line     : Line2D  = null
var _arm_right    := true    # arm direction — drives weapon flip only
var _facing_right := true    # body flip — driven by movement, sticks on idle

# ── Other state ───────────────────────────────────────────────────────────────

var _body        : ColorRect
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

const SLOW_FACTOR := 0.38

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

	# Placeholder body (ColorRect)
	_body          = ColorRect.new()
	_body.size     = Vector2(26, 34)
	_body.position = Vector2(-13, -17)
	_body.color    = Color(0.25, 0.6, 1.0)
	add_child(_body)

	# Eye — child of body, x-position flips with arm direction
	var eye          = ColorRect.new()
	eye.size         = Vector2(6, 6)
	eye.position     = Vector2(13, -10)   # starts facing right
	eye.color        = Color(1, 1, 1)
	_body.add_child(eye)

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

	if _dodging:
		_tick_dodge(delta)
		_update_arm()
		return

	if _slow_timer > 0.0:
		_slow_timer -= delta

	var dir := _input_dir()
	var spd := SPEED * (SLOW_FACTOR if _slow_timer > 0.0 else 1.0)
	velocity = dir * spd
	move_and_slide()

	# Body facing: movement drives flip, last direction sticks on idle
	if dir.x != 0:
		_facing_right = dir.x > 0
	_body.get_child(0).position.x = 13 if _facing_right else 7

	_update_arm()

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

	# Flash body and arm on swing
	_body.color = Color(0.5, 0.9, 1.0)
	_arm_line.default_color = Color(1.0, 0.95, 0.5)
	get_tree().create_timer(0.08).timeout.connect(func():
		if is_instance_valid(self):
			_body.color             = Color(0.25, 0.6, 1.0)
			_arm_line.default_color = Color(0.88, 0.72, 0.56))

# ── Invincibility ─────────────────────────────────────────────────────────────

func _tick_invincibility(delta: float) -> void:
	if _inv_timer > 0.0:
		_inv_timer -= delta
		_body.modulate.a = 0.45 if fmod(_inv_timer, 0.14) < 0.07 else 1.0
	else:
		_body.modulate.a = 1.0

# ── Energy ───────────────────────────────────────────────────────────────────

func _tick_mana(delta: float) -> void:
	if not _dodging:
		RunData.mana = minf(RunData.mana_max, RunData.mana + MANA_REGEN * delta)

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
	_inv_timer  = INVINCIBILITY_TIME
	_body.color = Color(1.0, 0.2, 0.2)
	get_tree().create_timer(0.12).timeout.connect(func():
		if is_instance_valid(self): _body.color = Color(0.25, 0.6, 1.0))
