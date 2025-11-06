# TCOD Tutorial Part 1 - Notes

## Overview
Part 1 focuses on setting up the basic game window and getting the player symbol (@) to move around the screen.

## Key Objects and Systems

### Core Components:
1. **Main Game Loop**
   - Creates window context using `tcod.context.new()`
   - Manages the console for drawing
   - Handles event processing
   - Updates player position based on input

2. **Player Representation**
   - Simple x,y coordinates (player_x, player_y)
   - @ symbol drawn at player position

3. **Input Handling**
   - Simple dictionary mapping of keys to movement deltas
   - Direct event handling in main loop
   - Boundary checking to prevent moving off-screen

### TCOD 19 Issues Found:
1. Deprecated key constants:
   - `tcod.event.K_UP` → `tcod.event.KeySym.UP`
   - `tcod.event.K_DOWN` → `tcod.event.KeySym.DOWN`
   - `tcod.event.K_LEFT` → `tcod.event.KeySym.LEFT`
   - `tcod.event.K_RIGHT` → `tcod.event.KeySym.RIGHT`

2. Deprecated Console class:
   - `tcod.Console` → `tcod.console.Console`

### Code Differences from Tutorial Text:
The actual code implementation differs significantly from the tutorial text:
- Tutorial uses `actions.py` and `input_handlers.py` with an event handler class system
- Actual code uses a simple dictionary approach for movement keys
- Tutorial uses `tcod.context.new_terminal()`, actual code uses `tcod.context.new()`
- Tutorial handles quit via EventHandler, actual code checks `isinstance(event, tcod.event.Quit)`

### Gameplay Goals:
- Display a window with the @ symbol
- Allow player to move the @ symbol using arrow keys
- Prevent player from moving outside screen boundaries
- Handle window close events gracefully

## Part 6 Refactoring Requirements

### Architecture Changes:
1. **Create game package structure**
   - All game code should be in a `game/` package
   - Use proper imports (e.g., `import game.actions`)

2. **EventHandler Architecture** 
   - Create `EventHandler` base class with `handle_events()` method
   - `MainGameEventHandler` subclass for main game loop
   - EventHandler owns the event loop, not Engine
   - EventHandler gets Engine reference in `__init__`

3. **Action System**
   - Actions initialized with the entity performing them
   - Actions access Engine through: `self.entity.gamemap.engine`
   - Add base `Action` class with `perform()` method
   - Create `ActionWithDirection` base class
   - Implement `Escape`, `Move`, `Bump` actions

4. **Input Handling**
   - Use proper action classes instead of direct manipulation
   - Return actions from event methods
   - MOVE_KEYS dictionary with all movement keys (arrows, numpad, vi keys)

### Implementation for Part 1:
```python
# game/input_handlers.py
class EventHandler(tcod.event.EventDispatch[game.actions.Action]):
    def __init__(self, engine: game.engine.Engine):
        self.engine = engine
    
    def handle_events(self) -> None:
        for event in tcod.event.wait():
            action = self.dispatch(event)
            if action is None:
                continue
            action.perform()

# game/actions.py  
class Action:
    def __init__(self, entity: game.entity.Entity) -> None:
        self.entity = entity
    
    def perform(self) -> None:
        raise NotImplementedError()

class Move(ActionWithDirection):
    def perform(self) -> None:
        dest_x = self.entity.x + self.dx
        dest_y = self.entity.y + self.dy
        # Boundary checking
        if 0 <= dest_x < 80 and 0 <= dest_y < 50:
            self.entity.x, self.entity.y = dest_x, dest_y
```

## Part 8 Refactoring Requirements

### Entity Parent System:
Entities now use a flexible `parent` system instead of direct `gamemap` reference:
```python
# Entity class changes:
class Entity:
    parent: Union[game.game_map.GameMap, game.components.inventory.Inventory]
    
    @property
    def gamemap(self) -> game.game_map.GameMap:
        return self.parent.gamemap
```

### BaseComponent Parent Refactor:
Components use `parent` instead of `entity` for consistency:
```python
class BaseComponent:
    parent: Entity  # Instead of entity: Entity
    
    @property
    def gamemap(self) -> GameMap:
        return self.parent.gamemap
    
    @property
    def engine(self) -> Engine:
        return self.gamemap.engine
```

### ActionOrHandler Type:
New unified return type for event handlers:
```python
ActionOrHandler = Union["game.actions.Action", "EventHandler"]
```

### MessageLog wrap method:
Add static wrap method to MessageLog for text wrapping:
```python
@staticmethod
def wrap(string: str, width: int) -> Iterable[str]:
    """Return a wrapped text message."""
    for line in string.splitlines():
        yield from textwrap.wrap(line, width, expand_tabs=True)
```

## Part 10 Refactoring Requirements

### BaseEventHandler Introduction:
New base class for all event handlers:
```python
class BaseEventHandler(tcod.event.EventDispatch[ActionOrHandler]):
    def handle_events(self, event: tcod.event.Event) -> BaseEventHandler:
        """Handle an event and return the next active event handler."""
        state = self.dispatch(event)
        if isinstance(state, BaseEventHandler):
            return state
        assert not isinstance(state, game.actions.Action), f"{self!r} can not handle actions."
        return self
    
    def on_render(self, console: tcod.Console) -> None:
        raise NotImplementedError()
    
    def ev_quit(self, event: tcod.event.Quit) -> Optional[game.actions.Action]:
        raise SystemExit()
```

### EventHandler Changes:
EventHandler now extends BaseEventHandler and returns handlers:
```python
class EventHandler(BaseEventHandler):
    def handle_events(self, event: tcod.event.Event) -> BaseEventHandler:
        """Handle events for input handlers with an engine."""
        action_or_state = self.dispatch(event)
        if isinstance(action_or_state, BaseEventHandler):
            return action_or_state
        if self.handle_action(action_or_state):
            if not self.engine.player.is_alive:
                return GameOverEventHandler(self.engine)
            return MainGameEventHandler(self.engine)
        return self
```

### Handler Management:
- Handlers return new handlers instead of setting engine.event_handler
- Main loop tracks the current handler
- All event methods return Optional[ActionOrHandler]
- Remove ev_quit from EventHandler (inherited from BaseEventHandler)