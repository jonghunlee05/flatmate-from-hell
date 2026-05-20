extends BaseEnemy
# Stage 1 Boss — The Messy Slob
# Three phases keyed to HP thresholds.

# ── Stats ─────────────────────────────────────────────────────────────────────
@export var phase2_threshold: float = 0.6  # 60% HP
@export var phase3_threshold: float = 0.3  # 30% HP

# ── Nodes ─────────────────────────────────────────────────────────────────────
@onready var projectile_timer: Timer = $ProjectileTimer
@onready var summon_timer: Timer     = $SummonTimer
@onready var phase_label: Label      = $PhaseLabel

# ── Boss state ────────────────────────────────────────────────────────────────
var boss_phase: int = 1
var enraged: bool = false

var DISH_PROJECTILE: PackedScene
var MINION_SCENE: PackedScene

func _on_ready_override() -> void:
	DISH_PROJECTILE = load("res://scenes/game/projectiles/DishProjectile.tscn")
	MINION_SCENE    = load("res://scenes/game/enemies/MinionClutter.tscn")
	max_health = 300
	health = 300
	move_speed = 55.0
	damage = 15
	attack_range = 40.0
	rent_reward = 80
	health_bar.max_value = 300
	health_bar.value = 300
	projectile_timer.wait_time = 2.5
	projectile_timer.timeout.connect(_on_projectile_timer_timeout)
	projectile_timer.start()
	summon_timer.wait_time = 12.0
	summon_timer.timeout.connect(_on_summon_timer_timeout)
	summon_timer.start()
	phase_label.text = "Phase 1 — Passive Aggressive"
	Placeholder.apply_slob(sprite)

func _physics_process(delta: float) -> void:
	_check_phase_transition()
	super._physics_process(delta)

func _check_phase_transition() -> void:
	var pct := float(health) / float(max_health)
	if boss_phase == 1 and pct <= phase2_threshold:
		_enter_phase(2)
	elif boss_phase == 2 and pct <= phase3_threshold:
		_enter_phase(3)

func _enter_phase(p: int) -> void:
	boss_phase = p
	match p:
		2:
			move_speed = 80.0
			projectile_timer.wait_time = 1.5
			phase_label.text = "Phase 2 — Full Meltdown"
			_burst_projectiles(6)
		3:
			move_speed = 110.0
			projectile_timer.wait_time = 0.8
			damage = 22
			enraged = true
			phase_label.text = "Phase 3 — ENRAGED"
			_burst_projectiles(12)

func _on_projectile_timer_timeout() -> void:
	_throw_dishes()

func _throw_dishes() -> void:
	var count := 3 if boss_phase == 1 else (5 if boss_phase == 2 else 8)
	var spread := TAU / count
	for i in range(count):
		var proj = DISH_PROJECTILE.instantiate()
		get_parent().add_child(proj)
		proj.global_position = global_position
		var angle := spread * i + randf() * 0.3
		proj.direction = Vector2.RIGHT.rotated(angle)
		proj.damage = damage

func _burst_projectiles(count: int) -> void:
	for i in range(count):
		var proj = DISH_PROJECTILE.instantiate()
		get_parent().add_child(proj)
		proj.global_position = global_position
		proj.direction = Vector2.RIGHT.rotated((TAU / count) * i)
		proj.damage = damage

func _on_summon_timer_timeout() -> void:
	if boss_phase < 2:
		return
	var count := 2 if boss_phase == 2 else 4
	for i in range(count):
		var minion = MINION_SCENE.instantiate()
		get_parent().add_child(minion)
		minion.global_position = global_position + Vector2(randf_range(-60, 60), randf_range(-60, 60))

func _die() -> void:
	projectile_timer.stop()
	summon_timer.stop()
	# Signal PhaseManager that boss is dead
	get_tree().get_first_node_in_group("phase_manager").on_boss_defeated()
	super._die()
