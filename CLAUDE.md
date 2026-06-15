# DudiDesk — Claude Code Context

## What this is

DudiDesk is a personal custom new-tab / start page for the browser, designed for Mada. It replaces Chrome's default new tab with a customizable retro-pixel themed page that includes:

- A Google search bar
- A draggable icon grid (snap-to-grid, freeform positioning within a glassmorphism panel)
- Folder support (drag one icon onto another for 500ms → creates a folder)
- Quick links (Outlook, Gmail, Google Drive)
- A settings dropdown with: Dark/Mid/Light mode, S/M/L/XL icon size, GRID/DOTS/PLUS/ALIENS background pattern, custom title (e.g. "CLUNKDESK"), and a panel opacity slider (0–10)
- 7 folder colors (none, red, orange, yellow, green, blue, purple)

The aesthetic is **dark retro pixel UI** — heavy use of `Press Start 2P` font, chunky borders, no rounded corners except on the icon panel itself (25px radius), terminal-cream colors on near-black.

## Code style

- Vanilla TypeScript with ESM modules. No frameworks (no React/Vue/etc).
- Modules are small and single-purpose. Cross-module communication goes through the `state` module (for persistence) and direct function calls.
- DOM is created imperatively via `createElement` — no template literals injected as innerHTML except for trusted, controlled icon thumbnails.
- CSS uses CSS variables for theming. Themes change CSS vars at runtime via `document.documentElement.style.setProperty`.
- Drag & drop uses pointer/mouse events directly (not native HTML5 drag API) for full control over the long-press timing and ghost element.
- Storage: `localStorage` only. Two keys: `dudidesk_prefs` (settings) and `dudidesk_v7` (shortcuts).

## Architecture

**Single source of truth: `localStorage`.**

The shortcuts list is a flat array of items. Each item is either:
- `{ type: "link", name, url, col, row }` — a single shortcut at grid position (col, row)
- `{ type: "folder", name, color, col, row, items: [{ name, url }] }` — a folder containing links. **No folder-in-folder nesting.**

The grid is a logical 10-column unbounded-row matrix. Icons are absolutely positioned inside `.icon-grid` (which is inside `.icon-panel` for the glassmorphism backdrop). `cellToXY(col, row)` returns pixel coordinates; `snapToCell(px, py)` does the reverse. Cell size is set via the `--cell` CSS variable and changes with icon size preset.

The icon panel has:
- Outer `.icon-panel` — handles glassmorphism background, border-radius, padding (50px all sides for breathing room around icons)
- Inner `.icon-grid` — `position: relative` to act as the coordinate system for absolutely-positioned icons

**Why two divs?** Absolutely-positioned children ignore the padding of `position: relative` parents in most browsers. The inner `.icon-grid` is the actual coordinate system; the outer panel handles the visual padding correctly.

## Drag system

Long-press 280ms → drag mode. Ghost element follows cursor. On release:
1. If hovering over another non-folder icon for 500ms → merge into folder
2. Otherwise → snap to nearest cell. If cell occupied, swap positions with the existing item.

Folder merge is blocked if either source or target is already a folder (no nesting).

## Background patterns

Drawn to a fixed-position canvas (`#bgCanvas`, `z-index: -1`) using the current theme's `--fg` color. Four patterns: GRID (lines), DOTS, PLUS (pixel crosses), ALIENS (Space Invader sprites). Redrawn on window resize and theme change.

## Conventions for Claude Code

When editing this project:

- **Don't introduce frameworks.** Vanilla TS is intentional.
- **Don't add dependencies** unless asked. The deps are `vite`, `typescript`, and `esbuild`.
- **`index.html` loads `/src/bundle.js`, not `/src/main.ts`.** This is a generated, self-contained ESM bundle (via `npm run bundle`, esbuild) so the page runs directly under a static server / Live Server with no build step — browsers can't execute `.ts` files. After editing any file in `src/`, run `npm run bundle` (or keep `npm run bundle:watch` running) to regenerate it. Don't hand-edit `src/bundle.js` or `src/bundle.js.map`.
- **Keep modules small.** If a file exceeds ~150 lines of substance, suggest splitting.
- **No inline styles** in TS except for dynamic positioning (`element.style.left = ...`) and color overrides (folder colors).
- **No `any` types.** Use proper interfaces from `src/types/index.ts`.
- **Test storage round-trips.** When adding new fields to shortcuts/folders, ensure backwards-compatible loading (existing users have data without those fields).
- **Pixel-perfect retro feel.** No box-shadows that look modern (`drop-shadow` for ghost is fine). No gradients in UI chrome. Borders are 3px solid. The only border-radius in the whole UI is on the icon panel (25px).

## File overview

- `index.html` — minimal shell, loads `src/bundle.js` (generated, see above)
- `src/main.ts` — wires modules together, runs on `DOMContentLoaded`
- `src/bundle.js` / `src/bundle.js.map` — generated bundle of `main.ts` + all modules (esbuild, `npm run bundle`)
- `src/types/index.ts` — `Shortcut`, `Folder`, `Item`, `Prefs`, `Theme`, `SizePreset`
- `src/modules/state.ts` — load/save prefs and shortcuts, defaults
- `src/modules/themes.ts` — THEMES record (dark/mid/light) and FOLDER_COLORS
- `src/modules/sizes.ts` — SIZES record (s/m/l/xl)
- `src/modules/theme.ts` — applyTheme, applyTitle, applyPanelOpacity, setActiveBtn
- `src/modules/background.ts` — applyBg(type)
- `src/modules/grid.ts` — cellSize, iconSize, cellToXY, snapToCell, freeCell, panelRows, resizePanel
- `src/modules/render.ts` — render(), makeScItem(), makeFolderEl()
- `src/modules/drag.ts` — attachDrag(), showGhost(), placeGhost(), hideGhost(), mergeFolder(), commitDrop()
- `src/modules/folder.ts` — openFolder(), closeFolderOverlay(), renderFolderGrid(), renderColorPicker()
- `src/modules/modal.ts` — openModal(), closeModal() for "new shortcut"
- `src/modules/settings.ts` — settings dropdown open/close, wires controls
- `src/styles/main.css` — all styles in one file (split if it grows >500 lines)

## Known good user flows

These should always work after refactors:

1. Page loads → grid renders with defaults if storage empty
2. Click `+` → modal opens → enter name+URL → icon added at first free cell
3. Long-press icon → drag → release on empty cell → icon moves there
4. Long-press icon → drag → release on occupied cell → positions swap
5. Long-press icon → hover over another icon for 500ms → both merge into folder → folder overlay opens for naming
6. Click folder → overlay opens → can rename, change color, remove items
7. Settings → change mode/size/bg → live preview → SAVE persists
8. Settings → custom title (e.g. "CLUNK") → wordmark becomes "CLUNKDESK"
9. Reload page → all state restored
