extends Node2D

# ── Preloads ──────────────────────────────────────────────────────
const RoomScript   = preload("res://scripts/stage1/Room.gd")
const PlayerScript = preload("res://scripts/stage1/StagePlayer.gd")
const PhaseScript  = preload("res://scripts/stage1/PhaseManager.gd")
const HUDScript    = preload("res://scripts/stage1/StageHUD.gd")
const ScavengeScript = preload("res://scripts/stage1/ScavengeObject.gd")
const DroneScript    = preload("res://scripts/stage1/enemies/GamerDrone.gd")
const CanEnemyScript = preload("res://scripts/stage1/enemies/ThrownCanEnemy.gd")
const ChairScript    = preload("res://scripts/stage1/hazards/RollingChair.gd")
const SpeakerScript  = preload("res://scripts/stage1/hazards/SoundwaveSpeaker.gd")
const CableScript    = preload("res://scripts/stage1/hazards/CableTrip.gd")
const SparkScript    = preload("res://scripts/stage1/hazards/ElectricalSpark.gd")
const BossScript       = preload("res://scripts/stage1/LoudGamer.gd")
const DoorToggleScript = preload("res://scripts/stage1/DoorToggle.gd")

# ── Map layout ────────────────────────────────────────────────────
const WALL_T  := 20.0
const DOOR_GAP := 82.0

#   bedroom(500×420) | hallway(280×620) | living_room(600×420)
#                    |                  |
#                    | kitchen(380×340) |
#                    |                  |
#                    | bathroom(300×280)|
const ROOM_POS := {
	"bedroom":     Vector2(0,   0),
	"hallway":     Vector2(500, 0),
	"living_room": Vector2(780, 0),
	"kitchen":     Vector2(500, 420),
	"bathroom":    Vector2(500, 760),
}
const ROOM_SIZE := {
	"bedroom":     Vector2(500, 420),
	"hallway":     Vector2(280, 620),
	"living_room": Vector2(600, 420),
	"kitchen":     Vector2(380, 340),
	"bathroom":    Vector2(300, 280),
}
const FLOOR_COLOR := {
	"bedroom":     Color(0.17, 0.12, 0.10),
	"hallway":     Color(0.14, 0.13, 0.11),
	"living_room": Color(0.10, 0.08, 0.14),
	"kitchen":     Color(0.12, 0.14, 0.10),
	"bathroom":    Color(0.10, 0.12, 0.14),
}

# ── State ─────────────────────────────────────────────────────────
var _player: CharacterBody2D = null
var _phase_mgr: Node = null
var _hud: CanvasLayer = null
var _rooms: Dictionary = {}
var _boss: Node = null
var _run_over := false
var _current_room := "bedroom"
var _door_toggles: Array = []
var _room_door_toggles: Dictionary = {}  # room_id -> Array[DoorToggle]

# ── Entry ─────────────────────────────────────────────────────────

func _ready() -> void:
	RunData.reset()
	_build_stage()
	_spawn_player()
	_setup_phase_manager()
	_setup_hud()
	_setup_camera()
	_start_phase(0)
	_activate_room_encounter("bedroom")

func _process(_delta: float) -> void:
	if _run_over:
		return
	if RunData.hp <= 0.0:
		_run_failed()
	# Sync boss HP to HUD
	if _boss != null and is_instance_valid(_boss) and _hud != null:
		_hud.update_boss_hp(_boss._hp)

# ── Map building ──────────────────────────────────────────────────

func _build_stage() -> void:
	_build_bedroom()
	_build_hallway()
	_build_living_room()
	_build_kitchen()
	_build_bathroom()
	_build_door_toggles()

func _build_bedroom() -> void:
	var id := "bedroom"
	var W: float = ROOM_SIZE[id].x
	var H: float = ROOM_SIZE[id].y
	var room := _new_room(id)

	_add_floor(room, W, H, FLOOR_COLOR[id])
	_add_wall(room, Vector2(W/2, WALL_T/2), Vector2(W, WALL_T))            # top
	_add_wall(room, Vector2(W/2, H - WALL_T/2), Vector2(W, WALL_T))       # bottom
	_add_wall(room, Vector2(WALL_T/2, H/2), Vector2(WALL_T, H))           # left
	_add_vwall_with_door(room, W - WALL_T/2, H, H/2, DOOR_GAP)            # right (door at centre)

	var door_r := _add_door_area(room, Vector2(W - WALL_T/2, H/2), Vector2(18, DOOR_GAP))
	room.register_door("hallway", door_r)
	room.set_entrance("from_hallway", Vector2(W - WALL_T - 36, H/2))

	room.set_spawn_points([
		Vector2(100, 100), Vector2(300, 150),
		Vector2(120, 290), Vector2(360, 290)])
	_add_scavenge(room, Vector2(65, 55), 0)   # drawer
	_add_scavenge(room, Vector2(400, 355), 2) # pizza_box
	_add_room_label(room, "Bedroom", W, H)

func _build_hallway() -> void:
	var id := "hallway"
	var W: float = ROOM_SIZE[id].x
	var H: float = ROOM_SIZE[id].y
	var room := _new_room(id)

	_add_floor(room, W, H, FLOOR_COLOR[id])
	_add_wall(room, Vector2(W/2, WALL_T/2), Vector2(W, WALL_T))            # top
	_add_vwall_with_door(room, WALL_T/2, H, 210.0, DOOR_GAP)              # left  (→ bedroom)
	_add_vwall_with_door(room, W - WALL_T/2, H, 210.0, DOOR_GAP)          # right (→ living_room)
	_add_hwall_with_door(room, H - WALL_T/2, W, 140.0, DOOR_GAP)          # bottom (→ kitchen)

	var door_l := _add_door_area(room, Vector2(WALL_T/2, 210.0), Vector2(18, DOOR_GAP))
	room.register_door("bedroom", door_l)
	room.set_entrance("from_bedroom", Vector2(WALL_T + 36, 210.0))

	var door_r := _add_door_area(room, Vector2(W - WALL_T/2, 210.0), Vector2(18, DOOR_GAP))
	room.register_door("living_room", door_r)
	room.set_entrance("from_living_room", Vector2(W - WALL_T - 36, 210.0))

	var door_b := _add_door_area(room, Vector2(140.0, H - WALL_T/2), Vector2(DOOR_GAP, 18))
	room.register_door("kitchen", door_b)
	room.set_entrance("from_kitchen", Vector2(140.0, H - WALL_T - 36))

	room.set_spawn_points([
		Vector2(80, 200), Vector2(200, 180),
		Vector2(90, 420), Vector2(195, 520)])
	_add_scavenge(room, Vector2(105, 65), 4)  # cabinet
	_add_room_label(room, "Hallway", W, H)

func _build_living_room() -> void:
	var id := "living_room"
	var W: float = ROOM_SIZE[id].x
	var H: float = ROOM_SIZE[id].y
	var room := _new_room(id)

	_add_floor(room, W, H, FLOOR_COLOR[id])
	_add_wall(room, Vector2(W/2, WALL_T/2), Vector2(W, WALL_T))
	_add_wall(room, Vector2(W/2, H - WALL_T/2), Vector2(W, WALL_T))
	_add_wall(room, Vector2(W - WALL_T/2, H/2), Vector2(WALL_T, H))       # right solid
	_add_vwall_with_door(room, WALL_T/2, H, 210.0, DOOR_GAP)              # left (→ hallway)

	var door_l := _add_door_area(room, Vector2(WALL_T/2, 210.0), Vector2(18, DOOR_GAP))
	room.register_door("hallway", door_l)
	room.set_entrance("from_hallway", Vector2(WALL_T + 36, 210.0))

	# Boss arena atmosphere
	var arena_lbl := Label.new()
	arena_lbl.text = "THE GAMER DEN"
	arena_lbl.add_theme_font_size_override("font_size", 28)
	arena_lbl.add_theme_color_override("font_color", Color(0.6, 0.0, 0.6, 0.3))
	arena_lbl.position = Vector2(140, H/2 - 20)
	room.add_child(arena_lbl)

	# Monitor sprites (ColorRect placeholder screens)
	for i in range(3):
		var monitor := ColorRect.new()
		monitor.size = Vector2(60, 45)
		monitor.position = Vector2(120 + i * 140, 40)
		monitor.color = Color(0.05, 0.3, 0.05)
		room.add_child(monitor)
		var glow := ColorRect.new()
		glow.size = Vector2(60, 5)
		glow.position = Vector2(0, 40)
		glow.color = Color(0.0, 1.0, 0.2, 0.15)
		monitor.add_child(glow)

	room.set_spawn_points([
		Vector2(280, 120), Vector2(460, 150),
		Vector2(290, 300), Vector2(500, 280)])
	_add_room_label(room, "Living Room / Boss Arena", W, H)

func _build_kitchen() -> void:
	var id := "kitchen"
	var W: float = ROOM_SIZE[id].x
	var H: float = ROOM_SIZE[id].y
	var room := _new_room(id)

	_add_floor(room, W, H, FLOOR_COLOR[id])
	_add_wall(room, Vector2(WALL_T/2, H/2), Vector2(WALL_T, H))
	_add_wall(room, Vector2(W - WALL_T/2, H/2), Vector2(WALL_T, H))
	_add_hwall_with_door(room, WALL_T/2, W, 140.0, DOOR_GAP)             # top (→ hallway)
	_add_hwall_with_door(room, H - WALL_T/2, W, 190.0, DOOR_GAP)         # bottom (→ bathroom)

	var door_t := _add_door_area(room, Vector2(140.0, WALL_T/2), Vector2(DOOR_GAP, 18))
	room.register_door("hallway", door_t)
	room.set_entrance("from_hallway", Vector2(140.0, WALL_T + 36))

	var door_b := _add_door_area(room, Vector2(190.0, H - WALL_T/2), Vector2(DOOR_GAP, 18))
	room.register_door("bathroom", door_b)
	room.set_entrance("from_bathroom", Vector2(190.0, H - WALL_T - 36))

	room.set_spawn_points([
		Vector2(80, 110), Vector2(260, 140),
		Vector2(90, 250), Vector2(300, 270)])
	_add_scavenge(room, Vector2(80, 265), 1)   # fridge
	_add_scavenge(room, Vector2(295, 55), 3)   # delivery_box
	_add_room_label(room, "Kitchen", W, H)

func _build_bathroom() -> void:
	var id := "bathroom"
	var W: float = ROOM_SIZE[id].x
	var H: float = ROOM_SIZE[id].y
	var room := _new_room(id)

	_add_floor(room, W, H, FLOOR_COLOR[id])
	_add_wall(room, Vector2(WALL_T/2, H/2), Vector2(WALL_T, H))
	_add_wall(room, Vector2(W - WALL_T/2, H/2), Vector2(WALL_T, H))
	_add_wall(room, Vector2(W/2, H - WALL_T/2), Vector2(W, WALL_T))
	_add_hwall_with_door(room, WALL_T/2, W, 150.0, DOOR_GAP)             # top (→ kitchen)

	var door_t := _add_door_area(room, Vector2(150.0, WALL_T/2), Vector2(DOOR_GAP, 18))
	room.register_door("kitchen", door_t)
	room.set_entrance("from_kitchen", Vector2(150.0, WALL_T + 36))

	room.set_spawn_points([
		Vector2(80, 100), Vector2(210, 140),
		Vector2(85, 210), Vector2(215, 230)])
	_add_scavenge(room, Vector2(225, 65), 4)  # cabinet
	_add_room_label(room, "Bathroom", W, H)

func _build_door_toggles() -> void:
	# bedroom ↔ hallway: vertical door at the shared wall (world x=500, y=210)
	_add_door_toggle(["bedroom", "hallway"], Vector2(500, 210), Vector2(WALL_T, DOOR_GAP))
	# hallway ↔ kitchen: horizontal door at kitchen's top wall (world x=640, y=430)
	_add_door_toggle(["hallway", "kitchen"], Vector2(640, 430), Vector2(DOOR_GAP, WALL_T))
	# kitchen ↔ bathroom: horizontal door at the shared wall (world x=670, y=760)
	_add_door_toggle(["kitchen", "bathroom"], Vector2(670, 760), Vector2(DOOR_GAP, WALL_T))
	# living_room excluded — roommate's room door is never player-togglable

func _add_door_toggle(room_ids: Array, world_pos: Vector2, size: Vector2) -> void:
	var toggle := Node2D.new()
	toggle.set_script(DoorToggleScript)
	add_child(toggle)
	toggle.global_position = world_pos
	toggle.setup(size)
	_door_toggles.append(toggle)
	for rid in room_ids:
		if rid not in _room_door_toggles:
			_room_door_toggles[rid] = []
		(_room_door_toggles[rid] as Array).append(toggle)

# ── Node factory helpers ──────────────────────────────────────────

func _new_room(id: String) -> Node2D:
	var room := Node2D.new()
	room.set_script(RoomScript)
	room.name = "Room_" + id
	room.position = ROOM_POS[id]
	room.room_id = id
	add_child(room)
	room.player_entered_door.connect(_on_player_door)
	room.room_cleared.connect(_on_room_cleared)
	_rooms[id] = room
	return room

func _add_floor(room: Node2D, W: float, H: float, color: Color) -> void:
	var rect := ColorRect.new()
	rect.size = Vector2(W, H)
	rect.color = color
	room.add_child(rect)

func _add_wall(room: Node2D, center: Vector2, size: Vector2) -> void:
	var body := StaticBody2D.new()
	body.position = center
	body.collision_layer = 2
	body.collision_mask = 0
	room.add_child(body)
	var col := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = size
	col.shape = shape
	body.add_child(col)
	var vis := ColorRect.new()
	vis.size = size
	vis.position = -size / 2.0
	vis.color = Color(0.24, 0.20, 0.16)
	body.add_child(vis)

func _add_vwall_with_door(room: Node2D, x: float, H: float, door_y: float, gap: float) -> void:
	# Vertical wall at local x with a horizontal door gap centred at door_y
	var upper_h := door_y - gap / 2.0
	if upper_h > 1.0:
		_add_wall(room, Vector2(x, upper_h / 2.0), Vector2(WALL_T, upper_h))
	var lower_start := door_y + gap / 2.0
	var lower_h := H - lower_start
	if lower_h > 1.0:
		_add_wall(room, Vector2(x, lower_start + lower_h / 2.0), Vector2(WALL_T, lower_h))

func _add_hwall_with_door(room: Node2D, y: float, W: float, door_x: float, gap: float) -> void:
	# Horizontal wall at local y with a vertical door gap centred at door_x
	var left_w := door_x - gap / 2.0
	if left_w > 1.0:
		_add_wall(room, Vector2(left_w / 2.0, y), Vector2(left_w, WALL_T))
	var right_start := door_x + gap / 2.0
	var right_w := W - right_start
	if right_w > 1.0:
		_add_wall(room, Vector2(right_start + right_w / 2.0, y), Vector2(right_w, WALL_T))

func _add_door_area(room: Node2D, center: Vector2, size: Vector2) -> Area2D:
	var area := Area2D.new()
	area.position = center
	area.collision_layer = 0
	area.collision_mask = 1
	room.add_child(area)
	var col := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = size
	col.shape = shape
	area.add_child(col)
	# Subtle visual hint
	var vis := ColorRect.new()
	vis.size = size
	vis.position = -size / 2.0
	vis.color = Color(0.55, 0.85, 0.45, 0.25)
	area.add_child(vis)
	return area

func _add_scavenge(room: Node2D, local_pos: Vector2, type_int: int) -> void:
	var obj := Node2D.new()
	obj.set_script(ScavengeScript)
	room.add_child(obj)
	obj.position = local_pos
	obj.setup(type_int)
	room.register_scavenge(obj)

func _add_room_label(room: Node2D, text: String, W: float, _H: float) -> void:
	var lbl := Label.new()
	lbl.text = text
	lbl.add_theme_font_size_override("font_size", 11)
	lbl.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 0.4))
	lbl.position = Vector2(W/2 - 40, 26)
	room.add_child(lbl)

# ── Player ────────────────────────────────────────────────────────

func _spawn_player() -> void:
	_player = CharacterBody2D.new()
	_player.set_script(PlayerScript)
	add_child(_player)
	_player.global_position = ROOM_POS["bedroom"] + Vector2(120, 200)

func _setup_camera() -> void:
	var cam := Camera2D.new()
	cam.enabled = true
	cam.zoom = Vector2(1.15, 1.15)
	cam.limit_left   = -20
	cam.limit_top    = -20
	cam.limit_right  = 1400
	cam.limit_bottom = 1060
	_player.add_child(cam)

# ── Phase Manager ─────────────────────────────────────────────────

func _setup_phase_manager() -> void:
	_phase_mgr = Node.new()
	_phase_mgr.set_script(PhaseScript)
	add_child(_phase_mgr)
	_phase_mgr.phase_started.connect(_on_phase_started)
	_phase_mgr.phase_timer_tick.connect(_on_timer_tick)
	_phase_mgr.midnight_started.connect(_on_midnight_started)

func _start_phase(phase: int) -> void:
	_phase_mgr.start_phase(phase)

func _on_phase_started(phase: int) -> void:
	for id in _rooms:
		if id != "living_room":
			_rooms[id].reset_for_phase()
	for toggle in _door_toggles:
		(toggle as Node2D).clear_locks()
	if phase < 3 and _current_room != "living_room":
		_activate_room_encounter(_current_room)

func _on_timer_tick(time_left: float) -> void:
	if _hud:
		_hud.update_phase_timer(time_left)

func _on_midnight_started() -> void:
	for id in _rooms:
		if id != "living_room":
			_rooms[id].force_clear()
			if id in _room_door_toggles:
				for toggle in _room_door_toggles[id]:
					(toggle as Node2D).unlock_by(id)
	var lr: Node2D = _rooms["living_room"]
	_player.global_position = lr.global_position + Vector2(80, 210)
	_current_room = "living_room"
	_boss = CharacterBody2D.new()
	_boss.set_script(BossScript)
	add_child(_boss)
	_boss.global_position = lr.global_position + Vector2(400, 200)
	_boss.boss_defeated.connect(_day_cleared)
	_rooms["living_room"].activate([_boss])
	if _hud:
		_hud.show_boss_bar(300.0)

# ── Room signals ──────────────────────────────────────────────────

func _on_room_cleared(room_id: String) -> void:
	if room_id in _room_door_toggles:
		for toggle in _room_door_toggles[room_id]:
			(toggle as Node2D).unlock_by(room_id)

func _on_player_door(dest_id: String) -> void:
	if dest_id == _current_room or dest_id not in _rooms:
		return
	_current_room = dest_id
	_activate_room_encounter(dest_id)

# ── Encounter spawning ────────────────────────────────────────────

func _activate_room_encounter(room_id: String) -> void:
	if room_id == "living_room":
		return  # boss only, triggered by midnight
	var room = _rooms[room_id]
	if room.state != 0:  # not IDLE
		return
	var config := _encounter_config(RunData.current_phase)
	var enemies: Array = _spawn_enemies(room, config)
	_spawn_hazards(room_id, room, config)
	room.activate(enemies)
	if room_id in _room_door_toggles:
		for toggle in _room_door_toggles[room_id]:
			(toggle as Node2D).lock_by(room_id)

func _spawn_enemies(room, config: Dictionary) -> Array:
	var result: Array = []
	for _i in range(config.drones):
		var e := CharacterBody2D.new()
		e.set_script(DroneScript)
		add_child(e)
		e.global_position = room.get_random_spawn()
		result.append(e)
	for _i in range(config.cans):
		var e := CharacterBody2D.new()
		e.set_script(CanEnemyScript)
		add_child(e)
		e.global_position = room.get_random_spawn()
		result.append(e)
	return result

func _spawn_hazards(room_id: String, room, config: Dictionary) -> void:
	var W: float = ROOM_SIZE[room_id].x
	var H: float = ROOM_SIZE[room_id].y
	var room_rect := Rect2(ROOM_POS[room_id] as Vector2, ROOM_SIZE[room_id] as Vector2)

	for type_str in config.hazards:
		match type_str:
			"chair":
				var h := CharacterBody2D.new()
				h.set_script(ChairScript)
				add_child(h)
				h.global_position = room.get_random_spawn()
				h.setup(room_rect)
			"speaker":
				var h := Node2D.new()
				h.set_script(SpeakerScript)
				add_child(h)
				h.global_position = ROOM_POS[room_id] + Vector2(
					randf_range(80, W - 80), randf_range(80, H - 80))
			"cable":
				var h := Node2D.new()
				h.set_script(CableScript)
				add_child(h)
				h.global_position = ROOM_POS[room_id] + Vector2(
					randf_range(60, W - 60), randf_range(80, H - 80))
				h.setup(Vector2(randf_range(60, 110), 20))
			"spark":
				var h := Node2D.new()
				h.set_script(SparkScript)
				add_child(h)
				h.global_position = ROOM_POS[room_id] + Vector2(
					randf_range(60, W - 60), randf_range(60, H - 60))

# Day 1 config. To scale Day 2/3, increase counts and add hazard types here.
func _encounter_config(phase: int) -> Dictionary:
	match phase:
		0:  return { "drones": 2, "cans": 0, "hazards": ["cable"] }
		1:  return { "drones": 3, "cans": 1, "hazards": ["chair", "cable"] }
		2:  return { "drones": 4, "cans": 1, "hazards": ["chair", "speaker"] }
	return   { "drones": 0, "cans": 0, "hazards": [] }

# ── HUD ───────────────────────────────────────────────────────────

func _setup_hud() -> void:
	_hud = CanvasLayer.new()
	_hud.set_script(HUDScript)
	_hud.layer = 10
	add_child(_hud)

# ── Win / Lose ────────────────────────────────────────────────────

func _day_cleared() -> void:
	if _run_over:
		return
	_run_over = true
	_phase_mgr.pause_timer()
	if _hud:
		_hud.show_overlay("Day 1 Cleared!\n+£%d earned\n(Day 2 coming soon)" % RunData.rent, Color(0.2, 1.0, 0.4))

func _run_failed() -> void:
	if _run_over:
		return
	_run_over = true
	_phase_mgr.pause_timer()
	if _hud:
		_hud.show_overlay("Run Failed\n£%d kept" % RunData.rent, Color(1.0, 0.25, 0.25))
	get_tree().create_timer(3.0).timeout.connect(_return_to_lobby)

func _return_to_lobby() -> void:
	get_tree().change_scene_to_file("res://scenes/lobby/Lobby.tscn")
