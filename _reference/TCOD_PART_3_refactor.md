# TCOD Tutorial Part 3 - Notes

## Overview
Part 3 introduces procedural dungeon generation with rooms and corridors. It creates a basic dungeon layout with rectangular rooms connected by L-shaped tunnels.

## Key Objects and Systems

### Core Components:
1. **RectangularRoom Class**
   - Represents a rectangular room in the dungeon
   - Tracks x1, y1, x2, y2 coordinates
   - Provides center property for room center
   - Provides inner property for carving out room tiles
   - Has intersection check for room overlap prevention

2. **Procedural Generation (procgen.py)**
   - `generate_dungeon()` function creates the dungeon
   - Fills map with walls, then carves out rooms and tunnels
   - Uses RNG from engine for reproducible generation
   - Places player at entrance coordinates

3. **Tunnel Generation**
   - `tunnel_between()` creates L-shaped tunnels
   - Uses Bresenham line algorithm for path calculation
   - Randomly chooses horizontal-first or vertical-first path

4. **GameMap Updates**
   - Now has `enter_xy` property for player spawn point
   - Starts filled with walls instead of floors

### TCOD 19 Issues Found:
1. Same key constant issues as previous parts
2. No new tcod-specific issues in the procedural generation code

### Code Architecture:
- Engine now has an `rng` attribute (random.Random instance)
- Dungeon generation is separated into its own module (procgen.py)
- Rooms are generated and checked for overlap before placement
- Tunnels connect room centers sequentially

### Gameplay Goals:
- Generate random dungeon layouts
- Create rectangular rooms of varying sizes
- Connect rooms with corridors
- Ensure rooms don't overlap
- Place player at appropriate starting position

## Part 6 Refactoring Requirements

### Procedural Generation Updates:
1. **Remove RNG from Engine**
   - Use Python's global random module instead
   - Remove all engine.rng references

2. **Entity Placement Changes**
   - Use entity factories pattern
   - Call `entity.spawn()` or `entity.place()` instead of direct creation
   - Check entity overlap with list comprehension

3. **Dungeon Generation**
   - Pass player to generate_dungeon 
   - GameMap constructor takes entities parameter
   - Use `player.place()` to position player at entrance

4. **Tunnel Generation**
   - Remove engine parameter from tunnel_between
   - Use global random.random() instead

### Implementation for Part 3:
```python
# game/procgen.py
def place_entities(room: RectangularRoom, dungeon: GameMap, maximum_monsters: int) -> None:
    number_of_monsters = random.randint(0, maximum_monsters)
    
    for _ in range(number_of_monsters):
        x = random.randint(room.x1 + 1, room.x2 - 1)
        y = random.randint(room.y1 + 1, room.y2 - 1)
        
        if not any(entity.x == x and entity.y == y for entity in dungeon.entities):
            if random.random() < 0.8:
                game.entity_factories.orc.spawn(dungeon, x, y)
            else:
                game.entity_factories.troll.spawn(dungeon, x, y)

def generate_dungeon(...) -> GameMap:
    player = engine.player
    dungeon = GameMap(engine, map_width, map_height, entities=[player])
    # ... room generation ...
    if len(rooms) == 0:
        player.place(*new_room.center, dungeon)
```

## Part 8 Refactoring Requirements

### Entity Parent System:
Not directly applicable to Part 3's procedural generation, but keep in mind:
- Entities will use `parent` instead of direct `gamemap` reference
- The `spawn()` method will handle parent assignment

### Place Entities Changes:
When implementing Part 3 with Part 8 refactoring:
```python
def place_entities(room: RectangularRoom, dungeon: GameMap, maximum_monsters: int, maximum_items: int) -> None:
    # Add item placement logic
    number_of_items = random.randint(0, maximum_items)
    
    for _ in range(number_of_items):
        x = random.randint(room.x1 + 1, room.x2 - 1)
        y = random.randint(room.y1 + 1, room.y2 - 1)
        
        if not any(entity.x == x and entity.y == y for entity in dungeon.entities):
            game.entity_factories.health_potion.spawn(dungeon, x, y)
```

## Part 10 Refactoring Requirements

### Handler State Management:
Not directly applicable to procedural generation, but affects main game flow:
- Event handlers will return new handlers
- Main loop tracks current handler instead of Engine

### Procedural Generation Unchanged:
The dungeon generation logic remains the same in Part 10.