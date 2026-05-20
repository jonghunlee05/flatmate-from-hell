extends Node2D

var BOSS_SCENE: PackedScene

@onready var boss_spawn: Marker2D = $BossSpawn

func _ready() -> void:
	BOSS_SCENE = load("res://scenes/game/enemies/BossSlob.tscn")
	var pm := get_tree().get_first_node_in_group("phase_manager")
	if pm:
		pm.phase_started.connect(_on_phase_started)

func _on_phase_started(phase: int) -> void:
	# PhaseManager.Phase.MIDNIGHT == 3
	if phase == 3:
		_spawn_boss()

func _spawn_boss() -> void:
	var boss := BOSS_SCENE.instantiate()
	add_child(boss)
	boss.global_position = boss_spawn.global_position
