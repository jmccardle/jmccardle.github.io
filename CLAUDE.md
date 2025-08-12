# TCOD Tutorial Revision Project Guidelines

## Project Overview
This repository contains an updated version of the TCOD Python roguelike tutorial that incorporates architectural improvements throughout the early chapters, as originally envisioned by TStand90. The goal is to update the tutorial text to reflect these code improvements while maintaining the tutorial's pedagogical value and minimizing changes to the original prose.

## Key Refactoring Points

### Part 6 - Combat System Overhaul
**Major architectural changes introduced:**
- Full component system with `BaseComponent` class and `/game/components/` directory
- `Actor` subclass for entities with AI and combat capabilities  
- Sophisticated pathfinding AI system replacing simple adjacent-movement logic
- Entity factory pattern in `entity_factories.py`
- Render order system with proper layering
- State-based event handling for death management

**Tutorial text approach:** Introduce the component architecture as "we'll organize our code this way to make future features easier to add" without calling it a refactor. Brief explanations about extensibility when introducing the component system.

### Part 8 - Items and Inventory Architecture
**Major architectural changes introduced:**
- Parent-child entity system (entities have flexible `parent` instead of direct `gamemap`)
- Components use `parent` instead of `entity` for consistency
- `Impossible` exception for invalid actions
- AI decoupled from BaseComponent inheritance

**Tutorial text approach:** Present the parent system as forward-thinking design: "Items will need to exist both on the map and in inventories, so we'll use a flexible parent system."

### Part 10 - Event Handler Revolution
**Major architectural changes introduced:**
- `ActionOrHandler` union type for handler returns
- Handler state management moved to `main.py`
- Modular game setup in `setup_game.py`
- Exception hierarchy for different quit scenarios
- `PopupMessage` overlay handler system

**Tutorial text approach:** Frame as "proper separation of concerns" and explain benefits of modular setup for future menu extensions.

## Writing Guidelines

### Minimal Changes Principle
- Default stance: leave paragraphs unchanged unless directly affected by refactoring
- Only modify code blocks that have changed
- Add brief explanatory notes only where the refactored code would seem unnecessarily complex

### Explaining Architecture Without "Refactoring"
- Frame changes as forward-thinking design decisions
- Use phrases like:
  - "We'll structure this to support future features"
  - "This organization will make it easier to add [specific future feature]"
  - "By setting this up now, we avoid complexity later"
- Avoid terms like "refactor," "redesign," or "restructure"

### Code Diff Updates
- Update all code blocks to match the refactored version in `tcod_tutorial_fixes/tcod_tutorial_v2/`
- Ensure diffs show realistic progression from previous lesson
- Maintain the tutorial's incremental teaching approach

### Explanatory Additions
When adding explanations for architectural decisions:
1. Keep them brief (1-2 sentences)
2. Focus on practical benefits
3. Reference specific future features when possible
4. Maintain the tutorial's conversational tone

## File Structure Reference

### Source Materials
- **Original tutorial text**: `/tutorials/tcod/*.md` - The files we're updating
- **Code diffs**: `/tcod_tutorial_fixes/revised_tutorial_text/*_diff` - Git diffs showing changes between lessons
- **Change descriptions**: `/tcod_tutorial_fixes/revised_tutorial_text/*_description.md` - Detailed analysis of changes (reference only, don't match this style)
- **Refactored code**: `/tcod_tutorial_fixes/tcod_tutorial_v2/` - The complete revised codebase

### Output
- Only files in `/tutorials/tcod/` will be committed
- Other directories are reference materials

## Specific Areas of Focus

### Component System Introduction (Part 6)
- Explain components as a way to "organize different aspects of entities"
- Mention that this makes it easy to add new behaviors later
- Don't over-explain the pattern - let it speak for itself

### Entity Hierarchy (Part 6)
- Present `Actor` class as natural distinction between "things that act" and "things that exist"
- Brief mention that this prevents items from accidentally getting combat stats

### Parent System (Part 8)
- Critical to explain why entities need flexible parents
- One sentence about items moving between map and inventory
- Emphasize this prevents special-casing item pickup/drop

### Event Handler Chain (Part 10)
- Focus on the benefit: handlers can return other handlers for state changes
- Mention this enables complex menu systems without tangled state management

## Testing Approach
After updating each tutorial part:
1. Verify all code blocks match the refactored version
2. Ensure explanatory text flows naturally
3. Check that changes feel motivated by immediate or near-future needs
4. Confirm the tutorial remains beginner-friendly

## Tone and Style
- Maintain the original tutorial's friendly, conversational tone
- Keep technical explanations accessible to beginners
- Use concrete examples over abstract theory
- Remember the audience: Python programmers new to game development

## Progress Tracking
Use todo lists to track:
1. Which tutorial parts have been reviewed
2. Which parts need text updates
3. Which code blocks need updating
4. Any inconsistencies found between lessons

## Important Notes
- The refactored code behavior is identical to the original - only the architecture changed
- Focus on code hygiene and extensibility benefits
- These changes prevent the "great refactoring wall" typically hit in parts 8-10
- The goal is seamless integration - readers shouldn't realize it's been refactored
- you may check out the exact commit for the tutorial part we're editing in the code repo: tcod_tutorial_fixes/tcod_tutorial_v2 for exact reference of how the code looks at each step. Checkout 'master' to go to part 13, and see `git log --oneline` for the commit IDs of the previous parts.