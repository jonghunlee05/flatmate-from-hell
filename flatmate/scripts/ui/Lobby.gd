extends Node2D

@onready var run_btn: Button      = $UI/RunButton
@onready var rent_label: Label    = $UI/RentLabel
@onready var stage_label: Label   = $UI/StageLabel
@onready var wardrobe_btn: Button = $UI/Vendors/WardrobeButton
@onready var result_panel: PanelContainer = $UI/ResultPanel
@onready var result_label: Label  = $UI/ResultPanel/Label

func _ready() -> void:
	run_btn.pressed.connect(_on_run)
	wardrobe_btn.pressed.connect(_on_wardrobe)
	_refresh_ui()
	_show_run_result()

func _refresh_ui() -> void:
	rent_label.text = "Rent: £%d" % GameManager.total_rent
	stage_label.text = "Stage %d — Day %d" % [GameManager.current_stage, GameManager.current_day]

func _show_run_result() -> void:
	# GameManager.end_run() already ran; result_panel shows outcome if set
	result_panel.hide()

func _on_run() -> void:
	GameManager.start_run()

func _on_wardrobe() -> void:
	# Upgrade shop — placeholder for now
	pass
