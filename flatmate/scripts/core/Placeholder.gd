extends Node
# Builds SpriteFrames from real assets where available, coloured rects otherwise.

# ── Atlas builder ─────────────────────────────────────────────────────────────
func _atlas_frames(tex: Texture2D, anims: Dictionary, fps: float = 8.0) -> SpriteFrames:
	var sf := SpriteFrames.new()
	sf.remove_animation("default")
	for anim in anims:
		sf.add_animation(anim)
		sf.set_animation_speed(anim, fps)
		sf.set_animation_loop(anim, anim != "death")
		for r in anims[anim]:
			var at := AtlasTexture.new()
			at.atlas = tex
			at.region = Rect2(r[0], r[1], r[2], r[3])
			sf.add_frame(anim, at)
	return sf

# ── Solid-colour fallback (items not yet provided) ────────────────────────────
func make_frames(color: Color, w: int, h: int, anims: Array[String]) -> SpriteFrames:
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	img.fill(color)
	var tex := ImageTexture.create_from_image(img)
	var sf := SpriteFrames.new()
	sf.remove_animation("default")
	for anim in anims:
		sf.add_animation(anim)
		sf.add_frame(anim, tex)
		sf.set_animation_loop(anim, true)
		sf.set_animation_speed(anim, 4.0)
	return sf

# ── Player ────────────────────────────────────────────────────────────────────
func apply_player(sprite: AnimatedSprite2D) -> void:
	var tex: Texture2D = load("res://assets/sprites/player/player.png")
	if tex == null:
		_fallback(sprite, Color(0.2, 0.8, 0.3), 16, 24,
			["idle","walk_down","walk_up","walk_side","attack","dodge"])
		return
	sprite.sprite_frames = _atlas_frames(tex, {
		"idle":      [[0,0,256,256],   [256,0,256,256]],
		"attack":    [[768,0,256,256], [1024,0,256,256], [1280,0,256,256]],
		"walk_down": [[0,256,256,256], [256,256,256,256], [512,256,256,256], [768,256,256,256]],
		"dodge":     [[1024,256,256,256],[1024,256,256,256]],
		"walk_up":   [[0,512,256,256], [256,512,256,256], [512,512,256,256], [768,512,256,256]],
		"walk_side": [[0,768,256,256], [256,768,256,256], [512,768,256,256], [768,768,256,256]],
	}, 10.0)
	sprite.play("idle")

# ── Slob boss ─────────────────────────────────────────────────────────────────
func apply_slob(sprite: AnimatedSprite2D) -> void:
	var tex: Texture2D = load("res://assets/sprites/enemies/slob.png")
	if tex == null:
		_fallback(sprite, Color(0.9, 0.3, 0.2), 32, 40, ["idle","walk","attack","death"])
		return
	sprite.sprite_frames = _atlas_frames(tex, {
		"idle":   [[40,66,169,136],  [218,66,168,136]],
		"walk":   [[39,264,169,145], [241,264,166,145], [452,264,169,145], [653,264,158,145]],
		"attack": [[42,477,189,149], [286,477,179,149], [513,477,200,149]],
		"death":  [[39,704,218,211], [298,704,240,211], [586,704,239,211], [866,704,234,211]],
	}, 8.0)
	sprite.play("idle")

# ── Minion ────────────────────────────────────────────────────────────────────
func apply_minion(sprite: AnimatedSprite2D) -> void:
	var tex: Texture2D = load("res://assets/sprites/enemies/minion_clutter.png")
	if tex == null:
		_fallback(sprite, Color(0.9, 0.55, 0.1), 16, 16, ["idle","walk","attack","death"])
		return
	sprite.sprite_frames = _atlas_frames(tex, {
		"idle":   [[65,82,128,119],  [270,82,128,119]],
		"walk":   [[61,286,138,124], [277,286,146,124], [500,286,143,124]],
		"attack": [[51,497,189,123], [304,497,276,123]],
		"death":  [[60,714,206,125], [307,714,230,125], [599,714,216,125]],
	}, 8.0)
	sprite.play("idle")

# ── Dish projectile ───────────────────────────────────────────────────────────
func apply_projectile(sprite: AnimatedSprite2D) -> void:
	var tex: Texture2D = load("res://assets/sprites/projectiles/dish.png")
	if tex == null:
		_fallback(sprite, Color(0.9, 0.9, 0.9), 8, 8, ["spin"])
		return
	sprite.sprite_frames = _atlas_frames(tex, {
		"spin": [[261,398,166,120],[515,398,164,120],[765,398,166,120],[1013,398,167,120]],
	}, 12.0)
	sprite.play("spin")

# ── Internal fallback ─────────────────────────────────────────────────────────
func _fallback(sprite: AnimatedSprite2D, color: Color, w: int, h: int, anims: Array[String]) -> void:
	var anims_typed: Array[String] = []
	anims_typed.assign(anims)
	sprite.sprite_frames = make_frames(color, w, h, anims_typed)
	sprite.play(anims[0])
