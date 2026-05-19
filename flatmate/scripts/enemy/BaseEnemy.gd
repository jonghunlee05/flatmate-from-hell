extends CharacterBody2D
class_name BaseEnemy

# ── Stats (override in subclass) ──────────────────────────────────────────────
@export var max_health: int = 40
@export var move_speed: float = 60.0
@export var damage: int = 10
@export var attack_range: float = 30.0
@export var attack_cooldown: float = 1.5
@export var rent_reward: int = 5

# ── Nodes ─────────────────────────────────────────────────────────────────────
@onready var sprite: AnimatedSprite2D   = $AnimatedSprite2D
@onready var health_bar: ProgressBar    = $HealthBar
@onready var attack_timer: Timer        = $AttackTimer
@onready var navigation: NavigationAgent2D = $NavigationAgent2D

# ── State ─────────────────────────────────────────────────────────────────────
enum EState { IDLE, CHASE, ATTACK, STUNNED, DEAD }
var estate: EState = EState.IDLE
var health: int
var player: Node = null
var stun_timer: float = 0.0

# ── Signals ───────────────────────────────────────────────────────────────────
signal died(enemy: Node)

func _ready() -> void:
	health = max_health
	health_bar.max_value = max_health
	health_bar.value = max_health
	attack_timer.wait_time = attack_cooldown
	attack_timer.timeout.connect(_on_attack_timer_timeout)
	_on_ready_override()
	Placeholder.apply_minion(sprite)

func _on_ready_override() -> void:
	pass  # subclasses override

func _physics_process(delta: float) -> void:
	if estate == EState.DEAD:
		return

	if estate == EState.STUNNED:
		stun_timer -= delta
		if stun_timer <= 0:
			estate = EState.CHASE
		return

	if player == null:
		player = get_tree().get_first_node_in_group("player")
		if player == null:
			return

	var dist := global_position.distance_to(player.global_position)
	match estate:
		EState.IDLE, EState.CHASE:
			_chase(delta, dist)
		EState.ATTACK:
			pass  # handled by timer

func _chase(delta: float, dist: float) -> void:
	if dist <= attack_range and attack_timer.is_stopped():
		_do_attack()
		return
	navigation.target_position = player.global_position
	var next := navigation.get_next_path_position()
	var dir := (next - global_position).normalized()
	velocity = dir * move_speed
	move_and_slide()
	sprite.flip_h = velocity.x < 0
	if velocity.length() > 5:
		sprite.play("walk")
	else:
		sprite.play("idle")

func _do_attack() -> void:
	estate = EState.ATTACK
	sprite.play("attack")
	attack_timer.start()
	_attack_hit()

func _attack_hit() -> void:
	# Subclasses override for special attacks.
	# Default: melee damage if player still in range.
	if player and global_position.distance_to(player.global_position) <= attack_range + 10:
		RunData.take_damage(damage)

func _on_attack_timer_timeout() -> void:
	estate = EState.CHASE

# ── Damage / death ────────────────────────────────────────────────────────────
func take_hit(amount: int, stun: bool = false) -> void:
	if estate == EState.DEAD:
		return
	health -= amount
	health_bar.value = health
	_flash()
	if health <= 0:
		_die()
		return
	if stun:
		estate = EState.STUNNED
		stun_timer = 1.2

func _flash() -> void:
	sprite.modulate = Color(2.0, 0.5, 0.5)
	await get_tree().create_timer(0.1).timeout
	sprite.modulate = Color.WHITE

func _die() -> void:
	estate = EState.DEAD
	sprite.play("death")
	GameManager.add_run_rent(rent_reward)
	emit_signal("died", self)
	await sprite.animation_finished
	queue_free()
