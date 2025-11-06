# Part 7: Creating the Interface

## Key Objects and Systems:

### 1. Message Log System
- **MessageLog Class**: Stores and renders game messages with color
- **Message Class**: Individual messages with text, color, and stacking count
- **Message Stacking**: Duplicate messages show "(x2)" etc
- **Message Rendering**: Wraps text and displays in UI area

### 2. UI Components
- **Health Bar**: Visual HP display with filled/empty portions
- **Mouse Look**: Shows entity names at mouse location
- **History Viewer**: Full screen message log viewer (press 'v')
- **Color System**: Centralized color definitions in color.py

### 3. Enhanced Input Handlers
- **HistoryViewer**: New event handler for viewing message history
- **Mouse Support**: Track mouse position, show entity names
- **Context Parameter**: handle_events now takes tcod.context.Context

### 4. Render Functions Module
- **render_bar()**: Draws HP bar with current/max values
- **render_names_at_mouse_location()**: Shows entity names at cursor
- **get_names_at_location()**: Gets comma-separated entity names

## Gameplay Goals:
- View combat messages in a persistent log
- See HP visually with a bar
- Mouse over entities to see their names
- Press 'v' to view full message history
- Navigate history with arrow keys, page up/down
- Colorized messages for different events

## Code Examples:

### MessageLog with stacking:
```python
class Message:
    def __init__(self, text: str, fg: Tuple[int, int, int]):
        self.plain_text = text
        self.fg = fg
        self.count = 1

    @property
    def full_text(self) -> str:
        """The full text of this message, including the count if necessary."""
        if self.count > 1:
            return f"{self.plain_text} (x{self.count})"
        return self.plain_text

class MessageLog:
    def add_message(self, text: str, fg: Tuple[int, int, int] = game.color.white, *, stack: bool = True) -> None:
        if stack and self.messages and text == self.messages[-1].plain_text:
            self.messages[-1].count += 1
        else:
            self.messages.append(Message(text, fg))
```

### HistoryViewer event handler:
```python
class HistoryViewer(EventHandler):
    """Print the history on a larger window which can be navigated."""

    def __init__(self, engine: game.engine.Engine):
        super().__init__(engine)
        self.log_length = len(engine.message_log.messages)
        self.cursor = self.log_length - 1

    def on_render(self, console: tcod.console.Console) -> None:
        super().on_render(console)  # Draw the main state as the background.

        log_console = tcod.console.Console(console.width - 6, console.height - 6)

        # Draw a frame with a custom banner title.
        log_console.draw_frame(0, 0, log_console.width, log_console.height)
        log_console.print_box(0, 0, log_console.width, 1, "┤Message history├", alignment=tcod.CENTER)

        # Render the message log using the cursor parameter.
        self.engine.message_log.render_messages(
            log_console,
            1,
            1,
            log_console.width - 2,
            log_console.height - 2,
            self.engine.message_log.messages[: self.cursor + 1],
        )
        log_console.blit(console, 3, 3)
```

### Health bar rendering:
```python
def render_bar(console: tcod.console.Console, current_value: int, maximum_value: int, total_width: int) -> None:
    bar_width = int(float(current_value) / maximum_value * total_width)

    console.draw_rect(x=0, y=45, width=20, height=1, ch=1, bg=game.color.bar_empty)

    if bar_width > 0:
        console.draw_rect(x=0, y=45, width=bar_width, height=1, ch=1, bg=game.color.bar_filled)

    console.print(x=1, y=45, string=f"HP: {current_value}/{maximum_value}", fg=game.color.bar_text)
```

### Mouse position tracking:
```python
def ev_mousemotion(self, event: tcod.event.MouseMotion) -> None:
    x, y = int(event.tile.x), int(event.tile.y)
    if self.engine.game_map.in_bounds(x, y):
        self.engine.mouse_location = x, y
```

## No Refactoring in Part 7
Part 7 introduces new features but doesn't include any refactoring that needs to be backported.