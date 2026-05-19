extends Node2D
# Root script for the Game scene. Owns PhaseManager, spawns the level and player.

@onready var phase_manager = $PhaseManager
@onready var hud           = $HUD
@onready var world: Node2D        = $World
@onready var player_spawn: Marker2D = $World/PlayerSpawn

var PLAYER_SCENE: PackedScene
const LEVELS := {
	1: {
		1: "res://scenes/game/levels/stage1/Day1Morning.tscn",
	}
}

var player: Node = null

func _ready() -> void:
	PLAYER_SCENE = load("res://scenes/game/player/Player.tscn")
	if PLAYER_SCENE == null:
		push_error("FATAL: Could not load Player.tscn")
		return
	_load_level()
	_spawn_player()
	if phase_manager == null:
		push_error("FATAL: PhaseManager node not found")
		return
	phase_manager.phase_started.connect(_on_phase_started)
	phase_manager.phase_timer_tick.connect(func(t): hud.set_timer(t))
	phase_manager.day_won.connect(_on_day_won)
	phase_manager.day_lost.connect(_on_day_lost)
	phase_manager.start_day()

func _load_level() -> void:
	var stage := GameManager.current_stage
	var day   := GameManager.current_day
	var path: String = LEVELS.get(stage, {}).get(day, "")
	if path == "":
		push_warning("No level found for Stage %d Day %d" % [stage, day])
		return
	var level_scene: PackedScene = load(path)
	if level_scene:
		var level: Node = level_scene.instantiate()
		world.add_child(level)

func _spawn_player() -> void:
	player = PLAYER_SCENE.instantiate()
	world.add_child(player)
	player.global_position = player_spawn.global_position
	player.add_to_group("player")

func _on_phase_started(_phase: int) -> void:
	hud.set_phase(phase_manager.get_phase_name())
	hud.set_timer(phase_manager.time_remaining)

func _on_day_won() -> void:
	# Brief fanfare then GameManager.end_run(true) already called via PhaseManager
	pass

func _on_day_lost() -> void:
	pass
