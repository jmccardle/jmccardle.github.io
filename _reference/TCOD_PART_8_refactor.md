# Part 8: Items and Inventory

## Key Objects and Systems:

### 1. Item System
- **Item Entity Class**: Subclass of Entity for pickupable items
- **Consumable Component**: Base class for item effects
- **HealingConsumable**: Restores HP when used
- **Inventory Component**: Manages item storage with capacity

### 2. Item Actions
- **PickupAction**: Pick up items with 'G' key
- **ItemAction**: Base class for using items
- **DropItem**: Drop items from inventory with 'D' key

### 3. Inventory UI
- **InventoryEventHandler**: Base class for inventory menus
- **InventoryActivateHandler**: Menu for using items ('I' key)
- **InventoryDropHandler**: Menu for dropping items ('D' key)
- **Letter-based Selection**: Items shown with (a), (b), etc

### 4. Exception System
- **Impossible Exception**: Raised when actions can't be performed
- **Error Messages**: Shows in message log in error color

### 5. Enhanced Input System
- **ActionOrHandler Type**: Actions can return new event handlers
- **AskUserEventHandler**: Base for user input prompts
- **SelectIndexHandler**: Base for cursor-based selection
- **LookHandler**: Look around with '/' key

## Gameplay Goals:
- Pick up health potions with 'G'
- Open inventory with 'I' to use items
- Drop items with 'D'
- Look around the map with '/'
- Health potions restore HP when consumed
- Error messages for invalid actions

## REFACTORING ELEMENTS FROM PART 8:

### 1. Entity parent system refactor:
The Entity class now uses a `parent` attribute instead of direct `gamemap` reference. This allows entities to exist in inventories or on the map.

```python
# Old way (Parts 1-7):
class Entity:
    gamemap: game.game_map.GameMap
    
    def __init__(self, gamemap: Optional[GameMap] = None, ...):
        if gamemap:
            self.gamemap = gamemap
            gamemap.entities.add(self)

# New way (Part 8+):
class Entity:
    parent: Union[game.game_map.GameMap, game.components.inventory.Inventory]
    
    def __init__(self, parent: Optional[Union[GameMap, Inventory]] = None, ...):
        if parent:
            self.parent = parent
            parent.entities.add(self)
    
    @property
    def gamemap(self) -> game.game_map.GameMap:
        return self.parent.gamemap
```

### 2. BaseComponent parent refactor:
Components now use `parent` instead of `entity` for consistency:

```python
# Old way (Parts 1-7):
class BaseComponent:
    entity: Entity
    
    @property
    def engine(self) -> Engine:
        return self.entity.gamemap.engine

# New way (Part 8+):
class BaseComponent:
    parent: Entity
    
    @property
    def gamemap(self) -> GameMap:
        return self.parent.gamemap
    
    @property
    def engine(self) -> Engine:
        return self.gamemap.engine
```

### 3. Component initialization refactor:
Components now set parent in Entity classes:

```python
# Old way (Parts 1-7):
class Fighter(BaseComponent):
    entity: Actor
    # In die() method:
    self.entity.char = "%"

# New way (Part 8+):
class Fighter(BaseComponent):
    parent: Actor
    # In die() method:
    self.parent.char = "%"

# In Actor.__init__:
self.fighter = fighter
self.fighter.parent = self  # Instead of self.fighter.entity = self
```

### 4. AI no longer inherits from BaseComponent:
```python
# Old way (Parts 1-7):
class BaseAI(Action, BaseComponent):
    entity: Actor

# New way (Part 8+):
class BaseAI(Action):
    entity: Actor
```

### 5. MessageLog wrap method addition:
```python
@staticmethod
def wrap(string: str, width: int) -> Iterable[str]:
    """Return a wrapped text message."""
    for line in string.splitlines():  # Handle newlines in messages.
        yield from textwrap.wrap(
            line, width, expand_tabs=True,
        )

# render_messages now uses cls.wrap() instead of textwrap.wrap directly
```

### 6. New event handler pattern:
```python
ActionOrHandler = Union["game.actions.Action", "EventHandler"]

class EventHandler:
    def handle_events(self, event: tcod.event.Event) -> EventHandler:
        """Handle an event, perform any actions, then return the next active event handler."""
        action_or_state = self.dispatch(event)
        if isinstance(action_or_state, EventHandler):
            return action_or_state
        if self.handle_action(action_or_state):
            # A valid action was performed.
            if not self.engine.player.is_alive:
                # The player was killed sometime during or after the action.
                return GameOverEventHandler(self.engine)
            return MainGameEventHandler(self.engine)  # Return to the main handler.
        return self
```

## Files to update for refactoring:
1. `game/entity.py` - parent system
2. `game/components/base_component.py` - parent property
3. `game/components/fighter.py` - use parent instead of entity
4. `game/components/ai.py` - remove BaseComponent inheritance
5. `game/message_log.py` - add wrap method
6. `game/input_handlers.py` - new handler pattern
7. All entity creation code - use parent parameter