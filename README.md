# Tododos

Tododos is a grocery-first list manager for repeatable shopping and household workflows. It lets you keep multiple lists, start new lists from reusable templates, and organize items with custom grouping schemes like grocery aisles, dinners, or store sections.

The app syncs list data through Firebase Firestore, keeps lightweight UI preferences locally, and is built as a responsive React single-page app for quick use on desktop and mobile. It also works well for other repeatable checklists—packing lists, routines, or project tasks—without being limited to groceries.

## Features

### Lists

- Create and manage multiple lists with real-time sync across devices and tabs
- Resume the last opened list on return visits
- Safe deletion with confirmation

### Items

- Add, edit, complete, and delete items
- Inline editing (Enter to save, Escape to cancel)
- Sort by completion state (normal, completed on top, completed on bottom)
- Drag-and-drop reordering within a list

### Templates

- Define reusable item sets (e.g. a standard grocery run)
- Start a new list from a template on the home screen
- Edit and delete templates; existing lists created from a template are unaffected

### Groupings

- Create grouping schemes with named groups and aliases (e.g. aisle or category labels)
- Apply a scheme to any list; items are matched into sections by text
- Reorder groups per list; delete schemes with type-to-confirm when in use

### Sync and UI

- Firestore-backed persistence with live updates
- Light/dark theme toggle
- Toast feedback for actions and errors
- Mobile-friendly layout; 16px inputs on small screens to avoid iOS zoom on focus

## Quick Start

### Prerequisites

- Node.js 18+ and Yarn
- A Firebase project with Firestore enabled

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/kristkam/tododos.git
   cd tododos
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Configure Firebase:

   ```bash
   cp .env.example .env.local
   ```

   Fill in `.env.local` with your Firebase project values (`VITE_FIREBASE_*`).

4. Start the dev server:

   ```bash
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173).

### Scripts

| Command | Description |
| --- | --- |
| `yarn dev` | Start Vite dev server |
| `yarn build` | Typecheck and production build |
| `yarn preview` | Serve the production build locally |
| `yarn lint` | Run ESLint |
| `yarn test` | Run Vitest once |
| `yarn test:watch` | Run Vitest in watch mode |

## Tech Stack

| Area | Choices |
| --- | --- |
| UI | React 19, TypeScript, CSS |
| Routing | React Router 7 |
| Data | Firebase Firestore (SDK v12) |
| Interaction | `@dnd-kit` for drag-and-drop |
| Tooling | Vite 7, ESLint, React Compiler, Vitest, Testing Library |

## Project Structure

```
src/
├── App.tsx                 # Providers and route definitions
├── App.css                 # Global styles
├── main.tsx                # Entry point
├── types.ts                # Shared domain types
├── storage.ts              # localStorage (e.g. current list, theme)
├── components/             # UI (lists, items, editors, modals, shell)
├── routes/                 # Route screens (lists, list detail, templates, groupings)
├── contexts/               # Todo lists, templates, groupings, theme, toast
├── firebase/               # Config, Firestore services, storage adapters
├── lib/                    # Pure logic (sorting, grouping match, reducers, invariants)
├── theme/                  # Theme tokens
├── hooks/                  # useToast and similar
└── test/                   # Vitest setup
```

## Implementation Notes

- **Data domains** — Lists, templates, and grouping schemes are separate Firestore collections with dedicated services and React contexts; routes map to each area (`/`, `/lists/:id`, `/templates`, `/groupings`).
- **Grouping** — `matchItemsToGroups` assigns items to scheme groups using normalized names and aliases; lists store an optional `activeGroupingId` and per-list `groupOrder`.
- **Templates** — `materializeTemplateItems` seeds a new list from template rows without copying completion state.
- **UI state** — Theme and “current list” id live in `localStorage`; list content and metadata live in Firestore.
- **Updates** — List and item mutations use optimistic patterns where it improves perceived speed; Firestore `onSnapshot` keeps views in sync.

## Acknowledgments

- [Vite](https://vitejs.dev/) for dev and build
- [Firebase](https://firebase.google.com/) for real-time storage
