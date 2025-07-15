# Day 1 Prototype - Flatmate From Hell

## 🎮 Game Overview
This is a working Day 1 prototype of "Flatmate From Hell" with a room-based apartment system where each room is its own Phaser scene.

## 🏠 Room Layout
```
+------------------+------------------+
|   Your Bedroom   | Flatmate Bedroom |
+--------+---------+--------+--------+
         |                  |
+--------+------------------+--------+
|            Living Room              |
+----+----------------+---------------+
     |                |
+----+----+     +-----+-----+--------+
| Kitchen |     |  Bathroom | Laundry|
+---------+     +-----------+--------+
```

## 🎯 Gameplay Features

### Player Movement
- **WASD** or **Arrow Keys** to move
- Player spawns in "Your Bedroom"
- Can navigate between rooms using doors

### Room Navigation
- Walk to a door and press **E** to enter
- Each room is a separate scene with unique furniture
- Player position is preserved between room transitions

### Cleaning Mechanics
- **Hold SPACE BAR** near a mess for 2 seconds to clean it
- Messes spawn randomly in each room (1-2 per room)
- Progress bar shows cleaning completion

### Parameter System
- **Mood**: Decreases based on room cleanliness
- **Cleanliness**: Affected by mess presence/cleaning
- **Health**: Only affected during Night phase (not implemented)
- **Flatmate Rage**: Not implemented yet

## 🏗️ Technical Implementation

### Scene Structure
- `BaseRoomScene`: Abstract base class with common functionality
- Individual room scenes extend BaseRoomScene:
  - `PlayerBedroomScene`
  - `LivingRoomScene` 
  - `FlatmateBedroomScene`
  - `KitchenScene`
  - `BathroomScene`
  - `LaundryScene`

### Key Components
- **Player**: Green square sprite with movement controls
- **Mess**: Brown circle sprites with cleaning progress
- **Doors**: Brown rectangles with labels for room transitions
- **UI**: Parameter bars in top-right corner

### Game State Management
- Game state stored in Phaser registry
- Parameters persist between room transitions
- Player position saved when moving between rooms

## 🎮 Controls
- **WASD/Arrow Keys**: Move player
- **SPACE**: Hold to clean messes
- **E**: Interact with doors
- **Mouse**: Click doors directly

## 🚀 How to Run
1. Start the development server: `npm run dev`
2. Select a flatmate from the selection screen
3. Game starts in Your Bedroom
4. Navigate through rooms and clean messes

## 📋 Current Limitations
- Only Morning phase implemented
- No flatmate AI or night events
- Basic placeholder graphics
- No sound effects or music
- Limited room interactions

## 🔄 Next Steps
- Implement Afternoon, Evening, and Night phases
- Add flatmate AI and interactions
- Implement broken items and repair mechanics
- Add more complex room interactions
- Improve graphics and add sound 