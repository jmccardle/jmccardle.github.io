---
title: "Part 1 - Drawing the '@' symbol and moving it around"
date: 2020-06-14T11:35:26-07:00
draft: false
---


Welcome to part 1 of this tutorial! This series will help you create your very first roguelike game, written in Python\!

This tutorial is largely based off the [one found on Roguebasin](http://www.roguebasin.com/index.php?title=Complete_Roguelike_Tutorial,_using_python%2Blibtcod). Many of the design decisions were mainly to keep this tutorial in lockstep
with that one (at least in terms of chapter composition and general direction). This tutorial would not have been possible without the guidance of those who wrote that tutorial, along with all the wonderful contributors to tcod and python-tcod over the years.

This part assumes that you have either checked [Part 0](/tutorials/tcod/part-0) and are already set up and ready to go. If not, be sure to check that page, and make sure that you've got Python and TCOD installed, and a file called `main.py` created in the directory that you want to work in.

Assuming that you've done all that, let's get started. Modify (or create, if you haven't already) the file `main.py` to look like this:

{{< highlight py3 >}}
#!/usr/bin/env python3
import tcod


def main():
    print("Hello World!")


if __name__ == "__main__":
    main()
{{</ highlight >}}

You can run the program like any other Python program, but for those who are brand new, you do that by typing `python main.py` in the terminal. If you have both Python 2 and 3 installed on your machine, you might have to use `python3 main.py` to run (it depends on your default python, and whether you're using a virtualenv or not).

Alternatively, because of the first line, `#!usr/bin/env python`, you can run the program by typing `./main.py`, assuming you've either activated your virtual environment, or installed tcod on your base Python installation. This line is called a "shebang".

Okay, not the most exciting program in the world, I admit, but we've already got our first major difference from the other tutorial. Namely, this funky looking thing here:

{{< highlight py3 >}}
if __name__ == "__main__":
    main()
{{< /highlight >}}

So what does that do? Basically, we're saying that we're only going to run the "main" function when we explicitly run the script, using `python main.py`. It's not super important that you understand this now, but if you want a more detailed explanation, [this answer on Stack Overflow](https://stackoverflow.com/a/419185) gives a pretty good overview.

Confirm that the above program runs (if not, there's probably an issue with your tcod setup). Once that's done, we can move on to bigger and better things. The first major step to creating any roguelike is getting an '@' character on the screen and moving, so let's get started with that.

Modify `main.py` to look like this:

{{< highlight py3 >}}
#!/usr/bin/env python3
import tcod


def main() -> None:
    screen_width = 80
    screen_height = 50

    tileset = tcod.tileset.load_tilesheet(
        "dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD
    )

    with tcod.context.new_terminal(
        screen_width,
        screen_height,
        tileset=tileset,
        title="Yet Another Roguelike Tutorial",
        vsync=True,
    ) as context:
        root_console = tcod.Console(screen_width, screen_height, order="F")
        while True:
            root_console.print(x=1, y=1, string="@")

            context.present(root_console)

            for event in tcod.event.wait():
                if event.type == "QUIT":
                    raise SystemExit()


if __name__ == "__main__":
    main()
{{</ highlight >}}

Run `main.py` again, and you should see an '@' symbol on the screen. Once you've fully soaked in the glory on the screen in front of you, you can click the "X" in the top-left corner of the program to close it.

There's a lot going on here, so let's break it down line by line.

{{< highlight py3 >}}
    screen_width = 80
    screen_height = 50
{{</ highlight >}}

This is simple enough. We're defining some variables for the screen size.

Eventually, we'll load these values from a JSON file rather than hard coding them in the source, but we won't worry about that until we have some more variables like this.

{{< highlight py3 >}}
    tileset = tcod.tileset.load_tilesheet(
        "dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD
    )
{{</ highlight >}}

Here, we're telling tcod which font to use. The `"dejavu10x10_gs_tc.png"` bit is the actual file we're reading from (this should exist in your project folder).

{{< highlight py3 >}}
    with tcod.context.new_terminal(
        screen_width,
        screen_height,
        tileset=tileset
        title="Yet Another Roguelike Tutorial",
        vsync=True,
    ) as context:
{{</ highlight >}}

This part is what actually creates the screen. We're giving it the `screen_width` and `screen_height` values from before (80 and 50, respectively), along with a title (change this if you've already got your game's name figured out). `tileset` uses the tileset we defined earlier. and `vsync` will either enable or disable vsync, which shouldn't matter too much in our case.

{{< highlight py3 >}}
        root_console = tcod.Console(screen_width, screen_height, order="F")
{{</ highlight >}}

This creates our "console" which is what we'll be drawing to. We also set this console's width and height to the same as our new terminal. The "order" argument affects the order of our x and y variables in numpy (an underlying library that tcod uses). By default, numpy accesses 2D arrays in [y, x] order, which is fairly unintuitive. By setting `order="F"`, we can change this to be [x, y] instead. This will make more sense once we start drawing the map.

{{< highlight py3 >}}
        while True:
{{</ highlight >}}

This is what's called our 'game loop'. Basically, this is a loop that won't ever end, until we close the screen. Every game has some sort of game loop or another.

{{< highlight py3 >}}
            root_console.print(x=1, y=1, string="@")
{{</ highlight >}}

This line is what tells the program to actually put the "@" symbol on the screen in its proper place. We're telling the `root_console` we created to `print` the "@" symbol at the given x and y coordinates. Try changing the x and y values and see what happens, if you feel so inclined.

{{< highlight py3 >}}
            context.present(root_console)
{{</ highlight >}}

Without this line, nothing would actually print out on the screen. This is because `context.present` is what actually updates the screen with what we've told it to display so far.

{{< highlight py3 >}}
            for event in tcod.event.wait():
                if event.type == "QUIT":
                    raise SystemExit()
{{</ highlight >}}

This part gives us a way to gracefully exit (i.e. not crashing) the program by hitting the `X` button in the console's window. The line `for event in tcod.event.wait()` will wait for some sort of input from the user (mouse clicks, keyboard strokes, etc.) and loop through each event that happened. `SystemExit()` tells Python to quit the current running program.

Alright, our "@" symbol is successfully displayed on the screen, but we can't rest just yet. We still need to get it moving around\!

We need to keep track of the player's position at all times. Since this is a 2D game, we can express this in two data points: the `x` and `y` coordinates. While we could use simple variables for this, let's set up a more extensible structure that will serve us well as we add more features. We'll create an `Entity` class to represent our player (and eventually, monsters and items), and an `Engine` class to manage our game state.

First, let's organize our project better. Create a new directory called `game` in your project folder, and add an empty file called `__init__.py` inside it. This tells Python that `game` is a package we can import from.

Now, let's create our Entity and Engine classes. Create a new file called `entity.py` inside the `game` directory:

{{< highlight py3 >}}
from typing import Tuple


class Entity:
    """
    A generic object to represent players, enemies, items, etc.
    """

    def __init__(self, x: int, y: int, char: str, color: Tuple[int, int, int]):
        self.x = x
        self.y = y
        self.char = char
        self.color = color

    def move(self, dx: int, dy: int) -> None:
        # Move the entity by a given amount
        self.x += dx
        self.y += dy
{{</ highlight >}}

This `Entity` class will represent anything that exists in our game world. For now it just tracks position, appearance, and can move itself. This structure will make it easy to add enemies, items, and other objects later.

Next, create `engine.py` in the `game` directory:

{{< highlight py3 >}}
from __future__ import annotations

import tcod

from game.entity import Entity


class Engine:
    def __init__(self, player: Entity):
        self.player = player

    def render(self, console: tcod.console.Console) -> None:
        console.print(x=self.player.x, y=self.player.y, string=self.player.char, fg=self.player.color)
{{</ highlight >}}

The `Engine` class will manage our game state. Right now it just holds a reference to the player and knows how to render entities, but it will grow to handle much more as we develop our game.

Now let's update our main.py to use these new classes:

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
#!/usr/bin/env python3
import tcod

+from game.engine import Engine
+from game.entity import Entity


def main() -> None:
    screen_width = 80
    screen_height = 50

    tileset = tcod.tileset.load_tilesheet(
        "dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD
    )

+   player = Entity(x=int(screen_width / 2), y=int(screen_height / 2), char="@", color=(255, 255, 255))
+
+   engine = Engine(player=player)

    with tcod.context.new_terminal(
        screen_width,
        screen_height,
        tileset=tileset,
        title="Yet Another Roguelike Tutorial",
        vsync=True,
    ) as context:
        root_console = tcod.Console(screen_width, screen_height, order="F")
        while True:
-           root_console.print(x=1, y=1, string="@")
+           engine.render(root_console)

            context.present(root_console)

            for event in tcod.event.wait():
                if event.type == "QUIT":
                    raise SystemExit()
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>#!/usr/bin/env python3
import tcod

<span class="new-text">from game.engine import Engine
from game.entity import Entity</span>


def main() -> None:
    screen_width = 80
    screen_height = 50

    tileset = tcod.tileset.load_tilesheet(
        "dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD
    )

    <span class="new-text">player = Entity(x=int(screen_width / 2), y=int(screen_height / 2), char="@", color=(255, 255, 255))

    engine = Engine(player=player)</span>

    with tcod.context.new_terminal(
        screen_width,
        screen_height,
        tileset=tileset,
        title="Yet Another Roguelike Tutorial",
        vsync=True,
    ) as context:
        root_console = tcod.Console(screen_width, screen_height, order="F")
        while True:
            <span class="crossed-out-text">root_console.print(x=1, y=1, string="@")</span>
            <span class="new-text">engine.render(root_console)</span>

            context.present(root_console)

            for event in tcod.event.wait():
                if event.type == "QUIT":
                    raise SystemExit()</pre>
{{</ original-tab >}}
{{</ codetab >}}

We're creating a player `Entity` positioned in the middle of the screen, with the "@" character and white color. The `Engine` manages our game state and handles rendering. Notice how `engine.render()` now takes care of drawing our player - this separation of concerns will make our code much easier to extend.

Run the code now and you should see the '@' in the center of the screen. Let's take care of moving it around now.

So, how do we actually capture the user's input? TCOD makes this pretty easy, and in fact, we're already doing it. This line takes care of it for us:

{{< highlight py3 >}}
            for event in tcod.event.wait():
{{</ highlight >}}

It gets the "events", which we can then process. Events range from mouse movements to keyboard strokes. Let's start by getting some basic keyboard commands and processing them, and based on what we get, we'll move our little "@" symbol around.

We *could* identify which key is being pressed right here in `main.py`, but this is a good opportunity to break our project up a little bit. Sooner or later, we're going to have quite a few potential keyboard commands, so putting them all in `main.py` would make the file longer than it needs to be. Maybe we should import what we need into `main.py` rather than writing it all there.

To handle the keyboard inputs and the actions associated with them, let's actually create *two* new files. One will hold the different types of "actions" our rogue can perform, and the other will bridge the gap between the keys we press and those actions.

Create `actions.py` inside the `game` directory:

{{< highlight py3 >}}
from __future__ import annotations

from game.engine import Engine
from game.entity import Entity


class Action:
    def __init__(self, entity: Entity) -> None:
        super().__init__()
        self.entity = entity

    @property
    def engine(self) -> Engine:
        """Return the engine this action belongs to."""
        # In Part 1, we don't have gamemap yet, so we'll need a different approach
        # This will be refactored in Part 2 when we add GameMap
        raise NotImplementedError()

    def perform(self, engine: Engine) -> None:
        """Perform this action with the objects needed to determine its scope.

        This method must be overridden by Action subclasses.
        """
        raise NotImplementedError()


class EscapeAction(Action):
    def perform(self, engine: Engine) -> None:
        raise SystemExit()


class ActionWithDirection(Action):
    def __init__(self, entity: Entity, dx: int, dy: int):
        super().__init__(entity)

        self.dx = dx
        self.dy = dy

    def perform(self, engine: Engine) -> None:
        raise NotImplementedError()


class MovementAction(ActionWithDirection):
    def perform(self, engine: Engine) -> None:
        dest_x = self.entity.x + self.dx
        dest_y = self.entity.y + self.dy

        # Check boundaries (hardcoded for Part 1, will be improved later)
        if 0 <= dest_x < 80 and 0 <= dest_y < 50:
            self.entity.move(self.dx, self.dy)
{{</ highlight >}}

We define our action classes: `Action`, `EscapeAction`, and `MovementAction`. Notice that actions now take an `entity` parameter - this tells us which entity is performing the action. This will become important when we have multiple entities like monsters.

The `perform` method is where the action actually happens. `MovementAction` calculates where the entity wants to move and checks if it's within the screen boundaries before moving. This boundary checking is temporary - we'll have proper map boundaries in the next part.

We also introduce `ActionWithDirection` as a base class for any action that involves a direction. This organization will help us add more directional actions later (like attacking).

That's all we need to do in `actions.py` right now. Now create `input_handlers.py` in the `game` directory:

{{< highlight py3 >}}
from __future__ import annotations

from typing import TYPE_CHECKING, Optional, Union

import tcod.event

from game.actions import Action, EscapeAction, MovementAction

if TYPE_CHECKING:
    import game.engine

# This type will help us handle both actions and state changes
ActionOrHandler = Union[Action, "BaseEventHandler"]
"""An event handler return value which can trigger an action or switch active handlers.

If a handler is returned then it will become the active handler for future events.
If an action is returned it will be attempted and if it's valid then
MainGameEventHandler will become the active handler.
"""


MOVE_KEYS = {
    # Arrow keys.
    tcod.event.KeySym.UP: (0, -1),
    tcod.event.KeySym.DOWN: (0, 1),
    tcod.event.KeySym.LEFT: (-1, 0),
    tcod.event.KeySym.RIGHT: (1, 0),
    tcod.event.KeySym.HOME: (-1, -1),
    tcod.event.KeySym.END: (-1, 1),
    tcod.event.KeySym.PAGEUP: (1, -1),
    tcod.event.KeySym.PAGEDOWN: (1, 1),
    # Numpad keys.
    tcod.event.KeySym.KP_1: (-1, 1),
    tcod.event.KeySym.KP_2: (0, 1),
    tcod.event.KeySym.KP_3: (1, 1),
    tcod.event.KeySym.KP_4: (-1, 0),
    tcod.event.KeySym.KP_6: (1, 0),
    tcod.event.KeySym.KP_7: (-1, -1),
    tcod.event.KeySym.KP_8: (0, -1),
    tcod.event.KeySym.KP_9: (1, -1),
    # Vi keys.
    tcod.event.KeySym.h: (-1, 0),
    tcod.event.KeySym.j: (0, 1),
    tcod.event.KeySym.k: (0, -1),
    tcod.event.KeySym.l: (1, 0),
    tcod.event.KeySym.y: (-1, -1),
    tcod.event.KeySym.u: (1, -1),
    tcod.event.KeySym.b: (-1, 1),
    tcod.event.KeySym.n: (1, 1),
}


class BaseEventHandler(tcod.event.EventDispatch[ActionOrHandler]):
    def handle_events(self, event: tcod.event.Event) -> BaseEventHandler:
        """Handle an event and return the next active event handler."""
        state = self.dispatch(event)
        if isinstance(state, BaseEventHandler):
            return state
        assert not isinstance(state, Action), f"{self!r} can not handle actions."
        return self

    def on_render(self, console: tcod.console.Console) -> None:
        raise NotImplementedError()

    def ev_quit(self, event: tcod.event.Quit) -> Optional[Action]:
        raise SystemExit()


class EventHandler(BaseEventHandler):
    def __init__(self, engine: game.engine.Engine):
        self.engine = engine

    def handle_events(self, event: tcod.event.Event) -> BaseEventHandler:
        """Handle events for input handlers with an engine."""
        action_or_state = self.dispatch(event)
        if isinstance(action_or_state, BaseEventHandler):
            return action_or_state
        if self.handle_action(action_or_state):
            # A valid action was performed.
            return MainGameEventHandler(self.engine)  # Return to the main handler.
        return self

    def handle_action(self, action: Optional[Action]) -> bool:
        """Handle actions returned from event methods.

        Returns True if the action will advance a turn.
        """
        if action is None:
            return False

        action.perform(self.engine)
        return True

    def on_render(self, console: tcod.console.Console) -> None:
        self.engine.render(console)


class MainGameEventHandler(EventHandler):
    def ev_keydown(self, event: tcod.event.KeyDown) -> Optional[ActionOrHandler]:
        action: Optional[Action] = None

        key = event.sym

        player = self.engine.player

        if key in MOVE_KEYS:
            dx, dy = MOVE_KEYS[key]
            action = MovementAction(player, dx, dy)

        elif key == tcod.event.KeySym.ESCAPE:
            action = EscapeAction(player)

        # No valid key was pressed
        return action
{{</ highlight >}}

This is a more sophisticated event handling system than you might expect for Part 1, but it sets us up for success later. Let's break down the key concepts:

{{< highlight py3 >}}
ActionOrHandler = Union[Action, "BaseEventHandler"]
{{</ highlight >}}

This type definition is crucial for our architecture. Event handlers can return either an `Action` (something to do) or another `BaseEventHandler` (a state change, like opening a menu). This flexibility will become essential when we add menus and other game states.

{{< highlight py3 >}}
MOVE_KEYS = {
    # Arrow keys.
    tcod.event.KeySym.UP: (0, -1),
    tcod.event.KeySym.DOWN: (0, 1),
    ...
}
{{</ highlight >}}

We define movement keys in a dictionary for cleaner code. This includes arrow keys, numpad, and even vi keys for hardcore roguelike fans. Each key maps to a (dx, dy) tuple representing the movement direction.

{{< highlight py3 >}}
class BaseEventHandler(tcod.event.EventDispatch[ActionOrHandler]):
    def handle_events(self, event: tcod.event.Event) -> BaseEventHandler:
        """Handle an event and return the next active event handler."""
        state = self.dispatch(event)
        if isinstance(state, BaseEventHandler):
            return state
        assert not isinstance(state, Action), f"{self!r} can not handle actions."
        return self
{{</ highlight >}}

`BaseEventHandler` is our foundation for all event handlers. The `handle_events` method is key - it returns the next active handler, allowing us to switch between different game states (gameplay, menus, etc.) just by returning a different handler.

{{< highlight py3 >}}
class EventHandler(BaseEventHandler):
    def __init__(self, engine: game.engine.Engine):
        self.engine = engine
{{</ highlight >}}

`EventHandler` adds engine awareness to the base handler. It knows how to handle actions by calling their `perform` method.

{{< highlight py3 >}}
class MainGameEventHandler(EventHandler):
    def ev_keydown(self, event: tcod.event.KeyDown) -> Optional[ActionOrHandler]:
        action: Optional[Action] = None

        key = event.sym
        player = self.engine.player

        if key in MOVE_KEYS:
            dx, dy = MOVE_KEYS[key]
            action = MovementAction(player, dx, dy)
{{</ highlight >}}

`MainGameEventHandler` is our actual gameplay handler. Notice how it gets the player from the engine and creates actions with that player entity. This keeps our actions tied to the entity that performs them.

Let's put our new actions and input handlers to use in `main.py`. Here's the complete updated version:

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
#!/usr/bin/env python3
import tcod

+from game.engine import Engine
+from game.entity import Entity
+from game.input_handlers import BaseEventHandler, MainGameEventHandler


def main() -> None:
    screen_width = 80
    screen_height = 50

-   tileset = tcod.tileset.load_tilesheet(
-       "dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD
-   )
+   tileset = tcod.tileset.load_tilesheet("data/dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD)

+   player = Entity(x=int(screen_width / 2), y=int(screen_height / 2), char="@", color=(255, 255, 255))
+
+   engine = Engine(player=player)
+
+   handler: BaseEventHandler = MainGameEventHandler(engine)

-   with tcod.context.new_terminal(
+   with tcod.context.new(
-       screen_width,
-       screen_height,
+       columns=screen_width,
+       rows=screen_height,
        tileset=tileset,
        title="Yet Another Roguelike Tutorial",
        vsync=True,
    ) as context:
-       root_console = tcod.Console(screen_width, screen_height, order="F")
+       root_console = tcod.console.Console(screen_width, screen_height, order="F")
        while True:
-           root_console.print(x=1, y=1, string="@")
-
-           context.present(root_console)
-
-           root_console.clear()
+           root_console.clear()
+           handler.on_render(console=root_console)
+           context.present(root_console)

            for event in tcod.event.wait():
-               if event.type == "QUIT":
-                   raise SystemExit()
+               event = context.convert_event(event)
+               handler = handler.handle_events(event)


if __name__ == "__main__":
    main()
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>#!/usr/bin/env python3
import tcod

<span class="new-text">from game.engine import Engine
from game.entity import Entity
from game.input_handlers import BaseEventHandler, MainGameEventHandler</span>


def main() -> None:
    screen_width = 80
    screen_height = 50

    <span class="crossed-out-text">tileset = tcod.tileset.load_tilesheet(</span>
        <span class="crossed-out-text">"dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD</span>
    <span class="crossed-out-text">)</span>
    <span class="new-text">tileset = tcod.tileset.load_tilesheet("data/dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD)</span>

    <span class="new-text">player = Entity(x=int(screen_width / 2), y=int(screen_height / 2), char="@", color=(255, 255, 255))

    engine = Engine(player=player)

    handler: BaseEventHandler = MainGameEventHandler(engine)</span>

    <span class="crossed-out-text">with tcod.context.new_terminal(</span>
        <span class="crossed-out-text">screen_width,</span>
        <span class="crossed-out-text">screen_height,</span>
    <span class="new-text">with tcod.context.new(
        columns=screen_width,
        rows=screen_height,</span>
        tileset=tileset,
        title="Yet Another Roguelike Tutorial",
        vsync=True,
    ) as context:
        <span class="crossed-out-text">root_console = tcod.Console(screen_width, screen_height, order="F")</span>
        <span class="new-text">root_console = tcod.console.Console(screen_width, screen_height, order="F")</span>
        while True:
            <span class="crossed-out-text">root_console.print(x=1, y=1, string="@")</span>
            <span class="crossed-out-text"></span>
            <span class="crossed-out-text">context.present(root_console)</span>
            <span class="crossed-out-text"></span>
            <span class="crossed-out-text">root_console.clear()</span>
            <span class="new-text">root_console.clear()
            handler.on_render(console=root_console)
            context.present(root_console)</span>

            for event in tcod.event.wait():
                <span class="crossed-out-text">if event.type == "QUIT":</span>
                    <span class="crossed-out-text">raise SystemExit()</span>
                <span class="new-text">event = context.convert_event(event)
                handler = handler.handle_events(event)</span>


if __name__ == "__main__":
    main()</pre>
{{</ original-tab >}}
{{</ codetab >}}

Let's break down the key changes:

{{< highlight py3 >}}
tileset = tcod.tileset.load_tilesheet("data/dejavu10x10_gs_tc.png", 32, 8, tcod.tileset.CHARMAP_TCOD)
{{</ highlight >}}

Note that we're now loading the tileset from a `data/` directory. Create this directory in your project folder and move the `dejavu10x10_gs_tc.png` file into it. This keeps our project organized.

{{< highlight py3 >}}
handler: BaseEventHandler = MainGameEventHandler(engine)
{{</ highlight >}}

We create our event handler with a reference to the engine. The handler tracks the current game state and will allow us to switch between different states (like menus) later.

{{< highlight py3 >}}
with tcod.context.new(
    columns=screen_width,
    rows=screen_height,
{{</ highlight >}}

We're using `tcod.context.new()` instead of `new_terminal()`, with `columns` and `rows` parameters. This is the more modern TCOD API.

{{< highlight py3 >}}
root_console.clear()
handler.on_render(console=root_console)
context.present(root_console)
{{</ highlight >}}

Notice the order here: we clear first, then render, then present. This prevents the "snake trail" effect. The handler's `on_render` method delegates to the engine, which draws our entities.

{{< highlight py3 >}}
event = context.convert_event(event)
handler = handler.handle_events(event)
{{</ highlight >}}

This is the magic of our handler system. `convert_event` ensures the event is in the right format. `handle_events` processes the event and returns the next active handler. If the handler changes (like opening a menu), we'll automatically use the new one for the next event. For now, it always returns itself, but this architecture will shine when we add menus and other game states.

With all that done, let's run the program and see what happens!

Run the project now, and the "@" symbol will move around cleanly. You can use the arrow keys, numpad, or even vi keys (h,j,k,l) to move. Press Escape to exit.

That wraps up part one of this tutorial\! If you're using git or some
other form of version control (and I recommend you do), commit your
changes now.

If you want to see the code so far in its entirety, [click
here](https://github.com/jmccardle/tcod_tutorial_v2/tree/part-1).

[Click here to move on to the next part of this
tutorial.](/tutorials/tcod/part-2)
