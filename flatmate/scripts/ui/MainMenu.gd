extends Control

@onready var play_btn: Button         = $CenterContainer/PlayButton
@onready var achievements_btn: Button = $CenterContainer/AchievementsButton
@onready var options_btn: Button      = $CenterContainer/OptionsButton
@onready var quit_btn: Button         = $CenterContainer/QuitButton
@onready var version_label: Label    = $VersionLabel

func _ready() -> void:
	version_label.text = "v0.1 — vertical slice"
	play_btn.pressed.connect(_on_play)
	quit_btn.pressed.connect(_on_quit)
	options_btn.pressed.connect(_on_options)

func _on_play() -> void:
	get_tree().change_scene_to_file(GameManager.SCENE_LOBBY)

func _on_quit() -> void:
	get_tree().quit()

func _on_options() -> void:
	pass  # placeholder — options screen not in vertical slice scope
