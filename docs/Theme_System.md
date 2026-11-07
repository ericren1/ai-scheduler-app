# Personal Hub theme system

## Tokens and scope

`frontend/src/tokens.css` is the palette source of truth. The root defaults to Deep Indigo, using the approved visual reference: purple-tinted dark surfaces, lavender selection/focus, teal success, and warm amber accents. `:root[data-theme='light']` overrides semantic colors while sharing typography, spacing, radii, and layout geometry. Browser `color-scheme` follows the selected theme so native selects, time inputs, and scrollbars agree with the workspace.

The compact Planner footer echoes the reference's palette strip using the actual semantic tokens, and links to Settings. It takes 30px of viewport height; calendar scrolling fills the remaining space without page overflow. It is not a set of inert theme-switch buttons. The dark storage value remains `dark` to preserve existing selections, while Settings displays the name Deep Indigo. Light mode remains available with its own palette.

Components consume semantic variables: `--background`, `--surface`, `--surface-subtle`, `--surface-sidebar`, `--surface-elevated`, `--surface-hover`, text variants, borders, selection, focus, scrollbar, backdrop, and shadows. Indigo represents selection/navigation/focus, teal represents completion/success, and amber marks development tooling and future warning states. These roles can be reused by Training, Insights, and other future modules without introducing module-specific palettes.

Activity categories remain data, not theme definitions. Cards receive their canonical category color through a CSS custom property; their background tint and border are mixed against the active theme's semantic surfaces/text. Dark mode uses lifted category borders and subdued graphite tints. Light mode uses pale category fills and darker borders. Missing category data retains the existing view-helper fallback. Neither category records nor scheduling models change.

Completed activities use a reduced background tint and secondary text rather than container opacity, preserving readable labels and native popover details. The completion check uses the semantic success color. Hover, focus, disabled, invalid-input, native selected options, and active navigation states are themed. Today uses a solid accent wash, bottom border, and contrasting date circle; no gradient is needed.

## State and local persistence

- `src/utils/theme.ts`: the `Theme` union, dedicated `personal-hub.theme` key, and defensive read/write helpers.
- `src/main.tsx`: applies and verifies the saved theme before React mounts. Missing or invalid values use dark. CSS is dark by default as well, avoiding an initial light flash.
- `src/state/ThemeContext.ts` and `ThemeProvider.tsx`: shared React state, root attribute synchronization, and persistence status. Storage writes happen during initialization and explicit theme selection, separately from scheduling preferences.
- Settings → Appearance exposes a labeled native select. Selection applies immediately across routes and reloads without a backend. An inaccessible/full storage area falls back safely; session theme changes still work and Settings reports that they cannot be saved.

There is no automatic system-theme option, cross-tab synchronization, account synchronization, or theme scheduling in this increment. Browser-local persistence is scoped to the current origin, so a different host/port has its own selection. Daily scheduling preferences remain in-memory as before; saving a theme does not make scheduling settings persistent.

## Layout and calendar invariants

This pass preserves the compact toolbar, sidebar widths/collapse, row expansion, responsive breakpoints, and elapsed-time calendar geometry. It does not change date utilities, DST rules, data models, record placement, or read-only behavior. Calendar scrolling retains a stable scrollbar gutter to reduce width shifts; toolbar menus have bounded internal scrolling in shorter viewports. Tasks, Goals, and Settings inherit global themed surfaces and text.

## Verification

Run `npm test`, `npm run lint`, and `npm run build` from `frontend`. Focused theme tests cover defaults, invalid preferences, blocked reads/writes, and isolation of the storage key. Existing calendar tests continue to run in UTC, Toronto, and Berlin.

Headless Chrome checks verified dark first load, light/dark selection surviving reload and route navigation, blocked-storage fallback, distinctive category borders, and sampled text contrast of at least 4.5:1 for primary/secondary/muted text against elevated surfaces and card text/metadata on both sample datasets in both themes. This is a focused check of the current fixtures, not a blanket accessibility certification for arbitrary future category colors. Existing browser smoke checks also cover DST, compact layout, row expansion, keyboard Escape/focus, and no page overflow at narrow widths.

Manual checks:

1. Start `npm run dev`. With no saved theme preference, open Planner: the initial workspace should be graphite, including navigation, toolbar, rows, grid, and Tasks panel.
2. In Settings → Appearance choose Light, navigate through Tasks, Goals, and Planner, then refresh. Light must remain selected. Repeat with Dark.
3. In Planner open Dev and inspect both Synthetic and Realistic samples. Confirm category color differences, readable time labels, muted completed cards, and a teal completion check. The realistic meeting remains Thursday 13:00–14:00 Toronto time.
4. Open card details, Hours, and Dev. Check elevated backgrounds, native controls, keyboard focus, Escape dismissal, hover states, active navigation, and Today. There should be no bright unthemed white panels in dark mode.
5. Resize the window, collapse navigation, and open Tasks. Confirm internal calendar scrolling and unchanged geometry. Use Full day on a DST transition week to confirm per-day offset labels still appear.
6. If browser storage is blocked, confirm the app remains usable, theme changes apply in-session, and Settings explains that the choice may reset on reload.

The user approved committing and publishing the theme work with the Planner follow-up for review. This does not authorize automatic merging. Theme selection continues to use browser-local storage independently of Git publication.
