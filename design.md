# LeetSpeak Design System

## Design Philosophy

LeetSpeak's design is structured and focused — it should feel like a training gym. Clean, flat, sharp-edged, and highly readable. The interface stays out of the way during practice and surfaces information clearly everywhere else.

### Core Principles

1. **Instant Clarity** — every screen answers: What am I looking at? What do I do next? How am I improving?
2. **Immersive Focus** — practice sessions are distraction-free with the interviewer/editor as the center of attention
3. **Accessible Depth** — secondary elements (transcript, timer, rubric, hints) stay available without cluttering the main view
4. **Flat & Sharp** — no border radius anywhere, minimal shadows, strong borders for structure
5. **Intentional Color** — color signals progress, state, and difficulty — not decoration

---

## Styling Stack

- **Tailwind CSS v4** with `@theme inline` for custom token mapping
- **DaisyUI plugin** — themes: `corporate` (light), `dark`
- **shadcn/ui primitives** in `components/ui/` (Button, Card, Progress, Switch, Badge, Input, Textarea)
- Theme tokens defined as CSS custom properties in `app/globals.css`
- Dark mode via `data-theme="dark"` attribute on `<html>`, toggled in settings and persisted to localStorage

### Class vocabulary

The codebase uses a mix of DaisyUI semantic classes and custom theme tokens:

| DaisyUI class | Usage |
|---|---|
| `bg-base-100` | Card/panel backgrounds |
| `bg-base-200`, `bg-base-200/30` | Subtle fills, hover states, loading placeholders |
| `border-base-300` | Standard card/section borders |
| `text-base-content` | Primary text |
| `text-base-content/60`, `text-base-content/40` | Secondary/muted text |
| `btn`, `btn-sm`, `btn-ghost` | Buttons |
| `card`, `card-bordered` | Card containers |
| `input`, `input-bordered` | Form inputs |

| Custom token class | Usage |
|---|---|
| `bg-background` / `bg-foreground` | Page-level background/text (from CSS vars) |
| `bg-card` / `text-card-foreground` | Some shadcn/ui card surfaces |
| `text-primary` / `bg-primary` | Indigo accent (#4F46E5) |
| `border-border` | Default border color (maps to `--border`) |
| `text-muted-foreground` | Secondary text in shadcn/ui components |

Both vocabularies coexist. For new work, prefer DaisyUI classes for layout elements and theme consistency.

---

## Layout & Spacing

### Container Widths
- Main content pages: `max-w-5xl mx-auto`
- Page padding: `px-6 py-8 md:px-10 md:py-10`

### Padding Scale
- Large cards: `p-6`
- Medium cards / interactive items: `p-5`
- Compact cards / list items: `p-4`
- Buttons, pills, small elements: `p-2` or `p-3`

### Gap Scale
- Between major sections: `space-y-8` or `space-y-6`
- Card grids: `gap-6` or `gap-4`
- Card sub-groups: `gap-3`
- Inline icon + text: `gap-2`
- Tight inline: `gap-1` or `gap-1.5`

---

## Border Radius

**Everything is `rounded-none`.** All radii are set to `0px` in the theme:

```css
--radius: 0px;
--radius-sm: 0px;
--radius-md: 0px;
--radius-lg: 0px;
--radius-xl: 0px;
--radius-box: 0px;
--radius-field: 0px;
--radius-selector: 0px;
```

Do not introduce rounded corners. Cards, buttons, badges, inputs, progress bars, avatars — all sharp edges.

---

## Shadows & Elevation

Minimal. Almost nothing has a shadow at rest.

- **Default**: No shadow — use borders (`border border-border` or `border border-base-300`) for definition
- **Hover**: Subtle background change (`hover:bg-base-200/50`) rather than shadow
- **Floating panels**: Only modals/overlays get `shadow-lg`

---

## Colors & Semantic Meaning

### Primary (Indigo — #4F46E5)
- Main actions, CTA buttons, active tab states, progress ring fills
- Classes: `bg-indigo-600`, `text-indigo-600`, `hover:bg-indigo-700`, `bg-indigo-100`

### Emerald (Success / Easy)
- Easy difficulty, positive states, active day indicators
- Classes: `text-emerald-500`, `bg-emerald-50`, `text-emerald-700`, `border-emerald-200`

### Amber / Orange (Streaks / Medium)
- Medium difficulty, streaks, warmth/motivation
- Classes: `text-amber-500`, `bg-amber-50`, `text-amber-700`, `bg-orange-50`, `text-orange-500`

### Violet (Advanced)
- Advanced difficulty, leadership scenarios
- Classes: `text-violet-700`, `bg-violet-50`, `border-violet-200`

### Red (Hard / Destructive)
- Hard difficulty, errors, destructive actions
- Classes: `text-red-500`, `text-destructive`

### Background Hierarchy
- Page background: `bg-background` (light: `#fafaf8`, dark: `#13131f`)
- Card/panel: `bg-base-100` (light: white, dark: `#1c1c2e`)
- Subtle fill: `bg-base-200/30`
- Borders: `border-border` (#1a1a2e light, #2e2e4a dark) or `border-base-300`

---

## Typography

Headings are styled globally in `app/globals.css` base layer. Do not override with Tailwind size classes unless needed.

- `<h1>`: Page titles — `text-2xl`, weight 500
- `<h2>`: Section headings — `text-xl`, weight 500
- `<h3>`: Card titles — `text-lg`, weight 500
- `<h4>`: Item titles — `text-base`, weight 500
- `<p>`: Body text — `leading-7`
- `<button>`: `text-base`, weight 500

### Font Sizes for UI Elements
- `text-sm` / `text-xs`: Secondary text, metadata, descriptions
- `text-[0.7rem]`: Column headers, table labels
- `text-[11px]` / `text-[10px]`: Tiny labels, premium badges, scenario counts
- `text-3xl` / `text-2xl`: Large stat numbers in dashboard cards

### Text Color
- Primary: `text-base-content` (inherits from theme)
- Secondary/muted: `text-base-content/60` or `text-base-content/50`
- Faded: `text-base-content/40` or `text-base-content/30`
- Colored: Only inside badges or difficulty labels

---

## Component Patterns

### Cards

Standard card:
```tsx
<div className="rounded-none border border-border bg-base-100 p-5">
  {/* content */}
</div>
```

Interactive card:
```tsx
<button className="group flex flex-col gap-3 rounded-none border border-base-300 bg-base-100 p-5 text-left transition hover:border-indigo-400 hover:bg-base-200/40">
  {/* content */}
  <ChevronRight className="size-4 text-base-content/30 transition group-hover:translate-x-0.5 group-hover:text-base-content/60" />
</button>
```

Table/list card:
```tsx
<div className="card card-bordered overflow-hidden bg-base-100">
  <div className="grid ... border-b border-base-300 px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.16em] text-base-content/50">
    {/* column headers */}
  </div>
  {items.map((item, idx) => (
    <button className={cn(
      "grid w-full ... px-4 py-3 text-left text-sm transition hover:bg-base-200/50",
      idx < items.length - 1 && "border-b border-base-300/50",
    )}>
      {/* row content */}
    </button>
  ))}
</div>
```

### Buttons

DaisyUI buttons:
```tsx
<button className="btn btn-sm gap-2 border-0 bg-indigo-600 text-white hover:bg-indigo-700">
  <Icon className="size-4" />
  Label
</button>

<button className="btn btn-sm btn-ghost gap-1.5">
  <Icon className="size-3.5" />
  Label
</button>
```

Filter/tab buttons:
```tsx
<button className={cn(
  "btn btn-sm gap-2",
  isActive
    ? "border-0 bg-indigo-600 text-white hover:bg-indigo-700"
    : "border border-base-300 bg-transparent text-base-content/60 hover:bg-base-200 hover:text-base-content",
)}>
```

### Difficulty Badges
- Easy: `text-emerald-500`
- Medium: `text-amber-500`
- Hard: `text-red-500`

### Filter Pills
```tsx
<button className={cn(
  "rounded-none border px-3 py-1.5 text-xs font-medium transition",
  isActive
    ? "border-current bg-current/5 text-{color}"
    : "border-base-300 bg-transparent text-base-content/60 hover:border-base-content/30",
)}>
```

### Stat Cards (Dashboard)
```tsx
<div className="flex flex-col items-center gap-2 rounded-none border border-border bg-base-100 p-4">
  <div className="flex size-10 items-center justify-center rounded-none bg-{color}-50">
    <Icon className="size-5 text-{color}-500" />
  </div>
  <div className="text-2xl font-semibold">{value}</div>
  <div className="text-xs text-base-content/60">{label}</div>
</div>
```

### Progress Ring (SVG)
```tsx
<svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="52" fill="none" stroke="#f0effc" strokeWidth="10" />
  <circle cx="60" cy="60" r="52" fill="none" stroke="#4f46e5" strokeWidth="10"
    strokeLinecap="round" strokeDasharray={`${(progress / 100) * 327} 327`} />
</svg>
```

### Icons (Lucide)
- Section headers: `size-5`
- Inline with text: `size-4`
- Small metadata: `size-3.5`
- Tiny: `size-3`

---

## Grid & Responsive Patterns

### Common Grids
```tsx
{/* Type/group cards */}
<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

{/* Stat cards */}
<div className="grid grid-cols-3 gap-3">

{/* Two-column split */}
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
  <div className="lg:col-span-3">{/* main */}</div>
  <div className="lg:col-span-2">{/* sidebar */}</div>
</div>
```

### Responsive Visibility
- Hide on mobile: `hidden md:flex` or `hidden md:block`
- Hide on desktop: `md:hidden`

---

## Dark Mode

Controlled via `data-theme` attribute (`corporate` or `dark`). Key token differences:

| Token | Light | Dark |
|---|---|---|
| `--background` | `#fafaf8` | `#13131f` |
| `--card` | `#ffffff` | `#1c1c2e` |
| `--foreground` | `#1a1a2e` | `#e5e5f0` |
| `--border` | `#1a1a2e` | `#2e2e4a` |
| `--muted` | `#f3f3f0` | `#1e1e2e` |

Theme-aware logos use `.theme-logo-light` / `.theme-logo-dark` CSS classes that toggle visibility based on `data-theme`.

---

## Navigation

### Desktop
Left sidebar with icon + label links. Active state uses `bg-base-200/80 text-base-content font-semibold`. Navigation items: Home, Practice, Profile, Coach, LLM, Settings.

### Mobile
Bottom tab bar with icons only. Same active state pattern.

---

## Transitions

- Card hover: `transition hover:border-indigo-400 hover:bg-base-200/40`
- Button hover: `transition hover:bg-indigo-700` or `hover:opacity-90 transition-opacity`
- Icon hover (in group): `transition group-hover:translate-x-0.5 group-hover:text-base-content/60`
- Default Tailwind timing (200ms). Don't customize.

---

## Do's and Don'ts

### Do
- Use `rounded-none` on everything
- Use `bg-base-100` + `border border-base-300` for card surfaces
- Use DaisyUI `btn` classes for buttons
- Keep shadows minimal — borders define structure
- Use `text-base-content/60` for secondary text
- Use semantic color for state (indigo = active, emerald = success, amber = warning, red = hard/error)
- Preserve generous spacing

### Don't
- Don't use rounded corners (`rounded-xl`, `rounded-2xl`, `rounded-full`, etc.)
- Don't use heavy shadows on cards
- Don't use color decoratively
- Don't override heading typography from globals.css without reason
- Don't use emojis in the UI
- Don't create tight/cramped layouts

---

## File References

- **Theme tokens**: `app/globals.css`
- **UI primitives**: `components/ui/` (button, card, progress, switch, badge, input, textarea)
- **App components**: `components/app/` (main-shell, practice-session, coach-conversation, settings-panel, etc.)
- **Icon library**: `lucide-react`
