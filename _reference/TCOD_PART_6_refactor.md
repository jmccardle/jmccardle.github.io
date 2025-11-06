# Part 6: Doing (and taking) some damage

## Key Objects and Systems:

### 1. Combat System
- **Fighter Component**: Manages HP, defense, power, and death
- **Attack Actions**: MeleeAction handles combat calculations
- **Damage Formula**: damage = attacker.power - target.defense

### 2. Death System
- **Death Handling**: Fighter.die() method changes entity appearance and behavior
- **Game Over**: GameOverEventHandler for player death
- **Corpses**: Dead entities become non-blocking corpses with '%' character

### 3. Component System Enhanced
- **BaseComponent**: Now has properties for engine access via entity.gamemap.engine
- **Fighter Component**: Attached to all Actors (player, orcs, trolls)
- **AI Component**: HostileEnemy AI that pathfinds and attacks

### 4. Entity System Updates
- **Entity Base Class**: Has gamemap reference, blocks_movement, render_order
- **Actor Class**: Subclass of Entity with fighter and ai components
- **Render Order**: Enum for layering (CORPSE, ITEM, ACTOR)

## Gameplay Goals:
- Player can attack enemies by bumping into them
- Enemies can attack and damage the player  
- Entities can die and become corpses
- Game over state when player dies
- Combat log messages for attacks and deaths

## Code Examples:

### Fighter Component with die() method:
```python
class Fighter(BaseComponent):
    entity: game.entity.Actor
    
    def __init__(self, hp: int, defense: int, power: int):
        self.max_hp = hp
        self._hp = hp
        self.defense = defense
        self.power = power

    @property
    def hp(self) -> int:
        return self._hp

    @hp.setter
    def hp(self, value: int) -> None:
        self._hp = max(0, min(value, self.max_hp))
        if self._hp == 0 and self.entity.ai:
            self.die()

    def die(self) -> None:
        if self.engine.player is self.entity:
            death_message = "You died!"
            self.engine.event_handler = game.input_handlers.GameOverEventHandler(self.engine)
        else:
            death_message = f"{self.entity.name} is dead!"

        self.entity.char = "%"
        self.entity.color = (191, 0, 0)
        self.entity.blocks_movement = False
        self.entity.ai = None
        self.entity.name = f"remains of {self.entity.name}"
        self.entity.render_order = game.render_order.RenderOrder.CORPSE

        print(death_message)
```

### MeleeAction:
```python
class MeleeAction(ActionWithDirection):
    def perform(self) -> None:
        target = self.target_actor
        if not target:
            return  # No entity to attack.

        damage = self.entity.fighter.power - target.fighter.defense

        attack_desc = f"{self.entity.name.capitalize()} attacks {target.name}"
        if damage > 0:
            print(f"{attack_desc} for {damage} hit points.")
            target.fighter.hp -= damage
        else:
            print(f"{attack_desc} but does no damage.")
```

### GameOverEventHandler:
```python
class GameOverEventHandler(EventHandler):
    def handle_events(self) -> None:
        for event in tcod.event.wait():
            action = self.dispatch(event)

            if action is None:
                continue

            action.perform()

    def ev_keydown(self, event: tcod.event.KeyDown) -> Optional[game.actions.Action]:
        action: Optional[game.actions.Action] = None

        key = event.sym

        if key == tcod.event.KeySym.ESCAPE:
            action = game.actions.EscapeAction(self.engine.player)

        # No valid key was pressed
        return action
```

## Refactoring Already Applied (from Part 6):
All the refactoring mentioned in Part 6 was already incorporated into our implementation from Part 1:
- Event handlers have the handle_events method (not Engine)
- Game map has reference to Engine
- Entities have reference to gamemap
- Actions are initialized with the entity doing the action
- Actions access Engine through Entity->GameMap->Engine chain