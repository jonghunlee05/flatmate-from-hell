extends Node

# ── Signals ──────────────────────────────────────────────────────────────────
signal run_started
signal run_ended(won: bool, rent_earned: int)
signal day_completed(day: int)
signal rent_changed(new_total: int)

# ── Constants ─────────────────────────────────────────────────────────────────
const MAX_DAYS_PER_STAGE := 3
const STAGES := 3
const DEATH_RENT_PENALTY := 0.5  # keep 50% rent on death

# ── Persistent (survives runs) ────────────────────────────────────────────────
var total_rent: int = 0
var current_stage: int = 1        # 1–3
var current_day: int = 1          # 1–3 within stage
var stages_unlocked: int = 1
var selected_character: String = "introvert"
var lobby_upgrades: Dictionary = {}

# ── Per-run (reset each run) ──────────────────────────────────────────────────
var run_rent: int = 0
var is_run_active: bool = false

# ── Scene paths ───────────────────────────────────────────────────────────────
const SCENE_LOBBY    := "res://scenes/lobby/Lobby.tscn"
const SCENE_GAME     := "res://scenes/game/Game.tscn"
const SCENE_MAIN_MENU := "res://scenes/main_menu/MainMenu.tscn"

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

# ─────────────────────────────────────────────────────────────────────────────
func start_run() -> void:
	run_rent = 0
	is_run_active = true
	RunData.reset()
	emit_signal("run_started")
	get_tree().change_scene_to_file(SCENE_GAME)

func add_run_rent(amount: int) -> void:
	run_rent += amount
	emit_signal("rent_changed", run_rent)

func end_run(won: bool) -> void:
	is_run_active = false
	var earned := run_rent if won else int(run_rent * DEATH_RENT_PENALTY)
	total_rent += earned
	emit_signal("run_ended", won, earned)

	if won:
		_advance_day()

	get_tree().change_scene_to_file(SCENE_LOBBY)

func _advance_day() -> void:
	emit_signal("day_completed", current_day)
	if current_day >= MAX_DAYS_PER_STAGE:
		current_day = 1
		if current_stage < STAGES:
			current_stage += 1
			stages_unlocked = max(stages_unlocked, current_stage)
	else:
		current_day += 1

func give_up_run() -> void:
	# Player chose Save & Leave — keep full run rent, no day advance.
	is_run_active = false
	total_rent += run_rent
	emit_signal("run_ended", false, run_rent)
	get_tree().paused = false
	get_tree().change_scene_to_file(SCENE_LOBBY)

func go_to_main_menu() -> void:
	get_tree().change_scene_to_file(SCENE_MAIN_MENU)
