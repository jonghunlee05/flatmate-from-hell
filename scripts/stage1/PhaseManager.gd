extends Node

signal phase_started(phase: int)
signal phase_timer_tick(time_left: float)
signal midnight_started()

# Day 1 durations. Day 2/3 can reduce these for pressure.
const PHASE_DURATIONS: Array[float] = [50.0, 50.0, 50.0, 0.0]

var _timer := 0.0
var _active := false

func start_phase(phase: int) -> void:
	RunData.current_phase = phase
	_timer = PHASE_DURATIONS[phase]
	_active = (phase < 3)
	emit_signal("phase_started", phase)
	if phase == 3:
		emit_signal("midnight_started")

func _process(delta: float) -> void:
	if not _active:
		return
	RunData.chaos = minf(RunData.chaos_max,
		RunData.chaos + RunData.CHAOS_RATES[RunData.current_phase] * delta)
	_timer -= delta
	emit_signal("phase_timer_tick", maxf(0.0, _timer))
	if _timer <= 0.0:
		_active = false
		start_phase(RunData.current_phase + 1)

func pause_timer() -> void:
	_active = false

func resume_timer() -> void:
	if RunData.current_phase < 3:
		_active = true
