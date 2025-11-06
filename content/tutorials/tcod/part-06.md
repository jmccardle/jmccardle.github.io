---
title: "Part 6 - Doing (and taking) some damage"
date: 2025-08-25
draft: false
---

The last part of this tutorial set us up for combat, so now it's time to actually implement it.

In order to make "killable" Entities, we'll extend our entity system with **components**. We'll create a `Fighter` component to hold combat information like HP, max HP, attack, and defense. If an Entity can fight, it will have this component attached to it, and if not, it won't. This way of doing things is called **composition**, and it's an alternative to your typical inheritance-based programming model. (This tutorial uses both composition *and* inheritance).

Create a new Python package (a folder with an empty \_\_init\_\_.py file), called `game/components`. In that new directory, add two new files, one called `base_component.py`, and another called `fighter.py`. The `Fighter` class in `fighter.py` will inherit from the class we put in `base_component.py`, so let's start with that one:

```py3
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import game.engine
    import game.entity
    import game.game_map


class BaseComponent:
    parent: game.entity.Entity  # Owning entity instance.

    @property
    def gamemap(self) -> game.game_map.GameMap:
        gamemap = self.parent.gamemap
        assert gamemap is not None
        return gamemap

    @property
    def engine(self) -> game.engine.Engine:
        return self.gamemap.engine
```

Components will use `parent` to reference the entity that owns them. This gives us access to the gamemap and engine through the parent entity.

With that, let's now open up `fighter.py` and put the following into it:

```py3
from __future__ import annotations

from typing import TYPE_CHECKING

from game.components.base_component import BaseComponent
from game.render_order import RenderOrder
import game.input_handlers

if TYPE_CHECKING:
    import game.entity


class Fighter(BaseComponent):
    parent: game.entity.Actor

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
        if self._hp == 0 and self.parent.ai:
            self.die()

    def die(self) -> None:
        if self.engine.player is self.parent:
            death_message = "You died!"
        else:
            death_message = f"{self.parent.name} is dead!"

        self.parent.char = "%"
        self.parent.color = (191, 0, 0)
        self.parent.blocks_movement = False
        self.parent.ai = None
        self.parent.name = f"remains of {self.parent.name}"
        self.parent.render_order = RenderOrder.CORPSE

        print(death_message)
```

We import and inherit from `BaseComponent`, which gives us access to the parent entity and the engine.

The `__init__` function takes a few arguments. `hp` represents the entity's hit points. `defense` is how much taken damage will be reduced. `power` is the entity's raw attack power.

What's with the `hp` property? We define both a getter and setter, which will allow the class to access `hp` like a normal variable. The getter doesn't do anything special: it just returns the HP. The setter is where things get more interesting.

By defining HP this way, we can modify the value as it's set within the method. This line:

```py3
self._hp = max(0, min(value, self.max_hp))
```

Means that `_hp` (which we access through `hp`) will never be set to less than 0, but also won't ever go higher than the `max_hp` attribute. Additionally, when HP reaches 0, we call the `die()` method.

The `die()` method handles what happens when an entity dies - it becomes a corpse, stops blocking movement, and loses its AI.

We need to define the render order for corpses. Create a new file `game/render_order.py`:

```py3
from enum import auto, Enum


class RenderOrder(Enum):
    CORPSE = auto()
    ITEM = auto()
    ACTOR = auto()
```

This enum will help us render entities in the correct order - corpses on the bottom, then items, then actors on top.

So that's our `Fighter` component. To give life to our entities and let them move around and fight, we'll add an AI component.

Create a file in the `game/components` directory called `ai.py`, and put the following contents into it:

```py3
from __future__ import annotations

from typing import TYPE_CHECKING, List, Tuple

import numpy as np
import tcod

from game.actions import Action, MeleeAction, MovementAction

if TYPE_CHECKING:
    import game.entity


class BaseAI(Action):
    entity: game.entity.Actor

    def perform(self) -> None:
        raise NotImplementedError()

    def get_path_to(self, dest_x: int, dest_y: int) -> List[Tuple[int, int]]:
        """Compute and return a path to the target position.

        If there is no valid path then returns an empty list.
        """
        # Copy the walkable array.
        gamemap = self.entity.gamemap
        assert gamemap is not None
        cost = np.array(gamemap.tiles["walkable"], dtype=np.int8)

        for entity in gamemap.entities:
            # Check that an entity blocks movement and the cost isn't zero (blocking.)
            if entity.blocks_movement and cost[entity.x, entity.y]:
                # Add to the cost of a blocked position.
                # A lower number means more enemies will crowd behind each other in
                # hallways.  A higher number means enemies will take longer paths in
                # order to surround the player.
                cost[entity.x, entity.y] += 10

        # Create a graph from the cost array and pass that graph to a new pathfinder.
        graph = tcod.path.SimpleGraph(cost=cost, cardinal=2, diagonal=3)
        pathfinder = tcod.path.Pathfinder(graph)

        pathfinder.add_root((self.entity.x, self.entity.y))  # Start position.

        # Compute the path to the destination and remove the starting point.
        path: List[List[int]] = pathfinder.path_to((dest_x, dest_y))[1:].tolist()

        # Convert from List[List[int]] to List[Tuple[int, int]].
        return [(index[0], index[1]) for index in path]


class HostileEnemy(BaseAI):
    def __init__(self, entity: game.entity.Actor):
        super().__init__(entity)
        self.path: List[Tuple[int, int]] = []

    def perform(self) -> None:
        target = self.engine.player
        dx = target.x - self.entity.x
        dy = target.y - self.entity.y
        distance = max(abs(dx), abs(dy))  # Chebyshev distance.

        if self.engine.game_map.visible[self.entity.x, self.entity.y]:
            if distance <= 1:
                return MeleeAction(self.entity, dx, dy).perform()

            self.path = self.get_path_to(target.x, target.y)

        if self.path:
            dest_x, dest_y = self.path.pop(0)
            return MovementAction(
                self.entity,
                dest_x - self.entity.x,
                dest_y - self.entity.y,
            ).perform()
```

`BaseAI` inherits from `Action`, so AI classes can perform actions. The `get_path_to` method uses TCOD's pathfinding to navigate around obstacles. The pathfinder builds a cost array - areas with entities have higher cost, encouraging enemies to path around each other rather than bunching up.

`HostileEnemy` is our concrete AI implementation. It checks if it can see the player (is in the visible area), and if so, either attacks if adjacent or moves toward the player using pathfinding.

Now we need to distinguish between entities that can act and those that can't. Let's create an `Actor` subclass of `Entity` for entities with AI and combat capabilities. Update `game/entity.py`:

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
from __future__ import annotations

-from typing import TYPE_CHECKING, Optional, Tuple
+from typing import TYPE_CHECKING, Optional, Tuple, Type

+from game.render_order import RenderOrder

if TYPE_CHECKING:
+   import game.components.ai
+   import game.components.fighter
    import game.game_map


class Entity:
    """
    A generic object to represent players, enemies, items, etc.
    """

-   gamemap: game.game_map.GameMap
+   gamemap: Optional[game.game_map.GameMap]

    def __init__(
        self,
        gamemap: Optional[game.game_map.GameMap] = None,
        x: int = 0,
        y: int = 0,
        char: str = "?",
        color: Tuple[int, int, int] = (255, 255, 255),
        name: str = "<Unnamed>",
        blocks_movement: bool = False,
    ):
        self.x = x
        self.y = y
        self.char = char
        self.color = color
        self.name = name
        self.blocks_movement = blocks_movement
+       self.render_order = RenderOrder.CORPSE
        if gamemap:
            # If gamemap isn't provided now then it will be set later.
            self.gamemap = gamemap
            gamemap.entities.add(self)

    def place(self, x: int, y: int, gamemap: Optional[game.game_map.GameMap] = None) -> None:
        """Place this entity at a new location. Handles moving across GameMaps."""
        self.x = x
        self.y = y
        if gamemap:
-           if hasattr(self, "gamemap"):  # Possibly uninitialized.
+           if hasattr(self, "gamemap") and self.gamemap is not None:  # Possibly uninitialized.
                self.gamemap.entities.remove(self)
            self.gamemap = gamemap
            gamemap.entities.add(self)

    def move(self, dx: int, dy: int) -> None:
        # Move the entity by a given amount
        self.x += dx
        self.y += dy


+class Actor(Entity):
+   def __init__(
+       self,
+       *,
+       x: int = 0,
+       y: int = 0,
+       char: str = "?",
+       color: Tuple[int, int, int] = (255, 255, 255),
+       name: str = "<Unnamed>",
+       ai_cls: Type[game.components.ai.BaseAI],
+       fighter: game.components.fighter.Fighter,
+   ):
+       super().__init__(
+           gamemap=None,
+           x=x,
+           y=y,
+           char=char,
+           color=color,
+           name=name,
+           blocks_movement=True,
+       )
+
+       self.ai: Optional[game.components.ai.BaseAI] = ai_cls(self)
+       self.fighter = fighter
+       self.fighter.parent = self
+
+       self.render_order = RenderOrder.ACTOR
+
+   @property
+   def is_alive(self) -> bool:
+       """Returns True as long as this actor can perform actions."""
+       return bool(self.ai)
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>from __future__ import annotations

<span class="crossed-out-text">from typing import TYPE_CHECKING, Optional, Tuple</span>
<span class="new-text">from typing import TYPE_CHECKING, Optional, Tuple, Type

from game.render_order import RenderOrder</span>

if TYPE_CHECKING:
    <span class="new-text">import game.components.ai
    import game.components.fighter</span>
    import game.game_map


class Entity:
    """
    A generic object to represent players, enemies, items, etc.
    """

    <span class="crossed-out-text">gamemap: game.game_map.GameMap</span>
    <span class="new-text">gamemap: Optional[game.game_map.GameMap]</span>

    def __init__(
        self,
        gamemap: Optional[game.game_map.GameMap] = None,
        x: int = 0,
        y: int = 0,
        char: str = "?",
        color: Tuple[int, int, int] = (255, 255, 255),
        name: str = "&lt;Unnamed&gt;",
        blocks_movement: bool = False,
    ):
        self.x = x
        self.y = y
        self.char = char
        self.color = color
        self.name = name
        self.blocks_movement = blocks_movement
        <span class="new-text">self.render_order = RenderOrder.CORPSE</span>
        if gamemap:
            # If gamemap isn't provided now then it will be set later.
            self.gamemap = gamemap
            gamemap.entities.add(self)

    def place(self, x: int, y: int, gamemap: Optional[game.game_map.GameMap] = None) -> None:
        """Place this entity at a new location. Handles moving across GameMaps."""
        self.x = x
        self.y = y
        if gamemap:
            <span class="crossed-out-text">if hasattr(self, "gamemap"):  # Possibly uninitialized.</span>
            <span class="new-text">if hasattr(self, "gamemap") and self.gamemap is not None:  # Possibly uninitialized.</span>
                self.gamemap.entities.remove(self)
            self.gamemap = gamemap
            gamemap.entities.add(self)

    def move(self, dx: int, dy: int) -> None:
        # Move the entity by a given amount
        self.x += dx
        self.y += dy


<span class="new-text">class Actor(Entity):
    def __init__(
        self,
        *,
        x: int = 0,
        y: int = 0,
        char: str = "?",
        color: Tuple[int, int, int] = (255, 255, 255),
        name: str = "&lt;Unnamed&gt;",
        ai_cls: Type[game.components.ai.BaseAI],
        fighter: game.components.fighter.Fighter,
    ):
        super().__init__(
            gamemap=None,
            x=x,
            y=y,
            char=char,
            color=color,
            name=name,
            blocks_movement=True,
        )

        self.ai: Optional[game.components.ai.BaseAI] = ai_cls(self)
        self.fighter = fighter
        self.fighter.parent = self

        self.render_order = RenderOrder.ACTOR

    @property
    def is_alive(self) -> bool:
        """Returns True as long as this actor can perform actions."""
        return bool(self.ai)</span></pre>
{{</ original-tab >}}
{{</ codetab >}}

The `Actor` class extends `Entity` with AI and Fighter components. Actors always block movement and have a higher render order than regular entities.

Now let's update our entity factories to create Actors instead of Entities. Modify `game/entity_factories.py`:

```py3
from game.components.ai import HostileEnemy
from game.components.fighter import Fighter
from game.entity import Actor

player = Actor(
    char="@", 
    color=(255, 255, 255), 
    name="Player", 
    ai_cls=HostileEnemy,  # Will be overridden
    fighter=Fighter(hp=30, defense=2, power=5),
)

orc = Actor(
    char="o", 
    color=(63, 127, 63), 
    name="Orc", 
    ai_cls=HostileEnemy,
    fighter=Fighter(hp=10, defense=0, power=3),
)

troll = Actor(
    char="T", 
    color=(0, 127, 0), 
    name="Troll", 
    ai_cls=HostileEnemy,
    fighter=Fighter(hp=16, defense=1, power=4),
)
```

We've given each entity type appropriate combat stats. The player is tougher than individual enemies but will need to be careful when facing multiple foes.

Now update `game/procgen.py` to spawn our new Actor types:

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
def place_entities(
    room: RectangularRoom,
    dungeon: game.game_map.GameMap,
    maximum_monsters: int,
) -> None:
    number_of_monsters = random.randint(0, maximum_monsters)

    for _ in range(number_of_monsters):
        x = random.randint(room.x1 + 1, room.x2 - 1)
        y = random.randint(room.y1 + 1, room.y2 - 1)

        if not any(entity.x == x and entity.y == y for entity in dungeon.entities):
            if random.random() < 0.8:
-               Entity(gamemap=dungeon, x=x, y=y, char="o", color=(63, 127, 63), name="Orc", blocks_movement=True)
+               game.entity_factories.orc.spawn(dungeon, x, y)
            else:
-               Entity(gamemap=dungeon, x=x, y=y, char="T", color=(0, 127, 0), name="Troll", blocks_movement=True)
+               game.entity_factories.troll.spawn(dungeon, x, y)
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>def place_entities(
    room: RectangularRoom,
    dungeon: game.game_map.GameMap,
    maximum_monsters: int,
) -> None:
    number_of_monsters = random.randint(0, maximum_monsters)

    for _ in range(number_of_monsters):
        x = random.randint(room.x1 + 1, room.x2 - 1)
        y = random.randint(room.y1 + 1, room.y2 - 1)

        if not any(entity.x == x and entity.y == y for entity in dungeon.entities):
            if random.random() < 0.8:
                <span class="crossed-out-text">Entity(gamemap=dungeon, x=x, y=y, char="o", color=(63, 127, 63), name="Orc", blocks_movement=True)</span>
                <span class="new-text">game.entity_factories.orc.spawn(dungeon, x, y)</span>
            else:
                <span class="crossed-out-text">Entity(gamemap=dungeon, x=x, y=y, char="T", color=(0, 127, 0), name="Troll", blocks_movement=True)</span>
                <span class="new-text">game.entity_factories.troll.spawn(dungeon, x, y)</span></pre>
{{</ original-tab >}}
{{</ codetab >}}

We'll also need to add the import and use the spawn method which creates copies of our entity templates:

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
from typing import TYPE_CHECKING, Iterator, List, Tuple
import random

import tcod

-from game.entity import Entity
+import game.entity_factories
from game.game_map import GameMap
from game.tiles import floor
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>from typing import TYPE_CHECKING, Iterator, List, Tuple
import random

import tcod

<span class="crossed-out-text">from game.entity import Entity</span>
<span class="new-text">import game.entity_factories</span>
from game.game_map import GameMap
from game.tiles import floor</pre>
{{</ original-tab >}}
{{</ codetab >}}

Add the spawn method to the Entity class in `game/entity.py` if you haven't already:

```py3
def spawn(self: T, gamemap: GameMap, x: int, y: int) -> T:
    """Spawn a copy of this instance at the given location."""
    clone = copy.deepcopy(self)
    clone.x = x
    clone.y = y
    clone.place(x, y, gamemap)
    return clone
```

Don't forget the imports at the top:
```py3
import copy
from typing import TYPE_CHECKING, Optional, Tuple, Type, TypeVar

T = TypeVar("T", bound="Entity")
```

We need to update our GameMap to handle actors properly. Modify `game/game_map.py`:

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
+from typing import TYPE_CHECKING, Iterator, Iterable, Optional, Set
-from typing import TYPE_CHECKING, Optional, Set

if TYPE_CHECKING:
    import game.engine
    import game.entity

class GameMap:
    ...

+   @property
+   def actors(self) -> Iterator[game.entity.Actor]:
+       """Iterate over this maps living actors."""
+       yield from (
+           entity
+           for entity in self.entities
+           if isinstance(entity, game.entity.Actor) and entity.is_alive
+       )

    def render(self, console: tcod.console.Console) -> None:
        ...

-       for entity in self.entities:
+       entities_sorted_for_rendering = sorted(
+           self.entities, key=lambda x: x.render_order.value
+       )
+
+       for entity in entities_sorted_for_rendering:
            # Only print entities that are in the FOV
            if self.visible[entity.x, entity.y]:
                console.print(x=entity.x, y=entity.y, string=entity.char, fg=entity.color)
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre><span class="new-text">from typing import TYPE_CHECKING, Iterator, Iterable, Optional, Set</span>
<span class="crossed-out-text">from typing import TYPE_CHECKING, Optional, Set</span>

if TYPE_CHECKING:
    import game.engine
    import game.entity

class GameMap:
    ...

    <span class="new-text">@property
    def actors(self) -> Iterator[game.entity.Actor]:
        """Iterate over this maps living actors."""
        yield from (
            entity
            for entity in self.entities
            if isinstance(entity, game.entity.Actor) and entity.is_alive
        )</span>

    def render(self, console: tcod.console.Console) -> None:
        ...

        <span class="crossed-out-text">for entity in self.entities:</span>
        <span class="new-text">entities_sorted_for_rendering = sorted(
            self.entities, key=lambda x: x.render_order.value
        )

        for entity in entities_sorted_for_rendering:</span>
            # Only print entities that are in the FOV
            if self.visible[entity.x, entity.y]:
                console.print(x=entity.x, y=entity.y, string=entity.char, fg=entity.color)</pre>
{{</ original-tab >}}
{{</ codetab >}}

The `actors` property gives us only the living actors on the map, which is what we'll use for enemy turns. The rendering now sorts entities by their render order, so corpses appear under living actors.

Now let's update the MeleeAction to actually deal damage. In `game/actions.py`:

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
class MeleeAction(ActionWithDirection):
    def perform(self) -> None:
-       target = self.blocking_entity
+       target = self.target_actor
        if not target:
            return  # No entity to attack.

-       print(f"You kick the {target.name}, much to its annoyance!")
+       # Type checking to ensure both entities are Actors with fighter components
+       assert isinstance(self.entity, game.entity.Actor), "Attacker must be an Actor"
+       assert isinstance(target, game.entity.Actor), "Target must be an Actor"
+
+       damage = self.entity.fighter.power - target.fighter.defense
+
+       attack_desc = f"{self.entity.name.capitalize()} attacks {target.name}"
+       if damage > 0:
+           print(f"{attack_desc} for {damage} hit points.")
+           target.fighter.hp -= damage
+       else:
+           print(f"{attack_desc} but does no damage.")
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>class MeleeAction(ActionWithDirection):
    def perform(self) -> None:
        <span class="crossed-out-text">target = self.blocking_entity</span>
        <span class="new-text">target = self.target_actor</span>
        if not target:
            return  # No entity to attack.

        <span class="crossed-out-text">print(f"You kick the {target.name}, much to its annoyance!")</span>
        <span class="new-text"># Type checking to ensure both entities are Actors with fighter components
        assert isinstance(self.entity, game.entity.Actor), "Attacker must be an Actor"
        assert isinstance(target, game.entity.Actor), "Target must be an Actor"

        damage = self.entity.fighter.power - target.fighter.defense

        attack_desc = f"{self.entity.name.capitalize()} attacks {target.name}"
        if damage > 0:
            print(f"{attack_desc} for {damage} hit points.")
            target.fighter.hp -= damage
        else:
            print(f"{attack_desc} but does no damage.")</span></pre>
{{</ original-tab >}}
{{</ codetab >}}

The damage calculation is simple: attacker's power minus defender's defense. When we set a fighter's HP, it will automatically trigger the death logic if it reaches 0.

Update the Engine to handle enemy turns using their AI. In `game/engine.py`:

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
-from game.entity import Entity
+from game.entity import Actor

class Engine:
    game_map: game.game_map.GameMap

-   def __init__(self, player: Entity):
+   def __init__(self, player: Actor):
        self.player = player

    def handle_enemy_turns(self) -> None:
-       for entity in set(self.game_map.entities) - {self.player}:
-           print(f"The {entity.name} wonders when it will get to take a real turn.")
+       for entity in set(self.game_map.actors) - {self.player}:
+           if entity.ai:
+               entity.ai.perform()
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre><span class="crossed-out-text">from game.entity import Entity</span>
<span class="new-text">from game.entity import Actor</span>

class Engine:
    game_map: game.game_map.GameMap

    <span class="crossed-out-text">def __init__(self, player: Entity):</span>
    <span class="new-text">def __init__(self, player: Actor):</span>
        self.player = player

    def handle_enemy_turns(self) -> None:
        <span class="crossed-out-text">for entity in set(self.game_map.entities) - {self.player}:</span>
            <span class="crossed-out-text">print(f"The {entity.name} wonders when it will get to take a real turn.")</span>
        <span class="new-text">for entity in set(self.game_map.actors) - {self.player}:
            if entity.ai:
                entity.ai.perform()</span></pre>
{{</ original-tab >}}
{{</ codetab >}}

Now enemies will use their AI to take real turns - moving toward and attacking the player!

Finally, we need to ensure the player doesn't have AI. Update `main.py`:

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
import copy

import tcod

from game.engine import Engine
-from game.entity import Entity
+import game.entity_factories
from game.input_handlers import BaseEventHandler, MainGameEventHandler
from game.procgen import generate_dungeon
-import game.entity_factories


def main() -> None:
    ...

-   player = Entity(x=0, y=0, char="@", color=(255, 255, 255), name="Player", blocks_movement=True)
+   player = copy.deepcopy(game.entity_factories.player)
+   # The player doesn't need AI
+   player.ai = None
    engine = Engine(player=player)
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>import copy

import tcod

from game.engine import Engine
<span class="crossed-out-text">from game.entity import Entity</span>
<span class="new-text">import game.entity_factories</span>
from game.input_handlers import BaseEventHandler, MainGameEventHandler
from game.procgen import generate_dungeon
<span class="crossed-out-text">import game.entity_factories</span>


def main() -> None:
    ...

    <span class="crossed-out-text">player = Entity(x=0, y=0, char="@", color=(255, 255, 255), name="Player", blocks_movement=True)</span>
    <span class="new-text">player = copy.deepcopy(game.entity_factories.player)
    # The player doesn't need AI
    player.ai = None</span>
    engine = Engine(player=player)</pre>
{{</ original-tab >}}
{{</ codetab >}}

We deepcopy the player template and remove its AI since the player is controlled by keyboard input, not AI.

Run the project and you should now have working combat! Enemies will chase you when they can see you, attack when adjacent, and die when their HP reaches 0. The damage system is simple but effective - you can take on individual enemies easily but groups can be dangerous.

This completes our basic combat system. We have enemies that can pathfind, attack, take damage, and die. In future parts, we'll expand on this foundation with items, equipment, and more sophisticated combat mechanics.

If you want to see the code so far in its entirety, [click
here](https://github.com/jmccardle/tcod_tutorial_v2/tree/part-06).

[Click here to move on to the next part of this
tutorial.](/tutorials/tcod/part-07)