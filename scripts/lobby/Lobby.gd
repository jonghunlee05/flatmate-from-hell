extends Node2D

const INTERACT_RADIUS = 100.0

var rent: int = 0
var near_interactable: String = ""

# Center positions of each interactable
const INTERACTABLES := {
	"Character Wardrobe": Vector2(550, 60),
	"Item Shelf": Vector2(112, 330),
	"Upgrade Desk": Vector2(990, 330),
	"Exit Door": Vector2(1010, 646),
}

func _ready() -> void:
	$HUD/BtnMenu.pressed.connect(_on_menu_pressed)
	$HUD/PauseMenu/VBox/BtnResume.pressed.connect(_close_menu)
	$HUD/PauseMenu/VBox/BtnOptions.pressed.connect(_on_options_pressed)
	$HUD/PauseMenu/VBox/BtnQuit.pressed.connect(_on_quit_pressed)
	$HUD/SaveConfirm/VBox/HBox/BtnYes.pressed.connect(_on_save_yes)
	$HUD/SaveConfirm/VBox/HBox/BtnNo.pressed.connect(_on_save_no)
	_update_rent()

func _process(_delta: float) -> void:
	_check_proximity()
	if Input.is_physical_key_pressed(KEY_E) and near_interactable != "":
		_interact(near_interactable)

func _check_proximity() -> void:
	var player_pos: Vector2 = $Player.position
	near_interactable = ""
	for name in INTERACTABLES:
		if player_pos.distance_to(INTERACTABLES[name]) < INTERACT_RADIUS:
			near_interactable = name
			break
	$HUD/InteractPrompt.visible = near_interactable != ""

func _interact(target: String) -> void:
	match target:
		"Character Wardrobe":
			pass # TODO: open character select
		"Item Shelf":
			pass # TODO: open item/loadout select
		"Upgrade Desk":
			pass # TODO: open upgrade shop
		"Exit Door":
			pass # TODO: confirm + load Stage 1

func _update_rent() -> void:
	$HUD/RentLabel.text = "Rent: £%d" % rent

func _on_menu_pressed() -> void:
	$HUD/PauseMenu.visible = true
	get_tree().paused = true

func _close_menu() -> void:
	$HUD/PauseMenu.visible = false
	get_tree().paused = false

func _on_options_pressed() -> void:
	pass # TODO: options screen

func _on_quit_pressed() -> void:
	$HUD/PauseMenu.visible = false
	$HUD/SaveConfirm.visible = true

func _on_save_yes() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/ui/MainScreen.tscn")

func _on_save_no() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/ui/MainScreen.tscn")
