extends BaseEnemy
# Weak minion summoned by The Messy Slob in phase 2+.

func _on_ready_override() -> void:
	max_health = 20
	health = 20
	move_speed = 85.0
	damage = 8
	attack_range = 25.0
	attack_cooldown = 2.0
	rent_reward = 3
	health_bar.max_value = 20
	health_bar.value = 20
