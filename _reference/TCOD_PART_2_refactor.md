# TCOD Tutorial Part 2 - Notes

## Overview
Part 2 introduces the Entity class, Engine class, and GameMap to create a more structured game architecture. It also adds tile rendering for walls and floors.

## Key Objects and Systems

### Core Components:
1. **Entity Class**
   - Generic object for players, enemies, items
   - Stores position (x, y), character representation, and color
   - Has reference to the gamemap it belongs to
   - Automatically adds itself to gamemap's entity set on creation

2. **Engine Class**
   - Central game management class
   - Holds reference to player and game map
   - Responsible for coordinating game state

3. **GameMap Class**
   - Stores map dimensions and tile data (numpy array)
   - Maintains set of all entities on the map
   - Provides bounds checking functionality
   - Tiles are simple integers (0 = wall, 1 = floor)

4. **EventHandler Updates**
   - Now takes Engine reference in constructor
   - Handles rendering through on_render method
   - Returns self or new handler for state changes

### TCOD 19 Issues Found:
1. All key constants need updating (same as Part 1):
   - `tcod.event.K_*` → `tcod.event.KeySym.*`
   - Lowercase letter keys: `K_h` → `KeySym.h`
   - Uppercase variants also available

2. Console class deprecation still present

### Code Architecture Changes:
- Entities now belong to a GameMap
- GameMap belongs to Engine
- EventHandler coordinates between input and Engine
- Rendering separated into its own module
- Actions module introduced for command pattern

### Gameplay Goals:
- Display a simple map with walls and floors
- Move player around the map
- Prevent player from walking through walls
- Display multiple entities on the map
- Basic tile-based rendering system

## Part 6 Refactoring Requirements

### Major Architecture Changes:
1. **Entity System Overhaul**
   - Split Entity into base Entity and Actor subclass
   - Entity gets `place()` and `spawn()` methods
   - Entity stores reference to gamemap (circular reference)
   - Actor class for living entities with AI and Fighter components

2. **Tile System Refactor**
   - Create `tiles.py` with structured numpy dtype for tiles
   - Tiles have walkable, transparent, dark, and light properties
   - Use `new_tile()` helper function
   - SHROUD constant for unexplored areas

3. **Engine Changes**
   - Engine only takes player in `__init__`
   - Engine creates and owns EventHandler
   - Engine has `render()` method that delegates to GameMap
   - Remove event handling from Engine

4. **GameMap Updates**
   - GameMap stores entities, not Engine
   - Add `actors` property to iterate living actors
   - Add `get_actor_at_location()` method
   - GameMap handles all rendering (map and entities)

5. **Rendering System**
   - Move all rendering logic to GameMap.render()
   - Use numpy select for tile rendering
   - Sort entities by render_order before drawing

### Implementation for Part 2:
```python
# game/tiles.py
tile_dt = np.dtype([
    ("walkable", bool),
    ("transparent", bool), 
    ("dark", graphic_dt),
    ("light", graphic_dt),
])

floor = new_tile(
    walkable=True,
    transparent=True,
    dark=(ord(" "), (255, 255, 255), (50, 50, 150)),
    light=(ord(" "), (255, 255, 255), (200, 180, 50)),
)

# game/entity.py
class Entity:
    def place(self, x: int, y: int, gamemap: GameMap) -> None:
        self.x = x
        self.y = y
        if gamemap:
            if hasattr(self, "gamemap"):
                self.gamemap.entities.remove(self)
            self.gamemap = gamemap
            gamemap.entities.add(self)
```

## Part 8 Refactoring Requirements

### Entity Parent System:
In Part 8, the Entity system gets a major refactor:
```python
class Entity:
    parent: Union[game.game_map.GameMap, game.components.inventory.Inventory]
    
    def __init__(self, parent: Optional[...] = None, ...):
        if parent:
            self.parent = parent
            parent.entities.add(self)
    
    @property
    def gamemap(self) -> game.game_map.GameMap:
        return self.parent.gamemap
```

For Part 2, continue using direct `gamemap` attribute since inventory doesn't exist yet.

### BaseComponent System:
Not applicable to Part 2 - components are introduced later.

## Part 10 Refactoring Requirements

### BaseEventHandler System:
Prepare for future BaseEventHandler pattern:
```python
# Future pattern (not needed in Part 2):
ActionOrHandler = Union[Action, "BaseEventHandler"]

class BaseEventHandler(tcod.event.EventDispatch[ActionOrHandler]):
    def handle_events(self, event: tcod.event.Event) -> BaseEventHandler:
        state = self.dispatch(event)
        if isinstance(state, BaseEventHandler):
            return state
        return self
```

### Handler State Management:
- In Part 10, handlers return new handlers instead of modifying engine.event_handler
- Main loop will track current handler instead of Engine
- For Part 2, keep simple handler management in Engine