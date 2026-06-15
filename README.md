# DudiDesk

A retro-pixel custom new tab page with Google search, draggable icons, folders, themes, and customizable backgrounds.

## Setup

```bash
npm install
npm run dev      # development server with HMR
npm run build    # production build to dist/
npm run preview  # preview production build
```

## Browser usage

After `npm run build`, use the **New Tab Redirect** Chrome extension and point it to either the local Vite dev URL or the built `dist/index.html`.

## Project structure

```
src/
├── main.ts                  # entry point, wires everything up
├── modules/
│   ├── state.ts             # prefs + shortcuts storage
│   ├── themes.ts            # color modes (dark/mid/light)
│   ├── sizes.ts             # icon size presets (S/M/L/XL)
│   ├── theme.ts             # applies theme + title + opacity
│   ├── background.ts        # canvas background patterns
│   ├── grid.ts              # snap-to-grid math
│   ├── render.ts            # renders icons + folders
│   ├── drag.ts              # drag & drop + folder merge
│   ├── folder.ts            # folder overlay (open/close/rename/color)
│   ├── modal.ts             # "new shortcut" modal
│   └── settings.ts          # settings dropdown UI
├── styles/
│   └── main.css             # all styles
└── types/
    └── index.ts             # TypeScript types
```

See `CLAUDE.md` for architecture notes and code style.
