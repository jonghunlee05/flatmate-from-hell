extends Node

# Single source of truth for all character sprite + skill data.
# Both lobby Player.gd and StagePlayer.gd call setup_sprite() — if it works
# in lobby, it works in stage, guaranteed.

const CHARACTER_PATHS := {
	"introvert":   "res://assets/sprites/player/introvert.png",
	"petty":       "res://assets/sprites/player/petty_one.png",
	"peacekeeper": "res://assets/sprites/player/peace_keeper.png",
	"goblin":      "res://assets/sprites/player/chaos_goblin.png",
}

const CHARACTER_SHEET_DATA := {
	"introvert": {
		"frame_w": 349, "frame_h": 259, "scale": 0.40,
		"anims": [["walk", 6.0, 0, 6], ["idle", 4.0, 259, 4], ["skill", 6.0, 518, 5], ["hit", 16.0, 777, 2]]
	},
	"goblin": {
		"frame_w": 348, "frame_h": 256, "scale": 0.40,
		"anims": [["walk", 6.0, 0, 6], ["idle", 2.0, 256, 4], ["skill", 6.0, 512, 5], ["hit", 16.0, 768, 3]]
	},
	"peacekeeper": {
		"frame_w": 403, "frame_h": 291, "scale": 0.45,
		"anims": [["walk", 6.0, 0, 6], ["idle", 4.0, 291, 4], ["skill", 5.0, 582, 5], ["hit", 16.0, 873, 3]]
	},
	"petty": {
		"frame_w": 351, "frame_h": 296, "scale": 0.45,
		"anims": [["walk", 6.0, 0, 6], ["idle", 2.0, 296, 4], ["skill", 3.0, 592, 5], ["hit", 16.0, 888, 3]]
	},
}

const SKILL_COOLDOWNS := {
	"introvert":   1.0,
	"goblin":      1.0,
	"peacekeeper": 8.0,
	"petty":       1.0,
}

# Reads RunData.active_character, builds SpriteFrames from the sheet, assigns to sprite.
# Call this whenever the character changes or the sprite node is first created.
func setup_sprite(sprite: AnimatedSprite2D) -> void:
	var char_id : String = RunData.active_character
	if not CHARACTER_PATHS.has(char_id):
		char_id = "introvert"

	var texture : Texture2D   = load(CHARACTER_PATHS[char_id])
	var data    : Dictionary  = CHARACTER_SHEET_DATA[char_id]
	var fw      : int         = int(data["frame_w"])
	var fh      : int         = int(data["frame_h"])
	var s       : float       = float(data["scale"])
	var frames  : SpriteFrames = SpriteFrames.new()
	var one_shot : Array       = ["skill", "hit"]

	for anim in data["anims"] as Array:
		var anim_name : String = str(anim[0])
		var fps       : float  = float(anim[1])
		var y_start   : int    = int(anim[2])
		var count     : int    = int(anim[3])
		frames.add_animation(anim_name)
		frames.set_animation_speed(anim_name, fps)
		frames.set_animation_loop(anim_name, not (anim_name in one_shot))
		for col in range(count):
			var atlas := AtlasTexture.new()
			atlas.atlas  = texture
			atlas.region = Rect2(col * fw, y_start, fw, fh)
			frames.add_frame(anim_name, atlas)

	sprite.sprite_frames = frames
	sprite.scale         = Vector2(s, s)
	sprite.play("idle")

func get_skill_cooldown(char_id: String) -> float:
	if SKILL_COOLDOWNS.has(char_id):
		return float(SKILL_COOLDOWNS[char_id])
	return 1.0
