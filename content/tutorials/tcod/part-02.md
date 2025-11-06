---
title: "Part 2 - The generic Entity, the render functions, and the map"
date: 2020-06-23
draft: false
---

Now that we can move our little '@' symbol around, we need to give it
something to move around *in*. We already have our `Entity` class from Part 1,
but we need to enhance it to work with a proper game map.

First, let's update our `Entity` class to support being placed on a map and
interacting with other entities. Update `game/entity.py`:

{{< highlight py3 >}}
from __future__ import annotations

from typing import TYPE_CHECKING, Optional, Tuple

if TYPE_CHECKING:
    import game.game_map


class Entity:
    """
    A generic object to represent players, enemies, items, etc.
    """

    gamemap: game.game_map.GameMap

    def __init__(
        self,
        gamemap: Optional[game.game_map.GameMap] = None,
        x: int = 0,
        y: int = 0,
        char: str = "?",
        color: Tuple[int, int, int] = (255, 255, 255),
    ):
        self.x = x
        self.y = y
        self.char = char
        self.color = color
        if gamemap:
            # If gamemap isn't provided now then it will be set later.
            self.gamemap = gamemap
            gamemap.entities.add(self)

    def place(self, x: int, y: int, gamemap: Optional[game.game_map.GameMap] = None) -> None:
        """Place this entity at a new location. Handles moving across GameMaps."""
        self.x = x
        self.y = y
        if gamemap:
            if hasattr(self, "gamemap"):  # Possibly uninitialized.
                self.gamemap.entities.remove(self)
            self.gamemap = gamemap
            gamemap.entities.add(self)

    def move(self, dx: int, dy: int) -> None:
        # Move the entity by a given amount
        self.x += dx
        self.y += dy
{{</ highlight >}}

The key changes to our `Entity` class:
* **Optional GameMap reference**: Entities can now be associated with a `GameMap`, and the map tracks all entities on it.
* **Default parameters**: All parameters are now optional with sensible defaults, making entity creation more flexible.
* **Place method**: A new method that properly handles placing an entity on a map, including removing it from any previous map.

This bidirectional relationship between entities and the map will be essential for checking collisions, rendering, and game logic.

Now let's update our `main.py` to create entities using this enhanced approach:

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
#!/usr/bin/env python3
import tcod

from game.engine import Engine
from game.entity import Entity
+from game.game_map import GameMap
from game.input_handlers import BaseEventHandler, MainGameEventHandler


def main() -> None:
    screen_width = 80
    screen_height = 50

+   map_width = 80
+   map_height = 45

    tileset = tcod.tileset.load_tilesheet("data/dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD)

-   player = Entity(x=int(screen_width / 2), y=int(screen_height / 2), char="@", color=(255, 255, 255))
-
-   engine = Engine(player=player)
+   engine = Engine(player=Entity())
+
+   engine.game_map = GameMap(engine, map_width, map_height)
+
+   # Create player and place in map
+   engine.player.place(int(screen_width / 2), int(screen_height / 2), engine.game_map)
+   engine.player.char = "@"
+   engine.player.color = (255, 255, 255)
+
+   # Create an NPC
+   npc = Entity()
+   npc.place(int(screen_width / 2 - 5), int(screen_height / 2), engine.game_map)
+   npc.char = "@"
+   npc.color = (255, 255, 0)

    handler: BaseEventHandler = MainGameEventHandler(engine)
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>#!/usr/bin/env python3
import tcod

from game.engine import Engine
from game.entity import Entity
<span class="new-text">from game.game_map import GameMap</span>
from game.input_handlers import BaseEventHandler, MainGameEventHandler


def main() -> None:
    screen_width = 80
    screen_height = 50

    <span class="new-text">map_width = 80
    map_height = 45</span>

    tileset = tcod.tileset.load_tilesheet("data/dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD)

    <span class="crossed-out-text">player = Entity(x=int(screen_width / 2), y=int(screen_height / 2), char="@", color=(255, 255, 255))</span>
    <span class="crossed-out-text"></span>
    <span class="crossed-out-text">engine = Engine(player=player)</span>
    <span class="new-text">engine = Engine(player=Entity())

    engine.game_map = GameMap(engine, map_width, map_height)

    # Create player and place in map
    engine.player.place(int(screen_width / 2), int(screen_height / 2), engine.game_map)
    engine.player.char = "@"
    engine.player.color = (255, 255, 255)

    # Create an NPC
    npc = Entity()
    npc.place(int(screen_width / 2 - 5), int(screen_height / 2), engine.game_map)
    npc.char = "@"
    npc.color = (255, 255, 0)</span>

    handler: BaseEventHandler = MainGameEventHandler(engine)</pre>
{{</ original-tab >}}
{{</ codetab >}}

We're creating the engine first with a basic entity as the player, then creating our GameMap (which we'll define shortly). We use the `place` method to position entities on the map, which automatically registers them with the map's entity tracking. Notice how we can set the entity properties after creation - this flexible approach will be useful when we generate entities procedurally.

Before we can run this, we need to create our `GameMap` class. But first, let's update our `Engine` class from Part 1 to work with the game map. Update `game/engine.py`:


```py3
from __future__ import annotations

from typing import TYPE_CHECKING

import tcod

from game.entity import Entity

if TYPE_CHECKING:
    import game.game_map


class Engine:
    game_map: game.game_map.GameMap

    def __init__(self, player: Entity):
        self.player = player

    def render(self, console: tcod.console.Console) -> None:
        self.game_map.render(console)
```

Our updated `Engine` is much simpler - it just holds the player reference and delegates rendering to the game map. The `game_map` attribute is declared but not set in `__init__` - we'll set it right after creating the engine, as you saw in the main.py changes above. This pattern gives us flexibility in how we initialize our game state.

Now we need to update our actions to work with this new structure. The actions need to get the engine through the entity-gamemap relationship. Update `game/actions.py`:

```py3
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import game.engine
    import game.entity


class Action:
    def __init__(self, entity: game.entity.Entity) -> None:
        super().__init__()
        self.entity = entity

    @property
    def engine(self) -> game.engine.Engine:
        """Return the engine this action belongs to."""
        return self.entity.gamemap.engine

    def perform(self) -> None:
        """Perform this action with the objects needed to determine its scope.

        `self.engine` is the scope this action is being performed in.

        `self.entity` is the object performing the action.

        This method must be overridden by Action subclasses.
        """
        raise NotImplementedError()


class EscapeAction(Action):
    def perform(self) -> None:
        raise SystemExit()


class ActionWithDirection(Action):
    def __init__(self, entity: game.entity.Entity, dx: int, dy: int):
        super().__init__(entity)

        self.dx = dx
        self.dy = dy

    def perform(self) -> None:
        raise NotImplementedError()


class MovementAction(ActionWithDirection):
    def perform(self) -> None:
        dest_x = self.entity.x + self.dx
        dest_y = self.entity.y + self.dy

        if not self.engine.game_map.in_bounds(dest_x, dest_y):
            return  # Destination is out of bounds.
        if not self.engine.game_map.tiles["walkable"][dest_x, dest_y]:
            return  # Destination is blocked by a tile.
        if self.engine.game_map.get_blocking_entity_at_location(dest_x, dest_y):
            return  # Destination is blocked by an entity.

        self.entity.move(self.dx, self.dy)
```

Notice how actions now:
- Get the engine through `self.entity.gamemap.engine` - this chain of references keeps everything connected
- Check for blocking entities in addition to walkable tiles
- Use `perform()` without parameters - the action has everything it needs through its entity reference

With our entities and actions ready, let's create the map system. We need to define tiles first, then the game map itself.

We can represent the map with a new class, called `GameMap`. The map itself will be made up of tiles, which will contain certain data about if the tile is "walkable" (True if it's a floor, False if its a wall), "transparency" (again, True for floors, False for walls), and how to render the tile to the screen.

We'll create the `tiles` first. Create a new file called `game/tiles.py` and fill it with the following contents:

```py3
from typing import Tuple

from numpy.typing import NDArray
import numpy as np

# Tile graphics structured type compatible with Console.tiles_rgb.
graphic_dt = np.dtype(
    [
        ("ch", np.int32),  # Unicode codepoint.
        ("fg", "3B"),  # 3 unsigned bytes, for RGB colors.
        ("bg", "3B"),
    ]
)

# Tile struct used for statically defined tile data.
tile_dt = np.dtype(
    [
        ("walkable", bool),  # True if this tile can be walked over.
        ("transparent", bool),  # True if this tile doesn't block FOV.
        ("dark", graphic_dt),  # Graphics for when this tile is not in FOV.
        ("light", graphic_dt),  # Graphics for when the tile is in FOV.
    ]
)


def new_tile(
    *,  # Enforce the use of keywords, so that parameter order doesn't matter.
    walkable: int,
    transparent: int,
    dark: Tuple[int, Tuple[int, int, int], Tuple[int, int, int]],
    light: Tuple[int, Tuple[int, int, int], Tuple[int, int, int]],
) -> NDArray[np.void]:
    """Helper function for defining individual tile types"""
    return np.array((walkable, transparent, dark, light), dtype=tile_dt)


# SHROUD represents unexplored, unseen tiles
SHROUD = np.array((ord(" "), (255, 255, 255), (0, 0, 0)), dtype=graphic_dt)

floor = new_tile(
    walkable=True,
    transparent=True,
    dark=(ord(" "), (255, 255, 255), (50, 50, 150)),
    light=(ord(" "), (255, 255, 255), (200, 180, 50)),
)
wall = new_tile(
    walkable=False,
    transparent=False,
    dark=(ord(" "), (255, 255, 255), (0, 0, 100)),
    light=(ord(" "), (255, 255, 255), (130, 110, 50)),
)
```

That's quite a lot to take in all at once. Let's go through it.

```py3
# Tile graphics structured type compatible with Console.tiles_rgb.
graphic_dt = np.dtype(
    [
        ("ch", np.int32),  # Unicode codepoint.
        ("fg", "3B"),  # 3 unsigned bytes, for RGB colors.
        ("bg", "3B"),
    ]
)
```

`dtype` creates a data type which Numpy can use, which behaves similarly to a `struct` in a language like C. Our data type is made up of three parts:

* `ch`: The character, represented in integer format. We'll translate it from the integer into Unicode.
* `fg`: The foreground color. "3B" means 3 unsigned bytes, which can be used for RGB color codes.
* `bg`: The background color. Similar to `fg`.

We take this new data type and use it in the next bit:

```py3
# Tile struct used for statically defined tile data.
tile_dt = np.dtype(
    [
        ("walkable", bool),  # True if this tile can be walked over.
        ("transparent", bool),  # True if this tile doesn't block FOV.
        ("dark", graphic_dt),  # Graphics for when this tile is not in FOV.
        ("light", graphic_dt),  # Graphics for when the tile is in FOV.
    ]
)
```

This is yet another `dtype`, which we'll use in the actual tile itself. It's made up of four parts:

* `walkable`: A boolean that describes if the player can walk across this tile.
* `transparent`: A boolean that describes if this tile does or does not block the field of view. Not used in this chapter, but will be in chapter 4.
* `dark`: This uses our previously defined `dtype`, which holds the character to print, the foreground color, and the background color. It represents tiles that are not in the current field of view.
* `light`: Similar to `dark`, but for tiles that ARE in the field of view. We're defining both now so we don't have to refactor this later. For now, we'll just use `light` for all rendering.

```py3
def new_tile(
    *,  # Enforce the use of keywords, so that parameter order doesn't matter.
    walkable: int,
    transparent: int,
    dark: Tuple[int, Tuple[int, int, int], Tuple[int, int, int]],
    light: Tuple[int, Tuple[int, int, int], Tuple[int, int, int]],
) -> NDArray[np.void]:
    """Helper function for defining individual tile types"""
    return np.array((walkable, transparent, dark, light), dtype=tile_dt)
```

This is a helper function, that we'll use in the next section to define our tile types. It takes the parameters `walkable`, `transparent`, `dark`, and `light`, which should look familiar, since they're the same data points we used in `tile_dt`. It creates a Numpy array of just the one `tile_dt` element, and returns it.

```py3
floor = new_tile(
    walkable=True,
    transparent=True,
    dark=(ord(" "), (255, 255, 255), (50, 50, 150)),
    light=(ord(" "), (255, 255, 255), (200, 180, 50)),
)
wall = new_tile(
    walkable=False,
    transparent=False,
    dark=(ord(" "), (255, 255, 255), (0, 0, 100)),
    light=(ord(" "), (255, 255, 255), (130, 110, 50)),
)
```

Finally, we arrive to our actual tile types. We've got two: `floor` and `wall`.

`floor` is both `walkable` and `transparent`. Its `dark` and `light` attributes define how it looks out of and in the field of view respectively. The `light` version has a warmer, yellow-ish tone to show it's visible.

`wall` is neither `walkable` nor `transparent`, with different colors for its `dark` and `light` states. We also define `SHROUD` for completely unexplored areas, though we won't use it until Part 4.

Now let's use our newly created tiles by creating our map class. Create a file called `game/game_map.py` and fill it with the following:

```py3
from __future__ import annotations

from typing import TYPE_CHECKING, Optional, Set

import numpy as np
import tcod

from game.tiles import floor, wall

if TYPE_CHECKING:
    import game.engine
    import game.entity


class GameMap:
    def __init__(self, engine: game.engine.Engine, width: int, height: int):
        self.engine = engine
        self.width, self.height = width, height
        self.entities: Set[game.entity.Entity] = set()
        self.tiles = np.full((width, height), fill_value=floor, order="F")

        # Create a simple test wall
        self.tiles[30:33, 22] = wall

    def get_blocking_entity_at_location(
        self,
        location_x: int,
        location_y: int,
    ) -> Optional[game.entity.Entity]:
        for entity in self.entities:
            if entity.x == location_x and entity.y == location_y:
                return entity

        return None

    def in_bounds(self, x: int, y: int) -> bool:
        """Return True if x and y are inside of the bounds of this map."""
        return 0 <= x < self.width and 0 <= y < self.height

    def render(self, console: tcod.console.Console) -> None:
        """
        Renders the map.

        For now, we'll render all tiles as visible.
        In Part 4 we'll add FOV.
        """
        console.rgb[0 : self.width, 0 : self.height] = self.tiles["light"]

        for entity in self.entities:
            console.print(x=entity.x, y=entity.y, string=entity.char, fg=entity.color)
```

Let's break down `GameMap` a bit:

```py3
    def __init__(self, engine: game.engine.Engine, width: int, height: int):
        self.engine = engine
        self.width, self.height = width, height
        self.entities: Set[game.entity.Entity] = set()
        self.tiles = np.full((width, height), fill_value=floor, order="F")

        self.tiles[30:33, 22] = wall
```

The initializer takes an `engine` reference (creating that bidirectional relationship), plus `width` and `height` integers.

The `self.entities` set tracks all entities on this map - when entities are placed using their `place()` method, they're automatically added here.

The `self.tiles` line creates a 2D array filled with `floor` tiles. The `order="F"` ensures column-major order, matching how we index with [x, y].

`self.tiles[30:33, 22] = wall` creates a small test wall. We'll remove this when we add proper dungeon generation in the next part.

```py3
    def get_blocking_entity_at_location(
        self,
        location_x: int,
        location_y: int,
    ) -> Optional[game.entity.Entity]:
        for entity in self.entities:
            if entity.x == location_x and entity.y == location_y:
                return entity
        return None
```

This method checks if any entity is blocking a given location. We'll use this in movement actions to prevent entities from walking through each other.

```py3
    def render(self, console: tcod.console.Console) -> None:
        console.rgb[0 : self.width, 0 : self.height] = self.tiles["light"]
        
        for entity in self.entities:
            console.print(x=entity.x, y=entity.y, string=entity.char, fg=entity.color)
```

The render method does two things:
1. Uses `console.rgb` to quickly render all tiles at once (much faster than printing each individually)
2. Draws all entities on top of the tiles

Note we're using `tiles["light"]` for now - in Part 4 we'll differentiate between visible and non-visible tiles.

With our `GameMap` class ready to go, our main.py already sets it up properly. The flow is:
1. Create the engine with just the player
2. Create the GameMap with a reference to the engine
3. Use the `place()` method to position entities on the map

This creates the bidirectional relationships we need - the engine knows about the map, the map knows about the engine, and entities know which map they're on.

Also, we need to update our input handler to call `perform()` without parameters. In `game/input_handlers.py`, find the `handle_action` method and update it:

```py3
    def handle_action(self, action: Optional[Action]) -> bool:
        """Handle actions returned from event methods.

        Returns True if the action will advance a turn.
        """
        if action is None:
            return False

        action.perform()  # No longer passing self.engine
        return True
```

If you run the project now, it should look like this:

![Part 2 - Both Entities and Map](images/part-2-entities-and-map.png)

The darker squares represent the wall, which, if you try to move your character through, should prove to be impenetrable. The player can't move through the NPC either - our collision detection is working!

The key architectural decisions we've made:
- **Bidirectional relationships**: Entities know their map, maps know their engine
- **Actions are self-contained**: Each action knows how to perform itself given its entity
- **Collision detection**: Movement checks for walls AND other entities
- **Flexible entity creation**: Entities can be created with defaults and configured later

With that, Part 2 is now complete! We've enhanced our entity system to work with maps, created a tile-based map system, and laid the groundwork for generating dungeons and moving through them, which, as it happens, is what the next part is all about.

If you want to see the code so far in its entirety, [click
here](https://github.com/jmccardle/tcod_tutorial_v2/tree/part-02).

[Click here to move on to the next part of this tutorial.](/tutorials/tcod/part-03)
