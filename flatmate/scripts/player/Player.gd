extends CharacterBody2D

# ── Nodes (set in scene) ──────────────────────────────────────────────────────
@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D
@onready var attack_pivot: Node2D     = $AttackPivot
@onready var attack_area: Area2D      = $AttackPivot/AttackArea
@onready var hitbox: Area2D           = $Hitbox
@onready var dodge_timer: Timer       = $DodgeTimer
@onready var attack_timer: Timer      = $AttackTimer
@onready var interact_area: Area2D    = $InteractArea
@onready var invincibility_timer: Timer = $InvincibilityTimer

# ── State ─────────────────────────────────────────────────────────────────────
enum State { IDLE, MOVE, DODGE, ATTACK, DEAD }
var state: State = State.IDLE

var dodge_direction: Vector2 = Vector2.ZERO
var is_invincible: bool = false
var attack_combo: int = 0  # 0 or 1 for two-hit combo
var nearby_interactables: Array = []

# ── Stats (pulled from RunData) ───────────────────────────────────────────────
var move_speed: float
var dodge_speed: float
var dodge_duration: float
var attack_damage: int
var attack_speed: float  # attacks per second

# ── Signals ───────────────────────────────────────────────────────────────────
signal attacked(damage: int, position: Vector2)
signal interacted

func _ready() -> void:
	Placeholder.apply_player(sprite)
	_sync_stats()
	RunData.composure_changed.connect(_on_composure_changed)
	RunData.synergy_triggered.connect(_on_synergy)
	hitbox.area_entered.connect(_on_hitbox_area_entered)
	interact_area.body_entered.connect(_on_interact_area_body_entered)
	interact_area.body_exited.connect(_on_interact_area_body_exited)
	dodge_timer.timeout.connect(_on_dodge_timer_timeout)
	attack_timer.timeout.connect(_on_attack_timer_timeout)
	invincibility_timer.timeout.connect(_on_invincibility_timer_timeout)
	attack_area.monitoring = false

func _sync_stats() -> void:
	move_speed    = RunData.move_speed
	dodge_speed   = RunData.dodge_speed
	dodge_duration = RunData.dodge_duration
	attack_damage = int(10 * RunData.attack_damage_mult)
	attack_speed  = 1.2

	# Apply passive item effects
	if "slippers" in RunData.passives:
		move_speed *= 1.25

func _physics_process(delta: float) -> void:
	match state:
		State.IDLE, State.MOVE:
			_handle_movement()
			_handle_aim()
			_check_inputs()
		State.DODGE:
			velocity = dodge_direction * dodge_speed
			move_and_slide()
		State.ATTACK:
			velocity = velocity.move_toward(Vector2.ZERO, move_speed * 4 * delta)
			move_and_slide()
		State.DEAD:
			velocity = Vector2.ZERO

func _handle_movement() -> void:
	var dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	velocity = dir * move_speed
	move_and_slide()
	state = State.MOVE if dir != Vector2.ZERO else State.IDLE
	_update_anim(dir)

func _handle_aim() -> void:
	var mouse := get_global_mouse_position()
	attack_pivot.look_at(mouse)

func _update_anim(dir: Vector2) -> void:
	if state == State.IDLE:
		sprite.play("idle")
		return
	if abs(dir.x) >= abs(dir.y):
		sprite.play("walk_side")
		sprite.flip_h = dir.x < 0
	elif dir.y < 0:
		sprite.play("walk_up")
	else:
		sprite.play("walk_down")

func _check_inputs() -> void:
	if Input.is_action_just_pressed("attack"):
		_start_attack()
	if Input.is_action_just_pressed("dodge") and state != State.DODGE:
		_start_dodge()
	if Input.is_action_just_pressed("interact"):
		_do_interact()

# ── Attack ────────────────────────────────────────────────────────────────────
func _start_attack() -> void:
	if state == State.ATTACK or not attack_timer.is_stopped():
		return
	state = State.ATTACK
	sprite.play("attack")
	attack_area.monitoring = true

	var dmg := attack_damage
	# Synergy: Breakfast Combo — stun on heavy (every other hit)
	var stun := false
	if "breakfast_combo" in RunData.synergies and attack_combo == 1:
		stun = true
	# Synergy: Commuter Rage — broom scales with speed
	if "commuter_rage" in RunData.synergies and RunData.weapon == "broom":
		dmg += int((move_speed - 150.0) / 10.0)

	emit_signal("attacked", dmg, global_position)
	_deal_damage_to_area(dmg, stun)

	attack_combo = (attack_combo + 1) % 2
	attack_timer.wait_time = 1.0 / attack_speed
	attack_timer.start()

func _deal_damage_to_area(dmg: int, stun: bool) -> void:
	for body in attack_area.get_overlapping_bodies():
		if body.has_method("take_hit"):
			body.take_hit(dmg, stun)
	for area in attack_area.get_overlapping_areas():
		if area.has_method("take_hit"):
			area.take_hit(dmg, stun)

func _on_attack_timer_timeout() -> void:
	attack_area.monitoring = false
	state = State.IDLE

# ── Dodge ─────────────────────────────────────────────────────────────────────
func _start_dodge() -> void:
	var dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	if dir == Vector2.ZERO:
		dir = Vector2.RIGHT.rotated(attack_pivot.rotation)
	dodge_direction = dir.normalized()
	state = State.DODGE
	is_invincible = true
	sprite.play("dodge")
	dodge_timer.wait_time = dodge_duration
	dodge_timer.start()

func _on_dodge_timer_timeout() -> void:
	state = State.IDLE
	is_invincible = false
	invincibility_timer.wait_time = 0.15  # brief grace after dodge
	invincibility_timer.start()

func _on_invincibility_timer_timeout() -> void:
	is_invincible = false

# ── Interact ──────────────────────────────────────────────────────────────────
func _do_interact() -> void:
	if nearby_interactables.is_empty():
		return
	var target = nearby_interactables[0]
	if target.has_method("interact"):
		target.interact(self)
	emit_signal("interacted")

func _on_interact_area_body_entered(body: Node) -> void:
	if body.has_method("interact"):
		nearby_interactables.append(body)

func _on_interact_area_body_exited(body: Node) -> void:
	nearby_interactables.erase(body)

# ── Damage reception ──────────────────────────────────────────────────────────
func _on_hitbox_area_entered(area: Area2D) -> void:
	if is_invincible:
		return
	if area.is_in_group("enemy_projectile") or area.is_in_group("enemy_attack"):
		var dmg: int = area.get_meta("damage", 10)
		# Check headphones immunity for sound attacks
		if area.is_in_group("sound_attack"):
			if "headphones" in RunData.passives or "deep_focus" in RunData.synergies:
				return
			if "earplugs" in RunData.passives:
				dmg = int(dmg * 0.4)
		RunData.take_damage(dmg)
		_flash_hurt()
		is_invincible = true
		invincibility_timer.wait_time = 0.6
		invincibility_timer.start()

func _flash_hurt() -> void:
	sprite.modulate = Color(1.5, 0.3, 0.3)
	await get_tree().create_timer(0.12).timeout
	sprite.modulate = Color.WHITE

func _on_composure_changed(_cur: int, _max: int) -> void:
	pass  # HUD listens directly to RunData

func _on_synergy(_synergy_id: String) -> void:
	_sync_stats()  # re-apply stats with new synergy
