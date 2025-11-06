::: float-container
[]{#dark-mode-toggle .colorscheme-toggle}
:::

::: {.wrapper role="main"}
::: {.section .container}
[Roguelike
Tutorials](https://rogueliketutorials.com/){.navigation-title}

-   [Home](https://rogueliketutorials.com/){.navigation-link}
-   [TCOD Tutorial
    (2020)](https://rogueliketutorials.com/tutorials/tcod/v2/){.navigation-link}
-   [TCOD Tutorial
    (2019)](https://rogueliketutorials.com/tutorials/tcod/2019/){.navigation-link}
-   [About](https://rogueliketutorials.com/about/){.navigation-link}
:::

::: content
::: {.section .container .page}
<div>

# [Part 13 - Gearing up](https://rogueliketutorials.com/tutorials/tcod/v2/part-13/){.title-link} {#part-13---gearing-up .title}

</div>

For the final part of this tutorial, we'll implement something that
*most* roguelikes have: equipment. Our implementation will be extremely
simple: equipping a weapon increases attack power, and equipping armor
increases defense. Many roguelikes have more equipment types than just
these two, and the effects of equipment can go much further than this,
but this should be enough to get you started.

First, we'll want to define the types of equipment that can be found in
the dungeon. As with the `RenderOrder` class, we can use `Enum` to
define the types. For now, we'll leave it at weapons and armor, but feel
free to add more types as you see fit.

Create a new file, `equipment_types.py`, and put the following contents
in it:

::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
from enum import auto, Enum


class EquipmentType(Enum):
    WEAPON = auto()
    ARMOR = auto()
```
:::

Now it's time to create the component that we'll attach to the
equipment. We'll call the component `Equippable`, which will have a few
different attributes:

-   `equipment_type`: The type of equipment, using the `EquipmentType`
    enum.
-   `power_bonus`: How much the wielder's attack power will be
    increased. Currently used for just weapons.
-   `defense_bonus`: How much the wearer's defense will be increased.
    Currently just for armor.

Create the file `equippable.py` in the `components` directory, and fill
it with the following:

::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
from __future__ import annotations

from typing import TYPE_CHECKING

from components.base_component import BaseComponent
from equipment_types import EquipmentType

if TYPE_CHECKING:
    from entity import Item


class Equippable(BaseComponent):
    parent: Item

    def __init__(
        self,
        equipment_type: EquipmentType,
        power_bonus: int = 0,
        defense_bonus: int = 0,
    ):
        self.equipment_type = equipment_type

        self.power_bonus = power_bonus
        self.defense_bonus = defense_bonus


class Dagger(Equippable):
    def __init__(self) -> None:
        super().__init__(equipment_type=EquipmentType.WEAPON, power_bonus=2)


class Sword(Equippable):
    def __init__(self) -> None:
        super().__init__(equipment_type=EquipmentType.WEAPON, power_bonus=4)


class LeatherArmor(Equippable):
    def __init__(self) -> None:
        super().__init__(equipment_type=EquipmentType.ARMOR, defense_bonus=1)


class ChainMail(Equippable):
    def __init__(self) -> None:
        super().__init__(equipment_type=EquipmentType.ARMOR, defense_bonus=3)
```
:::

Aside from creating the `Equippable` class, as described earlier, we've
also created a few types of equippable components, for each equippable
entity that we'll end up creating, similar to what we did with the
`Consumable` classes. You don't have to do it this way, you could just
define these when creating the entities, but you might want to add
additional functionality to weapons and armor at some point, and
defining the `Equippable` classes this way might make that easier. You
might also want to move these classes to their own file, but that's
outside the scope of this tutorial.

To create the actual equippable entities, we'll want to adjust our
`Item` class. We can use the same class that we used for our
consumables, and just handle them slightly differently. Another approach
would be to create another subclass of `Entity`, but for the sake of
keeping the number of `Entity` subclasses in this tutorial short, we'll
adjust `Item`. Make the following adjustments to `entity.py`:

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
...
if TYPE_CHECKING:
    from components.ai import BaseAI
    from components.consumable import Consumable
+   from components.equippable import Equippable
    from components.fighter import Fighter
    from components.inventory import Inventory
    from components.level import Level
    from game_map import GameMap
...

class Item(Entity):
    def __init__(
        self,
        *,
        x: int = 0,
        y: int = 0,
        char: str = "?",
        color: Tuple[int, int, int] = (255, 255, 255),
        name: str = "<Unnamed>",
-       consumable: Consumable,
+       consumable: Optional[Consumable] = None,
+       equippable: Optional[Equippable] = None,
    ):
        super().__init__(
            x=x,
            y=y,
            char=char,
            color=color,
            name=name,
            blocks_movement=False,
            render_order=RenderOrder.ITEM,
        )

        self.consumable = consumable
-       self.consumable.parent = self

+       if self.consumable:
+           self.consumable.parent = self

+       self.equippable = equippable

+       if self.equippable:
+           self.equippable.parent = self
```
:::
:::

::: {.data-pane pane="original"}
    ...
    if TYPE_CHECKING:
        from components.ai import BaseAI
        from components.consumable import Consumable
        from components.equippable import Equippable
        from components.fighter import Fighter
        from components.inventory import Inventory
        from components.level import Level
        from game_map import GameMap
    ...

    class Item(Entity):
        def __init__(
            self,
            *,
            x: int = 0,
            y: int = 0,
            char: str = "?",
            color: Tuple[int, int, int] = (255, 255, 255),
            name: str = "<Unnamed>",
            consumable: Consumable,
            consumable: Optional[Consumable] = None,
            equippable: Optional[Equippable] = None,
        ):
            super().__init__(
                x=x,
                y=y,
                char=char,
                color=color,
                name=name,
                blocks_movement=False,
                render_order=RenderOrder.ITEM,
            )

            self.consumable = consumable
            self.consumable.parent = self

            if self.consumable:
                self.consumable.parent = self

            self.equippable = equippable

            if self.equippable:
                self.equippable.parent = self
:::

</div>

We've added `Equippable` as an optional component for the `Item` class,
and also made `Consumable` optional, so that not all `Item` instances
will be consumable.

Because `consumable` is now an optional attribute, we need to adjust
`actions.py` to take this into account:

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
class ItemAction(Action):
    ...

    def perform(self) -> None:
        """Invoke the items ability, this action will be given to provide context."""
-       self.item.consumable.activate(self)
+       if self.item.consumable:
+           self.item.consumable.activate(self)
```
:::
:::

::: {.data-pane pane="original"}
    class ItemAction(Action):
        ...

        def perform(self) -> None:
            """Invoke the items ability, this action will be given to provide context."""
            self.item.consumable.activate(self)
            if self.item.consumable:
                self.item.consumable.activate(self)
:::

</div>

In order to actually create the equippable entities, we'll want to add a
few examples to `entity_factories.py`. The entities we will add will
correspond to the `Equippable` subclasses we already made. Edit
`entity_factories.py` like this:

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
from components.ai import HostileEnemy
-from components import consumable
+from components import consumable, equippable
from components.fighter import Fighter
from components.inventory import Inventory
from components.level import Level

...
lightning_scroll = Item(
    char="~",
    color=(255, 255, 0),
    name="Lightning Scroll",
    consumable=consumable.LightningDamageConsumable(damage=20, maximum_range=5),
)

+dagger = Item(
+   char="/", color=(0, 191, 255), name="Dagger", equippable=equippable.Dagger()
+)
+
+sword = Item(char="/", color=(0, 191, 255), name="Sword", equippable=equippable.Sword())

+leather_armor = Item(
+   char="[",
+   color=(139, 69, 19),
+   name="Leather Armor",
+   equippable=equippable.LeatherArmor(),
+)

+chain_mail = Item(
+   char="[", color=(139, 69, 19), name="Chain Mail", equippable=equippable.ChainMail()
+)
```
:::
:::

::: {.data-pane pane="original"}
    from components.ai import HostileEnemy
    from components import consumable
    from components import consumable, equippable
    from components.fighter import Fighter
    from components.inventory import Inventory
    from components.level import Level

    ...
    lightning_scroll = Item(
        char="~",
        color=(255, 255, 0),
        name="Lightning Scroll",
        consumable=consumable.LightningDamageConsumable(damage=20, maximum_range=5),
    )

    dagger = Item(
        char="/", color=(0, 191, 255), name="Dagger", equippable=equippable.Dagger()
    )

    sword = Item(char="/", color=(0, 191, 255), name="Sword", equippable=equippable.Sword())

    leather_armor = Item(
        char="[",
        color=(139, 69, 19),
        name="Leather Armor",
        equippable=equippable.LeatherArmor(),
    )

    chain_mail = Item(
        char="[", color=(139, 69, 19), name="Chain Mail", equippable=equippable.ChainMail()
    )
:::

</div>

The creation of these entities is very similar to the consumables,
except we give them the `Equippable` component instead of `Consumable`.
This is all we need to do to create the entities themselves, but we're
far from finished. We still need to make these entities appear on the
map, make them equippable (there's nothing for them to attach *to* on
the player right now), and make equipping them actually do something.

To handle the equipment that the player has equipped at the moment, we
can create yet another component to handle the player's (or the
monster's, for that matter) equipment. Create a new file called
`equipment.py` in the `components` folder, and add these contents:

::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
from __future__ import annotations

from typing import Optional, TYPE_CHECKING

from components.base_component import BaseComponent
from equipment_types import EquipmentType

if TYPE_CHECKING:
    from entity import Actor, Item


class Equipment(BaseComponent):
    parent: Actor

    def __init__(self, weapon: Optional[Item] = None, armor: Optional[Item] = None):
        self.weapon = weapon
        self.armor = armor

    @property
    def defense_bonus(self) -> int:
        bonus = 0

        if self.weapon is not None and self.weapon.equippable is not None:
            bonus += self.weapon.equippable.defense_bonus

        if self.armor is not None and self.armor.equippable is not None:
            bonus += self.armor.equippable.defense_bonus

        return bonus

    @property
    def power_bonus(self) -> int:
        bonus = 0

        if self.weapon is not None and self.weapon.equippable is not None:
            bonus += self.weapon.equippable.power_bonus

        if self.armor is not None and self.armor.equippable is not None:
            bonus += self.armor.equippable.power_bonus

        return bonus

    def item_is_equipped(self, item: Item) -> bool:
        return self.weapon == item or self.armor == item

    def unequip_message(self, item_name: str) -> None:
        self.parent.gamemap.engine.message_log.add_message(
            f"You remove the {item_name}."
        )

    def equip_message(self, item_name: str) -> None:
        self.parent.gamemap.engine.message_log.add_message(
            f"You equip the {item_name}."
        )

    def equip_to_slot(self, slot: str, item: Item, add_message: bool) -> None:
        current_item = getattr(self, slot)

        if current_item is not None:
            self.unequip_from_slot(slot, add_message)

        setattr(self, slot, item)

        if add_message:
            self.equip_message(item.name)

    def unequip_from_slot(self, slot: str, add_message: bool) -> None:
        current_item = getattr(self, slot)

        if add_message:
            self.unequip_message(current_item.name)

        setattr(self, slot, None)

    def toggle_equip(self, equippable_item: Item, add_message: bool = True) -> None:
        if (
            equippable_item.equippable
            and equippable_item.equippable.equipment_type == EquipmentType.WEAPON
        ):
            slot = "weapon"
        else:
            slot = "armor"

        if getattr(self, slot) == equippable_item:
            self.unequip_from_slot(slot, add_message)
        else:
            self.equip_to_slot(slot, equippable_item, add_message)
```
:::

That's a lot to take in, so let's go through it bit by bit.

::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
class Equipment(BaseComponent):
    parent: Actor

    def __init__(self, weapon: Optional[Item] = None, armor: Optional[Item] = None):
        self.weapon = weapon
        self.armor = armor
```
:::

The `weapon` and `armor` attributes are what will hold the actual
equippable entity. Both can be set to `None`, which represents nothing
equipped in those slots. Feel free to add more slots as you see fit
(perhaps you want `armor` to be head, body, legs, etc. instead, or allow
for off-hand weapons/shields).

::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
    @property
    def defense_bonus(self) -> int:
        bonus = 0

        if self.weapon is not None and self.weapon.equippable is not None:
            bonus += self.weapon.equippable.defense_bonus

        if self.armor is not None and self.armor.equippable is not None:
            bonus += self.armor.equippable.defense_bonus

        return bonus

    @property
    def power_bonus(self) -> int:
        bonus = 0

        if self.weapon is not None and self.weapon.equippable is not None:
            bonus += self.weapon.equippable.power_bonus

        if self.armor is not None and self.armor.equippable is not None:
            bonus += self.armor.equippable.power_bonus

        return bonus
```
:::

These properties do the same thing, just for different things. Both
calculate the "bonus" gifted by equipment to either defense or power,
based on what's equipped. Notice that we take the "power" bonus from
both weapons and armor, and the same applies to the "defense" bonus.
This allows you to create weapons that increase both attack and defense
(maybe some sort of spiked shield) and armor that increases attack
(something magical, maybe). We won't do that in this tutorial (weapons
will only increase power, armor will only increase defense), but you
should experiment with different equipment types on your own.

::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
    def item_is_equipped(self, item: Item) -> bool:
        return self.weapon == item or self.armor == item
```
:::

This allows us to quickly check if an `Item` is equipped by the player
or not. It will come in handy later on.

::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
    def unequip_message(self, item_name: str) -> None:
        self.parent.gamemap.engine.message_log.add_message(
            f"You remove the {item_name}."
        )

    def equip_message(self, item_name: str) -> None:
        self.parent.gamemap.engine.message_log.add_message(
            f"You equip the {item_name}."
        )
```
:::

Both of these methods add a message to the message log, depending on
whether the player is equipping or removing a piece of equipment.

::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
    def equip_to_slot(self, slot: str, item: Item, add_message: bool) -> None:
        current_item = getattr(self, slot)

        if current_item is not None:
            self.unequip_from_slot(slot, add_message)

        setattr(self, slot, item)

        if add_message:
            self.equip_message(item.name)

    def unequip_from_slot(self, slot: str, add_message: bool) -> None:
        current_item = getattr(self, slot)

        if add_message:
            self.unequip_message(current_item.name)

        setattr(self, slot, None)
```
:::

`equip_to_slot` and `unequip_from_slot` with add or remove an Item to
the given "slot" (`weapon` or `armor`). We use `getattr` to get the
slot, whether it's `weapon` or `armor`. We use `getattr` because we
won't actually know which one we're getting until the function is
called. `getattr` allows us to "get an attribute" on a class (`self` in
this case) and do what we want with it. We use `setattr` to "set the
attribute" the same way.

`unequip_from_slot` simply removes the item. `equip_to_slot` first
checks if there's something equipped to that slot, and calls
`unequip_from_slot` if there is. This way, the player can't equip two
things to the same slot.

What's with the `add_message` part? Normally, we'll want to add a
message to the message log when we equip/remove things, but in this
section, we'll see an exception: When we set up the player's initial
equipment. We'll use the same "equip" methods to set up the initial
equipment, but there's no need to begin every game with messages that
say the player put on their starting equipment (presumably, the player
character did this before walking into the deadly dungeon).
`add_message` gives us a simple way to not add the messages if they
aren't necessary. In your game, there might be other scenarios where you
don't want to display these messages.

::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
    def toggle_equip(self, equippable_item: Item, add_message: bool = True) -> None:
        if (
            equippable_item.equippable
            and equippable_item.equippable.equipment_type == EquipmentType.WEAPON
        ):
            slot = "weapon"
        else:
            slot = "armor"

        if getattr(self, slot) == equippable_item:
            self.unequip_from_slot(slot, add_message)
        else:
            self.equip_to_slot(slot, equippable_item, add_message)
```
:::

Finally, we have `toggle_equip`, which is the method that will actually
get called when the player selects an equippable item. It checks the
equipment's type (to know which slot to put it in), and then checks to
see if the same item is already equipped to that slot. If it is, the
player presumably wants to remove it. If not, the player wants to equip
it.

To sum up, this component holds references to equippable entities,
calculates the bonuses the player gets from them (which will get added
to the player's power and defense values), and gives a way to equip or
remove the items.

Let's add this component to the actors now. `entity.py` and add these
lines:

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
...
if TYPE_CHECKING:
    from components.ai import BaseAI
    from components.consumable import Consumable
+   from components.equipment import Equipment
    from components.equippable import Equippable
    from components.fighter import Fighter
    from components.inventory import Inventory
    from components.level import Level
    from game_map import GameMap
...

class Actor(Entity):
    def __init__(
        self,
        *,
        x: int = 0,
        y: int = 0,
        char: str = "?",
        color: Tuple[int, int, int] = (255, 255, 255),
        name: str = "<Unnamed>",
        ai_cls: Type[BaseAI],
+       equipment: Equipment,
        fighter: Fighter,
        inventory: Inventory,
        level: Level,
    ):
        super().__init__(
            x=x,
            y=y,
            char=char,
            color=color,
            name=name,
            blocks_movement=True,
            render_order=RenderOrder.ACTOR,
        )

        self.ai: Optional[BaseAI] = ai_cls(self)

+       self.equipment: Equipment = equipment
+       self.equipment.parent = self

        self.fighter = fighter
        self.fighter.parent = self

        ...
```
:::
:::

::: {.data-pane pane="original"}
    ...
    if TYPE_CHECKING:
        from components.ai import BaseAI
        from components.consumable import Consumable
        from components.equipment import Equipment
        from components.equippable import Equippable
        from components.fighter import Fighter
        from components.inventory import Inventory
        from components.level import Level
        from game_map import GameMap
    ...

    class Actor(Entity):
        def __init__(
            self,
            *,
            x: int = 0,
            y: int = 0,
            char: str = "?",
            color: Tuple[int, int, int] = (255, 255, 255),
            name: str = "<Unnamed>",
            ai_cls: Type[BaseAI],
            equipment: Equipment,
            fighter: Fighter,
            inventory: Inventory,
            level: Level,
        ):
            super().__init__(
                x=x,
                y=y,
                char=char,
                color=color,
                name=name,
                blocks_movement=True,
                render_order=RenderOrder.ACTOR,
            )

            self.ai: Optional[BaseAI] = ai_cls(self)

            self.equipment: Equipment = equipment
            self.equipment.parent = self

            self.fighter = fighter
            self.fighter.parent = self

            ...
:::

</div>

We also need to update `entity_factories.py` once again, to create the
actors with the `Equipment` component:

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
from components.ai import HostileEnemy
from components import consumable, equippable
+from components.equipment import Equipment
from components.fighter import Fighter
from components.inventory import Inventory
from components.level import Level


player = Actor(
    char="@",
    color=(255, 255, 255),
    name="Player",
    ai_cls=HostileEnemy,
+   equipment=Equipment(),
    fighter=Fighter(hp=30, base_defense=1, base_power=2),
    inventory=Inventory(capacity=26),
    level=Level(level_up_base=200),
)
orc = Actor(
    char="o",
    color=(63, 127, 63),
    name="Orc",
    ai_cls=HostileEnemy,
+   equipment=Equipment(),
    fighter=Fighter(hp=10, base_defense=0, base_power=3),
    inventory=Inventory(capacity=0),
    level=Level(xp_given=35),
)
troll = Actor(
    char="T",
    color=(0, 127, 0),
    name="Troll",
    ai_cls=HostileEnemy,
+   equipment=Equipment(),
    fighter=Fighter(hp=16, base_defense=1, base_power=4),
    inventory=Inventory(capacity=0),
    level=Level(xp_given=100),
)
...
```
:::
:::

::: {.data-pane pane="original"}
    from components.ai import HostileEnemy
    from components import consumable, equippable
    from components.equipment import Equipment
    from components.fighter import Fighter
    from components.inventory import Inventory
    from components.level import Level


    player = Actor(
        char="@",
        color=(255, 255, 255),
        name="Player",
        ai_cls=HostileEnemy,
        equipment=Equipment(),
        fighter=Fighter(hp=30, base_defense=1, base_power=2),
        inventory=Inventory(capacity=26),
        level=Level(level_up_base=200),
    )
    orc = Actor(
        char="o",
        color=(63, 127, 63),
        name="Orc",
        ai_cls=HostileEnemy,
        equipment=Equipment(),
        fighter=Fighter(hp=10, base_defense=0, base_power=3),
        inventory=Inventory(capacity=0),
        level=Level(xp_given=35),
    )
    troll = Actor(
        char="T",
        color=(0, 127, 0),
        name="Troll",
        ai_cls=HostileEnemy,
        equipment=Equipment(),
        fighter=Fighter(hp=16, base_defense=1, base_power=4),
        inventory=Inventory(capacity=0),
        level=Level(xp_given=100),
    )
    ...
:::

</div>

One thing we need to do is change the way `power` and `defense` are
calculated in the `Fighter` component. Currently, the values are set
directly in the class, but we'll want to calculate them based on their
base values (what gets leveled up), and the bonus values (based on the
equipment).

We can redefine `power` and `defense` as properties, and rename what we
set in the class to `base_power` and `base_defense`. `power` and
`defense` will then get their values from their respective bases and
equipment bonuses.

This will require edits to several places, but we'll start first with
the most obvious: the `Fighter` class itself.

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
class Fighter(BaseComponent):
    parent: Actor

-   def __init__(self, hp: int, defense: int, power: int):
+   def __init__(self, hp: int, base_defense: int, base_power: int):
        self.max_hp = hp
        self._hp = hp
-       self.defense = defense
-       self.power = power
+       self.base_defense = base_defense
+       self.base_power = base_power

    @property
    def hp(self) -> int:
        return self._hp

    @hp.setter
    def hp(self, value: int) -> None:
        self._hp = max(0, min(value, self.max_hp))
        if self._hp == 0 and self.parent.ai:
            self.die()

+   @property
+   def defense(self) -> int:
+       return self.base_defense + self.defense_bonus

+   @property
+   def power(self) -> int:
+       return self.base_power + self.power_bonus

+   @property
+   def defense_bonus(self) -> int:
+       if self.parent.equipment:
+           return self.parent.equipment.defense_bonus
+       else:
+           return 0

+   @property
+   def power_bonus(self) -> int:
+       if self.parent.equipment:
+           return self.parent.equipment.power_bonus
+       else:
+           return 0

    def die(self) -> None:
        ...
```
:::
:::

::: {.data-pane pane="original"}
    class Fighter(BaseComponent):
        parent: Actor

        def __init__(self, hp: int, defense: int, power: int):
        def __init__(self, hp: int, base_defense: int, base_power: int):
            self.max_hp = hp
            self._hp = hp
            self.defense = defense
            self.power = power
            self.base_defense = base_defense
            self.base_power = base_power

        @property
        def hp(self) -> int:
            return self._hp

        @hp.setter
        def hp(self, value: int) -> None:
            self._hp = max(0, min(value, self.max_hp))
            if self._hp == 0 and self.parent.ai:
                self.die()

        @property
        def defense(self) -> int:
            return self.base_defense + self.defense_bonus

        @property
        def power(self) -> int:
            return self.base_power + self.power_bonus

        @property
        def defense_bonus(self) -> int:
            if self.parent.equipment:
                return self.parent.equipment.defense_bonus
            else:
                return 0

        @property
        def power_bonus(self) -> int:
            if self.parent.equipment:
                return self.parent.equipment.power_bonus
            else:
                return 0

        def die(self) -> None:
            ...
:::

</div>

`power` and `defense` are now computed based on the base values and the
bonus values offered by the equipment (if any exists).

We'll need to edit `level.py` to reflect the new attribute names as
well:

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
class Level(BaseComponent):
    ...

    def increase_power(self, amount: int = 1) -> None:
-       self.parent.fighter.power += amount
+       self.parent.fighter.base_power += amount

        self.engine.message_log.add_message("You feel stronger!")

        self.increase_level()

    def increase_defense(self, amount: int = 1) -> None:
-       self.parent.fighter.defense += amount
+       self.parent.fighter.base_defense += amount

        self.engine.message_log.add_message("Your movements are getting swifter!")
```
:::
:::

::: {.data-pane pane="original"}
    class Level(BaseComponent):
        ...

        def increase_power(self, amount: int = 1) -> None:
            self.parent.fighter.power += amount
            self.parent.fighter.base_power += amount

            self.engine.message_log.add_message("You feel stronger!")

            self.increase_level()

        def increase_defense(self, amount: int = 1) -> None:
            self.parent.fighter.defense += amount
            self.parent.fighter.base_defense += amount

            self.engine.message_log.add_message("Your movements are getting swifter!")
:::

</div>

We also have to adjust the initializations in `entity_factories.py`:

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
player = Actor(
    char="@",
    color=(255, 255, 255),
    name="Player",
    ai_cls=HostileEnemy,
    equipment=Equipment(),
-   fighter=Fighter(hp=30, defense=2, power=5),
+   fighter=Fighter(hp=30, base_defense=1, base_power=2),
    inventory=Inventory(capacity=26),
    level=Level(level_up_base=200),
)
orc = Actor(
    char="o",
    color=(63, 127, 63),
    name="Orc",
    ai_cls=HostileEnemy,
    equipment=Equipment(),
-   fighter=Fighter(hp=10, defense=0, power=3),
+   fighter=Fighter(hp=10, base_defense=0, base_power=3),
    inventory=Inventory(capacity=0),
    level=Level(xp_given=35),
)
troll = Actor(
    char="T",
    color=(0, 127, 0),
    name="Troll",
    ai_cls=HostileEnemy,
    equipment=Equipment(),
-   fighter=Fighter(hp=16, defense=1, power=4),
+   fighter=Fighter(hp=16, base_defense=1, base_power=4),
    inventory=Inventory(capacity=0),
    level=Level(xp_given=100),
)
...
```
:::
:::

::: {.data-pane pane="original"}
    player = Actor(
        char="@",
        color=(255, 255, 255),
        name="Player",
        ai_cls=HostileEnemy,
        equipment=Equipment(),
        fighter=Fighter(hp=30, defense=2, power=5),
        fighter=Fighter(hp=30, base_defense=1, base_power=2),
        inventory=Inventory(capacity=26),
        level=Level(level_up_base=200),
    )
    orc = Actor(
        char="o",
        color=(63, 127, 63),
        name="Orc",
        ai_cls=HostileEnemy,
        equipment=Equipment(),
        fighter=Fighter(hp=10, defense=0, power=3),
        fighter=Fighter(hp=10, base_defense=0, base_power=3),
        inventory=Inventory(capacity=0),
        level=Level(xp_given=35),
    )
    troll = Actor(
        char="T",
        color=(0, 127, 0),
        name="Troll",
        ai_cls=HostileEnemy,
        equipment=Equipment(),
        fighter=Fighter(hp=16, defense=1, power=4),
        fighter=Fighter(hp=16, base_defense=1, base_power=4),
        inventory=Inventory(capacity=0),
        level=Level(xp_given=100),
    )
    ...
:::

</div>

Notice that we've changed the player's base values a bit. This is to
compensate for the fact that the player will be getting bonuses from the
equipment soon. Feel free to tweak these values however you see fit.

Now all that's left to do is allow generate the equipment to the map,
and allow the player to interact with it. To create equipment, we can
simply edit our `item_chances` dictionary to include weapons and armor
on certain floors. Edit `procgen.py` like this:

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
item_chances: Dict[int, List[Tuple[Entity, int]]] = {
    0: [(entity_factories.health_potion, 35)],
    2: [(entity_factories.confusion_scroll, 10)],
-   4: [(entity_factories.lightning_scroll, 25)],
-   6: [(entity_factories.fireball_scroll, 25)],
+   4: [(entity_factories.lightning_scroll, 25), (entity_factories.sword, 5)],
+   6: [(entity_factories.fireball_scroll, 25), (entity_factories.chain_mail, 15)],
}
```
:::
:::

::: {.data-pane pane="original"}
    item_chances: Dict[int, List[Tuple[Entity, int]]] = {
        0: [(entity_factories.health_potion, 35)],
        2: [(entity_factories.confusion_scroll, 10)],
        4: [(entity_factories.lightning_scroll, 25)],
        6: [(entity_factories.fireball_scroll, 25)],
        4: [(entity_factories.lightning_scroll, 25), (entity_factories.sword, 5)],
        6: [(entity_factories.fireball_scroll, 25), (entity_factories.chain_mail, 15)],
    }
:::

</div>

This will generate swords and chain mail at levels 4 and 6,
respectively. You can change the floor or the weights if you like.

Now that equipment will spawn on the map, we need to allow the user to
equip and remove equippable entities. The first step is to add an action
to equip things, which we'll call `EquipAction`. Add this class to
`actions.py`:

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
...
class DropItem(ItemAction):
    ...


+class EquipAction(Action):
+   def __init__(self, entity: Actor, item: Item):
+       super().__init__(entity)

+       self.item = item

+   def perform(self) -> None:
+       self.entity.equipment.toggle_equip(self.item)


class WaitAction(Action):
    ...
```
:::
:::

::: {.data-pane pane="original"}
    ...
    class DropItem(ItemAction):
        ...


    class EquipAction(Action):
        def __init__(self, entity: Actor, item: Item):
            super().__init__(entity)

            self.item = item

        def perform(self) -> None:
            self.entity.equipment.toggle_equip(self.item)


    class WaitAction(Action):
        ...
:::

</div>

The action itself is very straightforward: It holds which item is being
equipped/removed, and calls the `toggle_equip` method. The `Equipment`
component handles most of the work here.

But how do we *use* this action? The simplest way would be to expand the
functionality of our original inventory menu. If the user selects a
piece of equipment from that menu, we'll either equip the item, or
remove it, if it's already equipped. We should also show the user a
visual representation of which items are already equipped.

Modify `input_handlers.py` like this:

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
class InventoryEventHandler(AskUserEventHandler):
    def on_render(self, console: tcod.Console) -> None:
        ...

        if number_of_items_in_inventory > 0:
            for i, item in enumerate(self.engine.player.inventory.items):
                item_key = chr(ord("a") + i)
-               console.print(x + 1, y + i + 1, f"({item_key}) {item.name}")

+               is_equipped = self.engine.player.equipment.item_is_equipped(item)

+               item_string = f"({item_key}) {item.name}"

+               if is_equipped:
+                   item_string = f"{item_string} (E)"

+               console.print(x + 1, y + i + 1, item_string)
        else:
            console.print(x + 1, y + 1, "(Empty)")

    ...

class InventoryActivateHandler(InventoryEventHandler):
    """Handle using an inventory item."""

    TITLE = "Select an item to use"

    def on_item_selected(self, item: Item) -> Optional[ActionOrHandler]:
-       """Return the action for the selected item."""
-       return item.consumable.get_action(self.engine.player)
+       if item.consumable:
+           # Return the action for the selected item.
+           return item.consumable.get_action(self.engine.player)
+       elif item.equippable:
+           return actions.EquipAction(self.engine.player, item)
+       else:
+           return None


class InventoryDropHandler(InventoryEventHandler):
    ...
```
:::
:::

::: {.data-pane pane="original"}
    class InventoryEventHandler(AskUserEventHandler):
        def on_render(self, console: tcod.Console) -> None:
            ...

            if number_of_items_in_inventory > 0:
                for i, item in enumerate(self.engine.player.inventory.items):
                    item_key = chr(ord("a") + i)
                    console.print(x + 1, y + i + 1, f"({item_key}) {item.name}")

                    is_equipped = self.engine.player.equipment.item_is_equipped(item)

                    item_string = f"({item_key}) {item.name}"

                    if is_equipped:
                        item_string = f"{item_string} (E)"

                    console.print(x + 1, y + i + 1, item_string)
            else:
                console.print(x + 1, y + 1, "(Empty)")

        ...

    class InventoryActivateHandler(InventoryEventHandler):
        """Handle using an inventory item."""

        TITLE = "Select an item to use"

        def on_item_selected(self, item: Item) -> Optional[ActionOrHandler]:
            """Return the action for the selected item."""
            return item.consumable.get_action(self.engine.player)
            if item.consumable:
                # Return the action for the selected item.
                return item.consumable.get_action(self.engine.player)
            elif item.equippable:
                return actions.EquipAction(self.engine.player, item)
            else:
                return None


    class InventoryDropHandler(InventoryEventHandler):
        ...
:::

</div>

The first change is modifying the render function to display an "(E)"
next to items that are equipped. Items that aren't equipped are
displayed the same way as before.

The second change has to do with using the item. Before, we were just
assuming the item was a consumable. Now, if the item is a consumable, we
call the `get_action` method on the `Consumable` component, just like
before. If it's instead equippable, we call the `EquipAction`. If it's
neither, nothing happens.

Run the game now, you'll be able to pick up and equip things. I
recommend adjusting the values in `procgen.py` to make equipment spawn
earlier and more often, just for testing purposes.

If you play around a bit, you might notice an odd bug: If the player
drops something that's equipped... it stays equipped! That doesn't make
sense, as dropping something should unequip it as well. Luckily, the fix
is quite simple: We can adjust our `DropItem` action to unequip an item
if it's being dropped and it's equipped. Make the following additions to
`actions.py`:

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
class DropItem(ItemAction):
    def perform(self) -> None:
+       if self.entity.equipment.item_is_equipped(self.item):
+           self.entity.equipment.toggle_equip(self.item)

        self.entity.inventory.drop(self.item)
```
:::
:::

::: {.data-pane pane="original"}
    class DropItem(ItemAction):
        def perform(self) -> None:
            if self.entity.equipment.item_is_equipped(self.item):
                self.entity.equipment.toggle_equip(self.item)

            self.entity.inventory.drop(self.item)
:::

</div>

One last thing we can do is give the player a bit of equipment to start.
We'll spawn a dagger and leather armor, and immediately add them to the
player's inventory.

<div>

Diff

Original

::: {.data-pane .active pane="diff"}
::: highlight
``` {tabindex="0" style="color:#f8f8f2;background-color:#272822;-moz-tab-size:4;-o-tab-size:4;tab-size:4;"}
def new_game() -> Engine:
    ...

    engine.message_log.add_message(
        "Hello and welcome, adventurer, to yet another dungeon!", color.welcome_text
    )

+   dagger = copy.deepcopy(entity_factories.dagger)
+   leather_armor = copy.deepcopy(entity_factories.leather_armor)

+   dagger.parent = player.inventory
+   leather_armor.parent = player.inventory

+   player.inventory.items.append(dagger)
+   player.equipment.toggle_equip(dagger, add_message=False)

+   player.inventory.items.append(leather_armor)
+   player.equipment.toggle_equip(leather_armor, add_message=False)

    return engine
```
:::
:::

::: {.data-pane pane="original"}
    def new_game() -> Engine:
        ...

        engine.message_log.add_message(
            "Hello and welcome, adventurer, to yet another dungeon!", color.welcome_text
        )

        dagger = copy.deepcopy(entity_factories.dagger)
        leather_armor = copy.deepcopy(entity_factories.leather_armor)

        dagger.parent = player.inventory
        leather_armor.parent = player.inventory

        player.inventory.items.append(dagger)
        player.equipment.toggle_equip(dagger, add_message=False)

        player.inventory.items.append(leather_armor)
        player.equipment.toggle_equip(leather_armor, add_message=False)

        return engine
:::

</div>

As mentioned earlier, we pass `add_message=False` to signify not to add
a message to the message log.

![Part 13 -
End](Part%2013%20-%20Gearing%20up%20%C2%B7%20Roguelike%20Tutorials_files/part-13-end.png)

With that, we've reached the end of the tutorial! Thank you so much for
following along, and be sure to check out the [extras
section](https://rogueliketutorials.com/tutorials/tcod/v2). More will be
added there over time. If you have a suggestion for an extra, let me
know!

Be sure to check out the [Roguelike Development
Subreddit](https://www.reddit.com/r/roguelikedev) for help, for
inspiration, or to share your progress.

Best of luck on your roguelike development journey!

If you want to see the code so far in its entirety, [click
here](https://github.com/TStand90/tcod_tutorial_v2/tree/2020/part-13).
:::
:::

::: {.section .container}
© 2023 · Powered by [Hugo](https://gohugo.io/) &
[Coder](https://github.com/luizdepra/hugo-coder/).
:::
:::
