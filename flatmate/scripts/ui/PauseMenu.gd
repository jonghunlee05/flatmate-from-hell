extends CanvasLayer

@onready var panel: PanelContainer  = $Panel
@onready var resume_btn: Button     = $Panel/VBox/ResumeButton
@onready var save_leave_btn: Button = $Panel/VBox/SaveLeaveButton
@onready var rent_label: Label      = $Panel/VBox/RentLabel

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	resume_btn.pressed.connect(_on_resume)
	save_leave_btn.pressed.connect(_on_save_leave)
	hide()

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause_game"):
		get_viewport().set_input_as_handled()
		if visible:
			_on_resume()
		else:
			_open()

func _open() -> void:
	rent_label.text = "Rent earned: £%d" % GameManager.run_rent
	show()
	get_tree().paused = true

func _on_resume() -> void:
	hide()
	get_tree().paused = false

func _on_save_leave() -> void:
	GameManager.give_up_run()
