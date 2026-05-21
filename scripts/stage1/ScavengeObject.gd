extends Node2D

signal scavenged()

enum Type { DRAWER, FRIDGE, PIZZA_BOX, DELIVERY_BOX, CABINET }

var object_type: Type = Type.DRAWER
var _used := false
var _prompt: Label
var _sprite: ColorRect

const COLORS := {
	Type.DRAWER:       Color(0.55, 0.4, 0.25),
	Type.FRIDGE:       Color(0.85, 0.85, 0.9),
	Type.PIZZA_BOX:    Color(0.85, 0.5, 0.15),
	Type.DELIVERY_BOX: Color(0.7, 0.55, 0.3),
	Type.CABINET:      Color(0.45, 0.35, 0.2),
}

const LABELS := {
	Type.DRAWER:       "Drawer",
	Type.FRIDGE:       "Fridge",
	Type.PIZZA_BOX:    "Pizza Box",
	Type.DELIVERY_BOX: "Delivery Box",
	Type.CABINET:      "Cabinet",
}

func setup(t: int) -> void:
	object_type = t
	add_to_group("interactable")

	_sprite = ColorRect.new()
	_sprite.size = Vector2(36, 36)
	_sprite.position = Vector2(-18, -18)
	_sprite.color = COLORS[t]
	add_child(_sprite)

	var lbl := Label.new()
	lbl.text = LABELS[t]
	lbl.add_theme_font_size_override("font_size", 10)
	lbl.position = Vector2(-20, -32)
	lbl.add_theme_color_override("font_color", Color(0.9, 0.9, 0.7))
	add_child(lbl)

	_prompt = Label.new()
	_prompt.text = "[E]"
	_prompt.add_theme_font_size_override("font_size", 12)
	_prompt.position = Vector2(-10, -46)
	_prompt.add_theme_color_override("font_color", Color(1.0, 0.9, 0.2))
	_prompt.visible = false
	add_child(_prompt)

func show_prompt(show: bool) -> void:
	if _prompt:
		_prompt.visible = show and not _used
	if _used and _sprite:
		_sprite.color = _sprite.color.darkened(0.4)

func interact() -> void:
	if _used:
		return
	_used = true
	if _prompt:
		_prompt.visible = false
	_give_reward()
	emit_signal("scavenged")

func _give_reward() -> void:
	var roll := randf()
	match object_type:
		Type.FRIDGE:
			if roll < 0.5:
				RunData.restore_hp(1.5)
			else:
				RunData.add_rent(randi_range(2, 5))
		Type.PIZZA_BOX, Type.DELIVERY_BOX:
			RunData.add_rent(randi_range(2, 6))
		Type.DRAWER, Type.CABINET:
			if roll < 0.35:
				RunData.restore_mana(1.0)
			elif roll < 0.65:
				RunData.add_rent(randi_range(1, 4))
			else:
				RunData.restore_hp(0.8)
