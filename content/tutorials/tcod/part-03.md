---
title: "Part 3 - Generating a dungeon"
date: 2025-08-25
draft: false
---

*Note: This part of the tutorial relies on TCOD version 11.14 or higher. You might need to upgrade the library (and your requirements.txt file, if you're using one).*

Remember how we created a wall in the last part? We won't need that anymore. Additionally, our dungeon generator will start by filling the entire map with "wall" tiles and "carving" out rooms, so we can modify our `GameMap` class in `game/game_map.py` to fill in walls instead of floors.

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
-from game.tiles import floor, wall
+from game.tiles import wall

...

class GameMap:
    def __init__(self, engine: game.engine.Engine, width: int, height: int):
        self.engine = engine
        self.width, self.height = width, height
        self.entities: Set[game.entity.Entity] = set()
-       self.tiles = np.full((width, height), fill_value=floor, order="F")
+       self.tiles = np.full((width, height), fill_value=wall, order="F")

-       # Create a simple test wall
-       self.tiles[30:33, 22] = wall
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre><span class="crossed-out-text">from game.tiles import floor, wall</span>
<span class="new-text">from game.tiles import wall</span>

...

class GameMap:
    def __init__(self, engine: game.engine.Engine, width: int, height: int):
        self.engine = engine
        self.width, self.height = width, height
        self.entities: Set[game.entity.Entity] = set()
        <span class="crossed-out-text">self.tiles = np.full((width, height), fill_value=floor, order="F")</span>
        <span class="new-text">self.tiles = np.full((width, height), fill_value=wall, order="F")</span>

        <span class="crossed-out-text"># Create a simple test wall</span>
        <span class="crossed-out-text">self.tiles[30:33, 22] = wall</span></pre>
{{</ original-tab >}}
{{</ codetab >}}

Now, on to our dungeon generator.

The original version of this tutorial put all of the dungeon generation in the `GameMap` class. In fact, this was my plan for this tutorial as well. But, as HexDecimal (author of the TCOD library) pointed out in a pull request, that's not very extensible. It puts a lot of code in `GameMap` where it doesn't necessarily belong, and the class will grow to huge proportions if you ever decide to add an alternate dungeon generator.

The better approach is to put our new code in a separate file, and utilize `GameMap` there. Let's create a new file in the `game` directory, called `procgen.py`, which will house our procedural generator.

Let's start by creating a class which we'll use to create our rooms. We can call it `RectangularRoom`. In `game/procgen.py`:

```py3
from __future__ import annotations

from typing import TYPE_CHECKING, Tuple

if TYPE_CHECKING:
    pass  # We'll add imports here later


class RectangularRoom:
    def __init__(self, x: int, y: int, width: int, height: int):
        self.x1 = x
        self.y1 = y
        self.x2 = x + width
        self.y2 = y + height

    @property
    def center(self) -> Tuple[int, int]:
        center_x = int((self.x1 + self.x2) / 2)
        center_y = int((self.y1 + self.y2) / 2)

        return center_x, center_y

    @property
    def inner(self) -> Tuple[slice, slice]:
        """Return the inner area of this room as a 2D array index."""
        return slice(self.x1 + 1, self.x2), slice(self.y1 + 1, self.y2)
```


The `__init__` function takes the x and y coordinates of the top left corner, and computes the bottom right corner based on the w and h parameters (width and height).

`center` is a "property", which essentially acts like a read-only variable for our `RectangularRoom` class. It describes the "x" and "y" coordinates of the center of a room. It will be useful later on.

The `inner` property returns two "slices", which represent the inner portion of our room. This is the part that we'll be "digging out" for our room in our dungeon generator. It gives us an easy way to get the area to carve out, which we'll demonstrate soon.

We'll be adding more to this class shortly, but to get us started, that's all we need.

What's with the + 1 on `self.x1` and `self.y1`? Think about what we're saying when we tell our program that we want a room at coordinates (1, 1) that goes to (6, 6). You might assume that would carve out a room like this one (remember that lists are 0-indexed, so (0, 0) is a wall in this case):

```
  0 1 2 3 4 5 6 7
0 # # # # # # # #
1 # . . . . . . #
2 # . . . . . . #
3 # . . . . . . #
4 # . . . . . . #
5 # . . . . . . #
6 # . . . . . . #
7 # # # # # # # #
```

That's all fine and good, but what happens if we put a room right next to it? Let's say this room starts at (7, 1) and goes to (9, 6)

```
  0 1 2 3 4 5 6 7 8 9 10
0 # # # # # # # # # # #
1 # . . . . . . . . . #
2 # . . . . . . . . . #
3 # . . . . . . . . . #
4 # . . . . . . . . . #
5 # . . . . . . . . . #
6 # . . . . . . . . . #
7 # # # # # # # # # # #
```

There's no wall separating the two\! That means that if two rooms are one right next to the other, then there won't be a wall between them\! So long story short, our function needs to take the walls into account when digging out a room. So if we have a rectangle with coordinates x1 = 1, x2 = 6, y1 = 1, and y2 = 6, then the room should actually look like this:

```
  0 1 2 3 4 5 6 7
0 # # # # # # # #
1 # # # # # # # #
2 # # . . . . # #
3 # # . . . . # #
4 # # . . . . # #
5 # # . . . . # #
6 # # # # # # # #
7 # # # # # # # #
```

This ensures that we'll always have at least a one tile wide wall between our rooms, unless we choose to create overlapping rooms. In order to accomplish this, we add + 1 to x1 and y1.

Before we dive into a truly procedurally generated dungeon, let's begin with a simple map that consists of two rooms, connected by a tunnel. We can create a new function to create our dungeon, intuitively named `generate_dungeon`, which will return a `GameMap`. As arguments, it will take the needed width and the height to create the `GameMap`, and it will utilize the `RectangularRoom` class to create the needed rooms. Here's what that looks like:

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
from __future__ import annotations

from typing import TYPE_CHECKING, Tuple

+from game.game_map import GameMap
+from game.tiles import floor

+if TYPE_CHECKING:
+   import game.engine


class RectangularRoom:
    def __init__(self, x: int, y: int, width: int, height: int):
        self.x1 = x
        self.y1 = y
        self.x2 = x + width
        self.y2 = y + height

    @property
    def inner(self) -> Tuple[slice, slice]:
        """Return the inner area of this room as a 2D array index."""
        return slice(self.x1 + 1, self.x2), slice(self.y1 + 1, self.y2)


+def generate_dungeon(
+   map_width: int,
+   map_height: int,
+   engine: game.engine.Engine,
+) -> GameMap:
+   """Generate a new dungeon map."""
+   dungeon = GameMap(engine, map_width, map_height)

+   room_1 = RectangularRoom(x=20, y=15, width=10, height=15)
+   room_2 = RectangularRoom(x=35, y=15, width=10, height=15)

+   dungeon.tiles[room_1.inner] = floor
+   dungeon.tiles[room_2.inner] = floor

+   return dungeon
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>from typing import Tuple

<span class="new-text">from game.game_map import GameMap
from game.tiles import floor

if TYPE_CHECKING:
    import game.engine</span>


class RectangularRoom:
    def __init__(self, x: int, y: int, width: int, height: int):
        self.x1 = x
        self.y1 = y
        self.x2 = x + width
        self.y2 = y + height

    @property
    def inner(self) -> Tuple[slice, slice]:
        """Return the inner area of this room as a 2D array index."""
        return slice(self.x1 + 1, self.x2), slice(self.y1 + 1, self.y2)


<span class="new-text">def generate_dungeon(
    map_width: int,
    map_height: int,
    engine: game.engine.Engine,
) -> GameMap:
    """Generate a new dungeon map."""
    dungeon = GameMap(engine, map_width, map_height)

    room_1 = RectangularRoom(x=20, y=15, width=10, height=15)
    room_2 = RectangularRoom(x=35, y=15, width=10, height=15)

    dungeon.tiles[room_1.inner] = floor
    dungeon.tiles[room_2.inner] = floor

    return dungeon</span></pre>
{{</ original-tab >}}
{{</ codetab >}}

Now we can modify `main.py` to utilize our `generate_dungeon` function. Note that we'll also remove the NPC for now - we'll add proper monster placement in Part 5.

{{< codetab >}} {{< diff-tab >}} {{< highlight diff >}}
#!/usr/bin/env python3
import tcod

from game.engine import Engine
from game.entity import Entity
from game.input_handlers import BaseEventHandler, MainGameEventHandler
+from game.procgen import generate_dungeon
+import game.game_map


def main() -> None:
    ...
    map_width = 80
    map_height = 45

+   room_max_size = 10
+   room_min_size = 6
+   max_rooms = 30

    tileset = tcod.tileset.load_tilesheet("data/dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD)

-   engine = Engine(player=Entity())
-
-   engine.game_map = GameMap(engine, map_width, map_height)
-
-   # Create player and place in map
-   engine.player.place(int(screen_width / 2), int(screen_height / 2), engine.game_map)
-   engine.player.char = "@"
-   engine.player.color = (255, 255, 255)
-
-   # Create an NPC
-   npc = Entity()
-   npc.place(int(screen_width / 2 - 5), int(screen_height / 2), engine.game_map)
-   npc.char = "@"
-   npc.color = (255, 255, 0)
+   player = Entity(x=0, y=0, char="@", color=(255, 255, 255))
+   engine = Engine(player=player)
+
+   engine.game_map = generate_dungeon(
+       max_rooms=max_rooms,
+       room_min_size=room_min_size,
+       room_max_size=room_max_size,
+       map_width=map_width,
+       map_height=map_height,
+       engine=engine,
+   )

    handler: BaseEventHandler = MainGameEventHandler(engine)
    ...
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>#!/usr/bin/env python3
import tcod

from game.engine import Engine
from game.entity import Entity
from game.input_handlers import BaseEventHandler, MainGameEventHandler
<span class="new-text">from game.procgen import generate_dungeon
import game.game_map</span>


def main() -> None:
    ...
    map_width = 80
    map_height = 45

    <span class="new-text">room_max_size = 10
    room_min_size = 6
    max_rooms = 30</span>

    tileset = tcod.tileset.load_tilesheet("data/dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD)

    <span class="crossed-out-text">engine = Engine(player=Entity())</span>
    <span class="crossed-out-text"></span>
    <span class="crossed-out-text">engine.game_map = GameMap(engine, map_width, map_height)</span>
    <span class="crossed-out-text"></span>
    <span class="crossed-out-text"># Create player and place in map</span>
    <span class="crossed-out-text">engine.player.place(int(screen_width / 2), int(screen_height / 2), engine.game_map)</span>
    <span class="crossed-out-text">engine.player.char = "@"</span>
    <span class="crossed-out-text">engine.player.color = (255, 255, 255)</span>
    <span class="crossed-out-text"></span>
    <span class="crossed-out-text"># Create an NPC</span>
    <span class="crossed-out-text">npc = Entity()</span>
    <span class="crossed-out-text">npc.place(int(screen_width / 2 - 5), int(screen_height / 2), engine.game_map)</span>
    <span class="crossed-out-text">npc.char = "@"</span>
    <span class="crossed-out-text">npc.color = (255, 255, 0)</span>
    <span class="new-text">player = Entity(x=0, y=0, char="@", color=(255, 255, 255))
    engine = Engine(player=player)

    engine.game_map = generate_dungeon(
        max_rooms=max_rooms,
        room_min_size=room_min_size,
        room_max_size=room_max_size,
        map_width=map_width,
        map_height=map_height,
        engine=engine,
    )</span>

    handler: BaseEventHandler = MainGameEventHandler(engine)
    ...</pre>
{{</ original-tab >}}
{{</ codetab >}}

Now is a good time to run your code and make sure everything works as expected. The changes we've made puts two sample rooms on the map, with our player in one of them.

![Part 3 - Two Rooms](images/part-3-two-rooms.png)

I'm sure you've noticed already, but the rooms are not connected. What's the use of creating a dungeon if we're stuck in one room? Not to worry, let's write some code to generate tunnels from one room to another. Add the following function to `procgen.py`:

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
from __future__ import annotations

-from typing import TYPE_CHECKING, Tuple
+from typing import TYPE_CHECKING, Iterator, Tuple
+import random

+import tcod

from game.game_map import GameMap
from game.tiles import floor

...

        ...
        return slice(self.x1 + 1, self.x2), slice(self.y1 + 1, self.y2)


+def tunnel_between(
+   start: Tuple[int, int], end: Tuple[int, int]
+) -> Iterator[Tuple[int, int]]:
+   """Return an L-shaped tunnel between these two points."""
+   x1, y1 = start
+   x2, y2 = end
+   if random.random() < 0.5:  # 50% chance.
+       # Move horizontally, then vertically.
+       corner_x, corner_y = x2, y1
+   else:
+       # Move vertically, then horizontally.
+       corner_x, corner_y = x1, y2

+   # Generate the coordinates for this tunnel.
+   for x, y in tcod.los.bresenham((x1, y1), (corner_x, corner_y)).tolist():
+       yield x, y
+   for x, y in tcod.los.bresenham((corner_x, corner_y), (x2, y2)).tolist():
+       yield x, y


def generate_dungeon(map_width, map_height) -> GameMap:
    ...
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>from __future__ import annotations

<span class="crossed-out-text">from typing import TYPE_CHECKING, Tuple</span>
<span class="new-text">from typing import TYPE_CHECKING, Iterator, Tuple
import random</span>

<span class="new-text">import tcod</span>

from game.game_map import GameMap
from game.tiles import floor

...

        ...
        return slice(self.x1 + 1, self.x2), slice(self.y1 + 1, self.y2)


<span class="new-text">def tunnel_between(
    start: Tuple[int, int], end: Tuple[int, int]
) -> Iterator[Tuple[int, int]]:
    """Return an L-shaped tunnel between these two points."""
    x1, y1 = start
    x2, y2 = end
    if random.random() < 0.5:  # 50% chance.
        # Move horizontally, then vertically.
        corner_x, corner_y = x2, y1
    else:
        # Move vertically, then horizontally.
        corner_x, corner_y = x1, y2

    # Generate the coordinates for this tunnel.
    for x, y in tcod.los.bresenham((x1, y1), (corner_x, corner_y)).tolist():
        yield x, y
    for x, y in tcod.los.bresenham((corner_x, corner_y), (x2, y2)).tolist():
        yield x, y</span>


def generate_dungeon(map_width, map_height) -> GameMap:
    ...</pre>
{{</ original-tab >}}
{{</ codetab >}}

Let's dive into this method.

```py3
def tunnel_between(
    start: Tuple[int, int], end: Tuple[int, int]
) -> Iterator[Tuple[int, int]]:
```

The function takes two arguments, both Tuples consisting of two integers. It should return an Iterator of a Tuple of two ints. All the Tuples will be "x" and "y" coordinates on the map.

```py3
    """Return an L-shaped tunnel between these two points."""
    x1, y1 = start
    x2, y2 = end
```

We grab the coordinates out of the Tuples. Simple enough.

```py3
    if random.random() < 0.5:  # 50% chance.
        # Move horizontally, then vertically.
        corner_x, corner_y = x2, y1
    else:
        # Move vertically, then horizontally.
        corner_x, corner_y = x1, y2
```

We're randomly picking between two options: Moving horizontally, then vertically, or the opposite. Based on what's chosen, we'll set the `corner_x` and `corner_y` values to different points.

```py3
    # Generate the coordinates for this tunnel.
    for x, y in tcod.los.bresenham((x1, y1), (corner_x, corner_y)).tolist():
        yield x, y
    for x, y in tcod.los.bresenham((corner_x, corner_y), (x2, y2)).tolist():
        yield x, y
```

This part is where the "magic" happens.

tcod includes a function in its line-of-sight module to draw [Bresenham lines](https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm). While we're not working with line-of-sight in this case, the function still proves useful to get a line from one point to another. In this case, we get one line, then another, to create an "L" shaped tunnel. `.tolist()` converts the points in the line into, as you might have already guessed, a list.

What's with the `yield` lines though? [Yield expressions](https://docs.python.org/3.5/reference/expressions.html#yield-expressions) are an interesting part of Python, which allows you to return a "generator". Essentially, rather than returning the values and exiting the function altogether, we return the values, but keep the local state. This allows the function to pick up where it left off when called again, instead of starting from the beginning, as most functions do.

Why is this helpful? In the next section, we're going to iterate the `x` and `y` values that we receive from the `tunnel_between` function to dig out our tunnel.

Let's put this code to use by drawing a tunnel between our two rooms.

{{< codetab >}} {{< diff-tab >}} {{< highlight diff >}}
    ...
    dungeon.tiles[room_2.inner] = floor

+   for x, y in tunnel_between(room_2.center, room_1.center):
+       dungeon.tiles[x, y] = floor

    return dungeon
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>    ...
    dungeon.tiles[room_2.inner] = floor

    <span class="new-text">for x, y in tunnel_between(room_2.center, room_1.center):
        dungeon.tiles[x, y] = floor</span>

    return dungeon</pre>
{{</ original-tab >}}
{{</ codetab >}}

Run the project, and you'll see a horizontal tunnel that connects the two rooms. It's starting to come together!

![Part 3 - Two Rooms](images/part-3-two-rooms-connected.png)

Now that we've demonstrated to ourselves that our room and tunnel functions work as intended, it's time to move on to an actual dungeon generation algorithm. Ours will be fairly simple; we'll place rooms one at a time, making sure they don't overlap, and connect them with tunnels.

We'll want a method that tells us if our room is intersecting with another room. Enter the following into the `RectangularRoom` class:

{{< codetab >}} {{< diff-tab >}} {{< highlight diff >}}
+from __future__ import annotations

import random
from typing import Iterator, Tuple

import tcod

from game_map import GameMap
import tile_types


class RectangularRoom:
    def __init__(self, x: int, y: int, width: int, height: int):
        self.x1 = x
        self.y1 = y
        self.x2 = x + width
        self.y2 = y + height

    @property
    def center(self) -> Tuple[int, int]:
        center_x = int((self.x1 + self.x2) / 2)
        center_y = int((self.y1 + self.y2) / 2)

        return center_x, center_y

    @property
    def inner(self) -> Tuple[slice, slice]:
        """Return the inner area of this room as a 2D array index."""
        return slice(self.x1 + 1, self.x2), slice(self.y1 + 1, self.y2)

+   def intersects(self, other: RectangularRoom) -> bool:
+       """Return True if this room overlaps with another RectangularRoom."""
+       return (
+           self.x1 <= other.x2
+           and self.x2 >= other.x1
+           and self.y1 <= other.y2
+           and self.y2 >= other.y1
+       )


def tunnel_between(
    ...
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre><span class="new-text">from __future__ import annotations</span>

import random
from typing import Iterator, Tuple

import tcod

from game_map import GameMap
import tile_types


class RectangularRoom:
    def __init__(self, x: int, y: int, width: int, height: int):
        self.x1 = x
        self.y1 = y
        self.x2 = x + width
        self.y2 = y + height

    @property
    def center(self) -> Tuple[int, int]:
        center_x = int((self.x1 + self.x2) / 2)
        center_y = int((self.y1 + self.y2) / 2)

        return center_x, center_y

    @property
    def inner(self) -> Tuple[slice, slice]:
        """Return the inner area of this room as a 2D array index."""
        return slice(self.x1 + 1, self.x2), slice(self.y1 + 1, self.y2)

    <span class="new-text">def intersects(self, other: RectangularRoom) -> bool:
        """Return True if this room overlaps with another RectangularRoom."""
        return (
            self.x1 <= other.x2
            and self.x2 >= other.x1
            and self.y1 <= other.y2
            and self.y2 >= other.y1
        )</span>


def tunnel_between(
    ...</pre>
{{</ original-tab >}}
{{</ codetab >}}

`intersects` checks if the room and another room (`other` in the arguments) intersect or not. It returns `True` if the do, `False` if they don't. We'll use this to determine if two rooms are overlapping or not.

We're going to need a few variables to set the maximum and minimum size of the rooms, along with the maximum number of rooms one floor can have. We already added these to `main.py` in our earlier changes:

```py3
    room_max_size = 10
    room_min_size = 6
    max_rooms = 30
```

At long last, it's time to modify `generate_dungeon` to, well, generate our dungeon\! You can completely remove our old implementation and replace it with the following:

{{< codetab >}} {{< diff-tab >}} {{< highlight diff >}}
from __future__ import annotations

-from typing import TYPE_CHECKING, Iterator, Tuple
+from typing import TYPE_CHECKING, Iterator, List, Tuple
import random

import tcod

from game.game_map import GameMap
from game.tiles import floor

if TYPE_CHECKING:
    import game.engine

...

-def generate_dungeon(
-   map_width: int,
-   map_height: int,
-   engine: game.engine.Engine,
-) -> GameMap:
-   """Generate a new dungeon map."""
-   dungeon = GameMap(engine, map_width, map_height)

-   room_1 = RectangularRoom(x=20, y=15, width=10, height=15)
-   room_2 = RectangularRoom(x=35, y=15, width=10, height=15)

-   dungeon.tiles[room_1.inner] = floor
-   dungeon.tiles[room_2.inner] = floor

-   for x, y in tunnel_between(room_2.center, room_1.center):
-       dungeon.tiles[x, y] = floor

-   return dungeon


+def generate_dungeon(
+   max_rooms: int,
+   room_min_size: int,
+   room_max_size: int,
+   map_width: int,
+   map_height: int,
+   engine: game.engine.Engine,
+) -> game.game_map.GameMap:
+   """Generate a new dungeon map."""
+   player = engine.player
+   dungeon = GameMap(engine, map_width, map_height)

+   rooms: List[RectangularRoom] = []

+   for _ in range(max_rooms):
+       room_width = random.randint(room_min_size, room_max_size)
+       room_height = random.randint(room_min_size, room_max_size)

+       x = random.randint(0, dungeon.width - room_width - 1)
+       y = random.randint(0, dungeon.height - room_height - 1)

+       # "RectangularRoom" class makes rectangles easier to work with
+       new_room = RectangularRoom(x, y, room_width, room_height)

+       # Run through the other rooms and see if they intersect with this one.
+       if any(new_room.intersects(other_room) for other_room in rooms):
+           continue  # This room intersects, so go to the next attempt.
+       # If there are no intersections then the room is valid.

+       # Dig out this rooms inner area.
+       dungeon.tiles[new_room.inner] = floor

+       if len(rooms) == 0:
+           # The first room, where the player starts.
+           player.place(*new_room.center, dungeon)
+       else:  # All rooms after the first.
+           # Dig out a tunnel between this room and the previous one.
+           for x, y in tunnel_between(rooms[-1].center, new_room.center):
+               dungeon.tiles[x, y] = floor

+       # Finally, append the new room to the list.
+       rooms.append(new_room)

+   return dungeon
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>from __future__ import annotations

<span class="crossed-out-text">from typing import TYPE_CHECKING, Iterator, Tuple</span>
<span class="new-text">from typing import TYPE_CHECKING, Iterator, List, Tuple
import random</span>

import tcod

from game.game_map import GameMap
from game.tiles import floor

if TYPE_CHECKING:
    import game.engine</span>

...

<span class="crossed-out-text">def generate_dungeon(</span>
    <span class="crossed-out-text">map_width: int,</span>
    <span class="crossed-out-text">map_height: int,</span>
    <span class="crossed-out-text">engine: game.engine.Engine,</span>
<span class="crossed-out-text">) -> GameMap:</span>
    <span class="crossed-out-text">"""Generate a new dungeon map."""</span>
    <span class="crossed-out-text">dungeon = GameMap(engine, map_width, map_height)</span>

    <span class="crossed-out-text">room_1 = RectangularRoom(x=20, y=15, width=10, height=15)</span>
    <span class="crossed-out-text">room_2 = RectangularRoom(x=35, y=15, width=10, height=15)</span>

    <span class="crossed-out-text">dungeon.tiles[room_1.inner] = floor</span>
    <span class="crossed-out-text">dungeon.tiles[room_2.inner] = floor</span>

    <span class="crossed-out-text">for x, y in tunnel_between(room_2.center, room_1.center):</span>
        <span class="crossed-out-text">dungeon.tiles[x, y] = floor</span>

    <span class="crossed-out-text">return dungeon</span>


<span class="new-text">def generate_dungeon(
    max_rooms: int,
    room_min_size: int,
    room_max_size: int,
    map_width: int,
    map_height: int,
    engine: game.engine.Engine,
) -> game.game_map.GameMap:
    """Generate a new dungeon map."""
    player = engine.player
    dungeon = GameMap(engine, map_width, map_height)

    rooms: List[RectangularRoom] = []

    for _ in range(max_rooms):
        room_width = random.randint(room_min_size, room_max_size)
        room_height = random.randint(room_min_size, room_max_size)

        x = random.randint(0, dungeon.width - room_width - 1)
        y = random.randint(0, dungeon.height - room_height - 1)

        # "RectangularRoom" class makes rectangles easier to work with
        new_room = RectangularRoom(x, y, room_width, room_height)

        # Run through the other rooms and see if they intersect with this one.
        if any(new_room.intersects(other_room) for other_room in rooms):
            continue  # This room intersects, so go to the next attempt.
        # If there are no intersections then the room is valid.

        # Dig out this rooms inner area.
        dungeon.tiles[new_room.inner] = floor

        if len(rooms) == 0:
            # The first room, where the player starts.
            player.place(*new_room.center, dungeon)
        else:  # All rooms after the first.
            # Dig out a tunnel between this room and the previous one.
            for x, y in tunnel_between(rooms[-1].center, new_room.center):
                dungeon.tiles[x, y] = floor

        # Finally, append the new room to the list.
        rooms.append(new_room)

    return dungeon</span></pre>
{{</ original-tab >}}
{{</ codetab >}}

That's quite a lengthy function! Let's break it down and figure out what's doing what.

```py3
def generate_dungeon(
    max_rooms: int,
    room_min_size: int,
    room_max_size: int,
    map_width: int,
    map_height: int,
    player: Entity,
) -> GameMap:
```

This is the function definition itself. We pass several arguments to it.

* `max_rooms`: The maximum number of rooms allowed in the dungeon. We'll use this to control our iteration.
* `room_min_size`: The minimum size of one room.
* `room_max_size`: The maximum size of one room. We'll pick a random size between this and `room_min_size` for both the width and the height of one room to carve out.
* `map_width` and `map_height`: The width and height of the `GameMap` to create. This is no different than it was before.
* `player`: The player Entity. We need this to know where to place the player.

```py3
    """Generate a new dungeon map."""
    dungeon = GameMap(map_width, map_height)
```

This isn't anything new, we're just creating the initial `GameMap`.

```py3
    rooms: List[RectangularRoom] = []
```

We'll keep a running list of all the rooms.

```py3
    for r in range(max_rooms):
```

We iterate from 0 to `max_rooms` - 1. Our algorithm may or may not place a room depending on if it intersects with another, so we won't know how many rooms we're going to end up with. But at least we'll know that number can't exceed a certain amount.

```py3
        room_width = random.randint(room_min_size, room_max_size)
        room_height = random.randint(room_min_size, room_max_size)

        x = random.randint(0, dungeon.width - room_width - 1)
        y = random.randint(0, dungeon.height - room_height - 1)

        # "RectangularRoom" class makes rectangles easier to work with
        new_room = RectangularRoom(x, y, room_width, room_height)
```

Here, we use the given minimum and maximum room sizes to set the room's width and height. We then get a random pair of `x` and `y` coordinates to try and place the room down. The coordinates must be between 0 and the map's width and heights.

We use these variables to then create an instance of our `RectangularRoom`.

```py3
        # Run through the other rooms and see if they intersect with this one.
        if any(new_room.intersects(other_room) for other_room in rooms):
            continue  # This room intersects, so go to the next attempt.
```

So what happens if a room *does* intersect with another? In that case, we can just toss it out, by using `continue` to skip the rest of the loop. Obviously there are more elegant ways of dealing with a collision, but for our simplistic algorithm, we'll just pretend like it didn't happen and try the next one.

```py3
        # If there are no intersections then the room is valid.

        # Dig out this rooms inner area.
        dungeon.tiles[new_room.inner] = floor
```

Here, we "dig" the room out. This is similar to what we were doing before to dig out the two connected rooms.

```py3
        if len(rooms) == 0:
            # The first room, where the player starts.
            player.x, player.y = new_room.center
```

We put our player down in the center of the first room we created. If this room isn't the first, we move on to the `else` statement:

```py3
        else:  # All rooms after the first.
            # Dig out a tunnel between this room and the previous one.
            for x, y in tunnel_between(rooms[-1].center, new_room.center):
                dungeon.tiles[x, y] = floor
```

This is similar to how we dug the tunnel before, except this time, we're using a negative index with `rooms` to grab the previous room, and connecting the new room to it.

```py3
        # Finally, append the new room to the list.
        rooms.append(new_room)
```

Regardless if it's the first room or not, we want to append it to the list, so the next iteration can use it.

So that's our `generate_dungeon` function. We already showed the updated `main.py` call earlier, where we pass all the required parameters including the engine instead of the player.

And that's it\! There's our functioning, albeit basic, dungeon generation algorithm. Run the project now and you should be placed in a procedurally generated dungeon\!

![Part 3 - Generated Dungeon](images/part-3-dungeon.png)

*Note: Your dungeon will look different from this one, so don't worry if it doesn't match the screenshot.*

If you want to see the code so far in its entirety, [click
here](https://github.com/jmccardle/tcod_tutorial_v2/tree/part-03).

[Click here to move on to the next part of this
tutorial.](/tutorials/tcod/part-04)
