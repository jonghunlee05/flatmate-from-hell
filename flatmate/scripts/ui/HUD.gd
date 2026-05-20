extends CanvasLayer

@onready var composure_bar: ProgressBar  = $MarginContainer/VBox/ComposureBar
@onready var composure_label: Label      = $MarginContainer/VBox/ComposureBar/ComposureLabel
@onready var phase_label: Label          = $TopBar/PhaseLabel
@onready var timer_label: Label          = $TopBar/TimerLabel
@onready var rent_label: Label           = $TopBar/RentLabel
@onready var synergy_popup: PanelContainer = $SynergyPopup
@onready var synergy_name: Label         = $SynergyPopup/VBox/SynergyName
@onready var synergy_desc: Label         = $SynergyPopup/VBox/SynergyDesc
@onready var weapon_icon: TextureRect    = $BottomBar/WeaponSlot/Icon
@onready var active_icon: TextureRect    = $BottomBar/ActiveSlot/Icon

func _ready() -> void:
	RunData.composure_changed.connect(_on_composure_changed)
	RunData.synergy_triggered.connect(_on_synergy_triggered)
	GameManager.rent_changed.connect(_on_rent_changed)
	_on_composure_changed(RunData.composure, RunData.max_composure)
	synergy_popup.hide()

func set_phase(phase_name: String) -> void:
	phase_label.text = phase_name.to_upper()

func set_timer(remaining: float) -> void:
	if remaining < 0:
		timer_label.text = "∞"
		return
	var mins := int(remaining) / 60
	var secs := int(remaining) % 60
	timer_label.text = "%d:%02d" % [mins, secs]

func _on_composure_changed(current: int, maximum: int) -> void:
	composure_bar.max_value = maximum
	composure_bar.value = current
	composure_label.text = "%d / %d" % [current, maximum]
	# Colour shift: green → yellow → red
	var pct := float(current) / float(maximum)
	composure_bar.modulate = Color(1.0, pct, pct * 0.3)

func _on_rent_changed(new_total: int) -> void:
	rent_label.text = "£%d" % new_total

func _on_synergy_triggered(synergy_id: String) -> void:
	var db := ItemManager.synergy_db
	for s in db:
		if s["id"] == synergy_id:
			synergy_name.text = s["name"]
			synergy_desc.text = s["desc"]
			break
	synergy_popup.show()
	await get_tree().create_timer(3.0).timeout
	synergy_popup.hide()
