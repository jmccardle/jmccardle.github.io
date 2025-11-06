# TCOD Tutorial Part 4 - Notes

## Overview
Part 4 implements Field of View (FOV) to limit what the player can see. It introduces visibility and exploration mechanics to create a fog of war effect.

## Key Objects and Systems

### Core Components:
1. **Field of View System**
   - Engine has `update_fov()` method
   - Uses `tcod.map.compute_fov()` with symmetric shadowcasting
   - FOV radius of 8 tiles
   - Updates after every player action

2. **GameMap FOV Arrays**
   - `visible`: Boolean array tracking currently visible tiles
   - `explored`: Boolean array tracking previously seen tiles
   - Visible tiles automatically marked as explored

3. **Rendering Updates**
   - Different rendering for visible vs explored tiles
   - Unexplored areas not rendered at all
   - Entities only shown when visible

4. **Action System Refinement**
   - Actions now have `perform()` method
   - EventHandler calls `handle_action()` which triggers FOV update
   - Move action validates moves before executing

### TCOD 19 Issues Found:
1. Same key constant issues as previous parts
2. Additional key constant: `tcod.event.K_ESCAPE` → `tcod.event.KeySym.ESCAPE`
3. FOV algorithm constant: `tcod.FOV_SYMMETRIC_SHADOWCAST` may need updating

### Code Architecture:
- FOV calculation centralized in Engine
- Rendering system respects visibility states
- Action-based architecture ensures FOV updates after player moves

### Gameplay Goals:
- Limit player vision to a radius around their position
- Remember previously explored areas
- Create exploration-based gameplay
- Hide unexplored areas completely
- Show explored but not visible areas in darker colors

## Part 6 Refactoring Requirements

### FOV System Updates:
1. **Update FOV Algorithm**
   - Remove algorithm parameter from compute_fov
   - Use tiles["transparent"] instead of just tiles
   - tcod.map.compute_fov signature changed in newer versions

2. **Tile Access Changes**
   - Access tile properties with dictionary syntax
   - `tiles["walkable"]` instead of just checking tile value
   - `tiles["transparent"]` for FOV calculations

3. **Action System FOV Integration**
   - FOV updates happen in EventHandler.handle_events()
   - Called after action.perform()
   - Ensure FOV updates after enemy turns too

### Implementation for Part 4:
```python
# game/engine.py
def update_fov(self) -> None:
    self.game_map.visible[:] = tcod.map.compute_fov(
        self.game_map.tiles["transparent"],
        (self.player.x, self.player.y),
        radius=8,
    )
    self.game_map.explored |= self.game_map.visible

# game/input_handlers.py (MainGameEventHandler)
def handle_events(self) -> None:
    for event in tcod.event.wait():
        action = self.dispatch(event)
        if action is None:
            continue
        action.perform()
        self.engine.handle_enemy_turns()
        self.engine.update_fov()
```

## Part 8 Refactoring Requirements

### FOV System Unchanged:
The FOV system remains the same in Part 8. The parent refactoring doesn't affect FOV calculations.

### Entity Visibility:
With Part 8's parent system, entities still check visibility the same way:
```python
if self.engine.game_map.visible[entity.x, entity.y]:
    # Entity is visible
```

## Part 10 Refactoring Requirements

### BaseEventHandler Integration:
FOV updates continue to work the same way with BaseEventHandler:
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
        return True
```

### Handler State and FOV:
- FOV updates remain in the same location
- Handler changes don't affect FOV logic
- FOV state persists in Engine/GameMap regardless of active handler