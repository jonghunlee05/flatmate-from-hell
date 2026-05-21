extends Node2D

signal room_cleared(room_id: String)
signal player_entered_door(destination_id: String)

enum State { IDLE, ACTIVE, CLEARED }

@export var room_id: String = ""

var state: State = State.IDLE
var _enemies: Array = []
var _doors: Dictionary = {}        # dest_id -> Area2D (always monitoring)
var _door_blockers: Dictionary = {}  # dest_id -> StaticBody2D
var _door_blocker_shapes: Dictionary = {}  # dest_id -> shape size Vector2
var _scavenge: Array = []
var _spawn_points: Array = []
var _entrances: Dictionary = {}    # from_room_id -> local Vector2

# ------------------------------------------------------------------
# Setup helpers (called by Game.gd during map build)
# ------------------------------------------------------------------

func set_spawn_points(pts: Array) -> void:
	_spawn_points = pts

func set_entrance(from_id: String, local_pos: Vector2) -> void:
	_entrances[from_id] = local_pos

func get_entrance(from_id: String) -> Vector2:
	if _entrances.has(from_id):
		return global_position + _entrances[from_id]
	return global_position + Vector2(80, 80)

func register_door(dest_id: String, door_area: Area2D) -> void:
	_doors[dest_id] = door_area
	# Store the shape size for building blockers later
	if door_area.get_child_count() > 0:
		var col := door_area.get_child(0) as CollisionShape2D
		if col and col.shape is RectangleShape2D:
			_door_blocker_shapes[dest_id] = (col.shape as RectangleShape2D).size
	door_area.body_entered.connect(_on_door_entered.bind(dest_id))

func register_scavenge(obj: Node2D) -> void:
	_scavenge.append(obj)

func get_random_spawn() -> Vector2:
	if _spawn_points.is_empty():
		return global_position + Vector2(120, 120)
	return global_position + (_spawn_points[randi() % _spawn_points.size()] as Vector2)

# ------------------------------------------------------------------
# State machine
# ------------------------------------------------------------------

func activate(enemies: Array) -> void:
	if state != State.IDLE:
		return
	state = State.ACTIVE
	_block_doors()
	for e in enemies:
		_register_enemy(e)
	if enemies.is_empty():
		_do_clear()

func force_clear() -> void:
	_kill_enemies()
	state = State.CLEARED
	_unblock_doors()
	emit_signal("room_cleared", room_id)

func reset_for_phase() -> void:
	_kill_enemies()
	state = State.IDLE
	_unblock_doors()

# ------------------------------------------------------------------
# Internal
# ------------------------------------------------------------------

func _kill_enemies() -> void:
	for e in _enemies:
		if is_instance_valid(e):
			e.queue_free()
	_enemies.clear()

func _register_enemy(e: Node) -> void:
	_enemies.append(e)
	e.tree_exited.connect(_on_enemy_removed)

func _on_enemy_removed() -> void:
	_enemies = _enemies.filter(func(e): return is_instance_valid(e))
	if _enemies.is_empty() and state == State.ACTIVE:
		_do_clear()

func _do_clear() -> void:
	state = State.CLEARED
	_unblock_doors()
	_drop_rent_reward()
	emit_signal("room_cleared", room_id)

func _drop_rent_reward() -> void:
	var base := 6 + RunData.current_phase * 5
	RunData.add_rent(base + randi_range(0, 4))

func _block_doors() -> void:
	for dest_id in _doors:
		if _door_blockers.has(dest_id):
			continue
		var door_area := _doors[dest_id] as Area2D
		var blocker := StaticBody2D.new()
		blocker.position = door_area.position
		blocker.collision_layer = 2
		blocker.collision_mask = 0
		add_child(blocker)
		var col := CollisionShape2D.new()
		var shape := RectangleShape2D.new()
		shape.size = _door_blocker_shapes.get(dest_id, Vector2(20, 80))
		col.shape = shape
		blocker.add_child(col)
		var vis := ColorRect.new()
		vis.size = shape.size
		vis.position = -shape.size / 2.0
		vis.color = Color(0.35, 0.15, 0.1, 0.8)
		blocker.add_child(vis)
		_door_blockers[dest_id] = blocker

func _unblock_doors() -> void:
	for dest_id in _door_blockers:
		if is_instance_valid(_door_blockers[dest_id]):
			_door_blockers[dest_id].queue_free()
	_door_blockers.clear()

func _on_door_entered(body: Node, dest_id: String) -> void:
	if body.is_in_group("player"):
		emit_signal("player_entered_door", dest_id)
