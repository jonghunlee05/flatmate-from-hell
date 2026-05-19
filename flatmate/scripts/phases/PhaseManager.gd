extends Node

# ── Phases ────────────────────────────────────────────────────────────────────
enum Phase { MORNING, AFTERNOON, EVENING, MIDNIGHT }

const PHASE_DURATIONS := {
	Phase.MORNING:   150.0,  # 2.5 min
	Phase.AFTERNOON: 210.0,  # 3.5 min
	Phase.EVENING:   270.0,  # 4.5 min
	Phase.MIDNIGHT:  -1.0,   # no timer — ends when boss dies
}

const PHASE_NAMES := {
	Phase.MORNING:   "Morning",
	Phase.AFTERNOON: "Afternoon",
	Phase.EVENING:   "Evening",
	Phase.MIDNIGHT:  "Midnight",
}

# ── Signals ───────────────────────────────────────────────────────────────────
signal phase_started(phase: Phase)
signal phase_ended(phase: Phase)
signal phase_timer_tick(remaining: float)
signal day_won
signal day_lost

# ── State ─────────────────────────────────────────────────────────────────────
var current_phase: Phase = Phase.MORNING
var time_remaining: float = 0.0
var phase_active: bool = false

func _ready() -> void:
	add_to_group("phase_manager")
	RunData.player_died.connect(_on_player_died)

func start_day() -> void:
	current_phase = Phase.MORNING
	_begin_phase()

func _begin_phase() -> void:
	phase_active = true
	time_remaining = PHASE_DURATIONS[current_phase]
	emit_signal("phase_started", current_phase)

func _process(delta: float) -> void:
	if not phase_active:
		return
	if PHASE_DURATIONS[current_phase] < 0:
		return  # MIDNIGHT ends via boss death, not timer
	time_remaining -= delta
	emit_signal("phase_timer_tick", time_remaining)
	if time_remaining <= 0.0:
		end_current_phase()

func end_current_phase(success: bool = true) -> void:
	if not phase_active:
		return
	phase_active = false
	emit_signal("phase_ended", current_phase)

	if not success:
		emit_signal("day_lost")
		GameManager.end_run(false)
		return

	if current_phase == Phase.MIDNIGHT:
		emit_signal("day_won")
		GameManager.end_run(true)
		return

	current_phase = (current_phase + 1) as Phase
	_begin_phase()

func on_boss_defeated() -> void:
	end_current_phase(true)

func _on_player_died() -> void:
	end_current_phase(false)

func get_phase_name() -> String:
	return PHASE_NAMES[current_phase]

func get_phase_threat() -> int:
	# 0 = low, 1 = medium, 2 = high, 3 = peak
	return current_phase as int
