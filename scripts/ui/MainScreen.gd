extends Control

func _ready() -> void:
	$VBox/BtnPlay.pressed.connect(_on_play_pressed)
	$VBox/BtnAchievements.pressed.connect(_on_achievements_pressed)
	$VBox/BtnOptions.pressed.connect(_on_options_pressed)
	$VBox/BtnCredits.pressed.connect(_on_credits_pressed)
	$VBox/BtnQuit.pressed.connect(_on_quit_pressed)
	_setup_logo()

func _on_play_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/lobby/Lobby.tscn")

func _on_achievements_pressed() -> void:
	pass # TODO: achievements screen

func _on_options_pressed() -> void:
	pass # TODO: options screen

func _on_credits_pressed() -> void:
	pass # TODO: credits screen

func _on_quit_pressed() -> void:
	get_tree().quit()

func _setup_logo() -> void:
	# Hide title text if a logo image is loaded, show it as fallback
	var logo: TextureRect = $VBox/Logo
	if logo.texture == null:
		logo.visible = false
		$VBox/Title.visible = true
	else:
		$VBox/Title.visible = false
		logo.visible = true
