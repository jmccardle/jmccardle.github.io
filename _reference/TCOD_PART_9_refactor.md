# Part 9: Ranged Scrolls and Targeting

## Key Objects and Systems:

### 1. New Consumable Types
- **LightningDamageConsumable**: Auto-targets closest visible enemy
- **ConfusionConsumable**: Requires single target selection
- **FireballDamageConsumable**: Area of effect damage with radius

### 2. Targeting System
- **SingleRangedAttackHandler**: Select one target with cursor
- **AreaRangedAttackHandler**: Shows area of effect radius
- **Callback Pattern**: Handlers use callbacks to create actions

### 3. AI Enhancements
- **ConfusedEnemy AI**: Randomly moves for set turns
- **AI State Storage**: Stores previous AI to restore later

### 4. Enhanced Actions
- **ItemAction with target_xy**: Optional targeting coordinates
- **target_actor property**: Gets actor at target position

### 5. Visual Feedback
- **Area highlighting**: Shows fireball radius in red
- **Targeting messages**: "Select a target location"
- **Status effect messages**: Confusion application feedback

## Gameplay Goals:
- Lightning scroll auto-targets closest enemy
- Confusion scroll requires selecting an enemy
- Fireball scroll shows area of effect
- All scrolls are single-use consumables
- Strategic ranged combat options

## Code Examples:

### SingleRangedAttackHandler:
```python
class SingleRangedAttackHandler(SelectIndexHandler):
    """Handles targeting a single enemy. Only the enemy selected will be affected."""

    def __init__(
        self, engine: game.engine.Engine, callback: Callable[[Tuple[int, int]], Optional[game.actions.Action]]
    ):
        super().__init__(engine)
        self.callback = callback

    def on_index_selected(self, x: int, y: int) -> Optional[game.actions.Action]:
        return self.callback((x, y))
```

### AreaRangedAttackHandler with visual feedback:
```python
class AreaRangedAttackHandler(SelectIndexHandler):
    """Handles targeting an area within a given radius. Any entity within the area will be affected."""

    def __init__(
        self,
        engine: game.engine.Engine,
        radius: int,
        callback: Callable[[Tuple[int, int]], Optional[game.actions.Action]],
    ):
        super().__init__(engine)
        self.radius = radius
        self.callback = callback

    def on_render(self, console: tcod.Console) -> None:
        """Highlight the tile under the cursor."""
        super().on_render(console)

        aoe_tiles = np.full((self.engine.game_map.width, self.engine.game_map.height), fill_value=False, order="F")

        x, y = self.engine.mouse_location

        # Calculate and draw the aoe if the target is visible.
        if self.engine.game_map.visible[x, y]:
            aoe_tiles[:] = tcod.map.compute_fov(
                self.engine.game_map.tiles["transparent"],
                self.engine.mouse_location,
                radius=self.radius,
                light_walls=False,
                algorithm=tcod.FOV_BASIC,
            )

            aoe_tiles &= self.engine.game_map.visible

            aoe_tiles[x, y] = False
            console.tiles_rgb["bg"][aoe_tiles] = game.color.red

    def on_index_selected(self, x: int, y: int) -> Optional[game.actions.Action]:
        return self.callback((x, y))
```

### Consumable with targeting:
```python
class ConfusionConsumable(Consumable):
    def __init__(self, number_of_turns: int):
        self.number_of_turns = number_of_turns

    def get_action(self, consumer: game.entity.Actor) -> Optional[game.input_handlers.ActionOrHandler]:
        self.engine.message_log.add_message("Select a target location.", game.color.needs_target)
        return game.input_handlers.SingleRangedAttackHandler(
            self.engine,
            callback=lambda xy: game.actions.ItemAction(consumer, self.parent, xy),
        )

    def activate(self, action: game.actions.ItemAction) -> None:
        consumer = action.entity
        target = action.target_actor

        if not self.engine.game_map.visible[action.target_xy]:
            raise game.exceptions.Impossible("You cannot target an area that you cannot see.")
        if not target:
            raise game.exceptions.Impossible("You must select an enemy to target.")
        if target is consumer:
            raise game.exceptions.Impossible("You cannot confuse yourself!")

        self.engine.message_log.add_message(
            f"The eyes of the {target.name} look vacant, as it starts to stumble around!",
            game.color.status_effect_applied,
        )
        target.ai = game.components.ai.ConfusedEnemy(
            entity=target,
            previous_ai=target.ai,
            turns_remaining=self.number_of_turns,
        )
        self.consume()
```

### ItemAction with optional targeting:
```python
class ItemAction(Action):
    def __init__(
        self, entity: Actor, item: Item, target_xy: Optional[Tuple[int, int]] = None
    ):
        super().__init__(entity)
        self.item = item
        self.target_xy = target_xy

    @property
    def target_actor(self) -> Optional[Actor]:
        """Return the actor at this actions destination."""
        if not self.target_xy:
            return None
        return self.engine.game_map.get_actor_at_location(*self.target_xy)
```

## No Refactoring in Part 9
Part 9 introduces new features but doesn't include any refactoring that needs to be backported.