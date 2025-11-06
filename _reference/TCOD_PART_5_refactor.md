# TCOD Tutorial Part 5 - Notes

## Overview
Part 5 adds enemies to the dungeon and implements a basic turn system. Players can now "kick" enemies (harmlessly) and enemies take turns after player actions.

## Key Objects and Systems

### Core Components:
1. **Enemy Placement**
   - `place_entities()` function in procgen
   - Randomly places 0 to max_monsters_per_room enemies
   - 80% chance for Orc, 20% for Troll
   - Avoids placing on entrance or other entities

2. **Entity Updates**
   - Added `name` and `blocks_movement` attributes
   - Entities that block movement prevent movement/overlap
   - `get_blocking_entity_at()` method in GameMap

3. **Action System Expansion**
   - `ActionWithDirection` base class for directional actions
   - `Move` action checks for blocking entities
   - `Melee` action for attacking (just prints message)
   - `Bump` action intelligently chooses Move or Melee

4. **Turn System**
   - `handle_enemy_turns()` in Engine
   - Called after each player action
   - Currently just logs messages (no AI yet)

### TCOD 19 Issues Found:
1. Same key constant issues as previous parts
2. Vi key constants also need updating (K_h → KeySym.h, etc.)

### Code Architecture:
- Actions now take the entity performing them as parameter
- Actions access engine through entity.gamemap.engine
- Input handler uses Bump instead of direct Move
- Enemy turns handled centrally in Engine

### Gameplay Goals:
- Populate dungeon with enemies
- Prevent movement through enemies
- Allow basic interaction (kicking) with enemies
- Establish turn-based gameplay foundation
- Prepare for combat system in next part

## Part 6 Refactoring Requirements

### Entity System Completion:
1. **Entity Factory Pattern**
   - Create `entity_factories.py` with predefined entities
   - Use `copy.deepcopy` for player creation in main
   - Entities defined with all components

2. **Actor Class Introduction**
   - Create Actor subclass of Entity
   - Actor has Fighter and AI components
   - `is_alive` property checks for AI presence
   - blocks_movement always True for actors

3. **Component System**
   - Create `components/` package
   - BaseComponent with entity reference
   - Fighter component with hp, defense, power
   - AI components (BaseAI, HostileEnemy)

4. **Action System Updates**
   - Add `target_actor` property to ActionWithDirection
   - MeleeAction uses Fighter components
   - Add WaitAction for passing turns

5. **Turn System**
   - `handle_enemy_turns()` calls AI perform()
   - Use `game_map.actors` iterator
   - Check entity.ai before performing

### Implementation for Part 5:
```python
# game/entity_factories.py
player = Actor(
    char="@",
    color=(255, 255, 255),
    name="Player",
    ai_cls=HostileEnemy,  # Dummy AI
    fighter=Fighter(hp=30, defense=2, power=5),
)

orc = Actor(
    char="o",
    color=(63, 127, 63),
    name="Orc",
    ai_cls=HostileEnemy,
    fighter=Fighter(hp=10, defense=0, power=3),
)

# game/components/fighter.py
class Fighter(BaseComponent):
    def die(self) -> None:
        if self.engine.player is self.entity:
            death_message = "You died!"
            self.engine.event_handler = GameOverEventHandler(self.engine)
        else:
            death_message = f"{self.entity.name} is dead!"
        
        self.entity.char = "%"
        self.entity.color = (191, 0, 0)
        self.entity.blocks_movement = False
        self.entity.ai = None
        self.entity.render_order = RenderOrder.CORPSE
```

## Part 8 Refactoring Requirements

### Entity Parent System:
When implementing Part 5 with Part 8 refactoring:
```python
# Entity factories will need inventory component
player = Actor(
    char="@",
    color=(255, 255, 255),
    name="Player",
    ai_cls=HostileEnemy,
    fighter=Fighter(hp=30, defense=2, power=5),
    inventory=Inventory(capacity=26),
)

# Components use parent instead of entity
class Fighter(BaseComponent):
    parent: Actor
    
    def die(self) -> None:
        if self.engine.player is self.parent:
            # ...
        self.parent.char = "%"
        # etc.
```

### AI Component Changes:
```python
# AI no longer inherits from BaseComponent
class BaseAI(Action):
    entity: Actor
    
    def perform(self) -> None:
        raise NotImplementedError()
```

## Part 10 Refactoring Requirements

### Handler State Management:
With BaseEventHandler, the death handling changes:
```python
class Fighter(BaseComponent):
    def die(self) -> None:
        if self.engine.player is self.parent:
            death_message = "You died!"
            # Don't set engine.event_handler here
            # GameOverEventHandler will be returned by handle_action
        else:
            death_message = f"{self.parent.name} is dead!"
```

### Turn System Integration:
```python
class EventHandler(BaseEventHandler):
    def handle_action(self, action: Optional[Action]) -> bool:
        if action is None:
            return False
        
        try:
            action.perform()
        except game.exceptions.Impossible as exc:
            self.engine.message_log.add_message(exc.args[0], game.color.impossible)
            return False
        
        self.engine.handle_enemy_turns()
        self.engine.update_fov()
        
        if not self.engine.player.is_alive:
            # Return GameOverEventHandler from handle_events
            pass
        
        return True
```