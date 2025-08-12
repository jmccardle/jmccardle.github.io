---
title: "Part 0 - Setting Up"
date: 2020-06-14T11:25:36-07:00
draft: false
---

#### Prior knowledge

This tutorial assumes some basic familiarity with programming in
general, and with Python. If you've never used Python before, this
tutorial could be a little confusing. There are many free resources
online about learning programming and Python (too many to list here),
and I'd recommend learning about objects and functions in Python at the
very least before attempting to read this tutorial.

... Of course, there are those who have ignored this advice and done
well with this tutorial anyway, so feel free to ignore that last
paragraph if you're feeling bold\!

#### Installation

To do this tutorial, you'll need Python version 3.7 or higher. The
latest version of Python is recommended (currently 3.8 as of June
2020). **Note: Python 2 is not compatible.**

[Download Python here](https://www.python.org/downloads/).

You'll also want the latest version of the TCOD library, which is what
this tutorial is based on.

[Installation instructions for TCOD can be found
here.](https://python-tcod.readthedocs.io/en/latest/installation.html)

While you can certainly install TCOD and complete this tutorial without
it, I'd highly recommend using a virtual environment. [Documentation on
how to do that can be found
here.](https://docs.python.org/3/library/venv.html)

Additionally, if you are going to use a virtual environment, you may want to take the time to set up a `requirements.txt` file. This will allow you to track your project dependencies if you add any in the future, and more easily install them if you need to (for example, if you pull from a remote git repository).

You can set up your `requirements.txt` file in the same directory that you plan on working in for the project. Create the file `requirements.txt` and put the following in it:

{{< highlight text >}}
tcod>=11.13
numpy>=1.18
{{</ highlight >}}

Once that's done, with your virtual environment activated, type the following command:

`pip install -r requirements.txt`

This should install the TCOD library, along with its dependency, numpy.

Depending on your computer, you might also need to install SDL2.
Check the instructions for installing it based on your operating system.
For example, Ubuntu can install it with the following command:

`sudo apt-get install libsdl2-dev`

#### Editors

Any text editor can work for writing Python. You could even use Notepad
if you really wanted to. Personally, I'm a fan of
[Pycharm](https://www.jetbrains.com/pycharm/) and [Visual Studio
Code](https://code.visualstudio.com/). Whatever you choose, I strongly
recommend something that can help catch Python syntax errors at the very
least. I've been working with Python for over five years, and I still
make these types of mistakes all the time\!

#### Making sure Python works

To verify that your installation of both Python 3 and TCOD are working,
create a new file (in whatever directory you plan on using for the
tutorial) called `main.py`, and enter the following text into it:

```py3
#!/usr/bin/env python3
import tcod


def main():
    print("Hello World!")


if __name__ == "__main__":
    main()
```

Run the file in your terminal (or alternatively in your editor, if
possible):

`python main.py`

If you're not using `virtualenv`, the command will probably look like
this:

`python3 main.py`

You should see "Hello World\!" printed out to the terminal. If you
receive an error, there is probably an issue with either your Python or
TCOD installation.

### Downloading the Image File

For this tutorial, we'll need an image file. The default one is provided below.

![Font File](images/dejavu10x10_gs_tc.png)

Right click the image and save it to the same directory that you're planning on
placing your code in. If the above image is not displaying for some reason,
it is also [available for download here.](https://raw.githubusercontent.com/TStand90/tcod_tutorial_v2/1667c8995fb0d0fd6df98bd84c0be46cb8b78dac/dejavu10x10_gs_tc.png)


### About this site

Code snippets in this website are presented in a way that tries to convey
exactly what the user should be adding to a file at what time. When a user
is expected to create a file from scratch and enter code into it, it will
be represented with standard Python code highlighting, like so:

{{< highlight py3 >}}
class Fighter:
    def __init__(self, hp, defense, power):
        self.max_hp = hp
        self.hp = hp
        self.defense = defense
        self.power = power
{{</ highlight >}}

**Taken from part 6*.

Most of the time, you'll be editing a file and code that already exists.
In such cases, the code will be displayed like this:

{{< codetab >}} {{< diff-tab >}} {{< highlight diff >}}
class Entity:
-   def __init__(self, x, y, char, color, name, blocks=False):
+   def __init__(self, x, y, char, color, name, blocks=False, fighter=None, ai=None):
        self.x = x
        self.y = y
        self.char = char
        self.color = color
        self.name = name
        self.blocks = blocks
+       self.fighter = fighter
+       self.ai = ai
+
+       if self.fighter:
+           self.fighter.owner = self
+
+       if self.ai:
+           self.ai.owner = self
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
<pre>class Entity:
    <span class="crossed-out-text">def __init__(self, x, y, char, color, name, blocks=False):</span>
    <span class="new-text">def __init__(self, x, y, char, color, name, blocks=False, fighter=None, ai=None):</span>
        self.x = x
        self.y = y
        self.char = char
        self.color = color
        self.name = name
        self.blocks = blocks
        <span class="new-text">self.fighter = fighter
        self.ai = ai

        if self.fighter:
            self.fighter.owner = self

        if self.ai:
            self.ai.owner = self</span></pre>
{{</ original-tab >}}
{{</ codetab >}}

**Also taken from part 6.*

Clicking a button above the code section changes the "style" for not just that code block,
but the entire website. You can switch between these styles at any time.

In the case of the example above, you would remove the old `__init__` definition, replacing
it with the new one. Then, you'd add the necessary lines at the bottom. Both styles convey
the same idea.

But what's the difference? The "Diff" style shows the code as you might find it when doing
a Git diff comparison (hence the name). It shows plusses and minuses on the side to denote
whether you should be adding or subtracting a line from a file. The "Original" style shows
the same thing, but it crosses out the lines to remove and does not have plusses nor minuses.

The benefit of the "Diff" style is that it doesn't rely on color to denote what to add, making
it more accessible all around. The drawback is that it's impossible to accurately display the
proper indentation in some instances. The plusses and minuses take up one space, so in a code
section like this one, be sure not to leave the space for the plus in your code (there should
be no spaces before "from"):

{{< codetab >}}
{{< diff-tab >}}
{{< highlight diff >}}
import tcod

+from input_handlers import handle_keys
{{</ highlight >}}
{{</ diff-tab >}}
{{< original-tab >}}
    <pre>import tcod

<span class="new-text">from input_handlers import handle_keys</span></pre>
{{</ original-tab >}}
{{</ codetab >}}

The "Original" style omits the + and - symbols and doesn't have the indentation issue,
making it a bit easier to copy and paste code sections.

Which style you use is a matter of personal preference. The actual code of the tutorial
remains the same.

### Getting help

Be sure to check out the [Roguelike Development
Subreddit](https://www.reddit.com/r/roguelikedev) for help. There's a
link there to the Discord channel as well.

-----

### Ready to go?

Once you're set up and ready to go, you can proceed to [Part
1](/tutorials/tcod/v2/part-1).
