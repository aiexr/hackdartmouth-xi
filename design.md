# LeetSpeak Design System

## Design Philosophy

LeetSpeak combines the **calm, structured approach of Brilliant** with the **warmth and motivation of Duolingo**. The design should feel like a training gym—clean, bright, and highly structured but approachable rather than intimidating.

### Core Principles

1. **Instant Clarity**: Every screen must instantly answer three questions:
   - What scenario am I in?
   - What do I do next?
   - How am I improving?

2. **Immersive Focus**: The core interaction (practice session) should be immersive and focused, with the avatar/interviewer as the center of attention

3. **Accessible Depth**: Secondary elements (transcript, timer, rubric, hints) stay accessible without cluttering the experience

4. **Visual Hierarchy**: Strong hierarchy with generous spacing, sharp-edged containers, and soft contrast

5. **Intentional Color**: Color signals progress, feedback, and state—not decoration

---

## Layout & Spacing

### Container Widths
- **Main content**: `max-w-5xl` (80rem / 1280px)
- **Centered**: `mx-auto` for all main containers

### Padding Scale
- **Page/Section padding**: `p-6 md:p-10` (1.5rem mobile, 2.5rem desktop)
- **Card padding (large)**: `p-6` (1.5rem) - for main cards with substantial content
- **Card padding (medium)**: `p-5` (1.25rem) - for secondary cards
- **Card padding (small)**: `p-4` (1rem) - for compact cards and list items
- **Tight padding**: `p-2` or `p-3` - for buttons, pills, small UI elements

### Gap Scale
- **Section gaps**: `space-y-8` (2rem) between major sections
- **Card groups**: `gap-6` (1.5rem) in grids
- **Related cards**: `gap-4` (1rem) for tightly related cards
- **List items**: `space-y-3` (0.75rem) for scenario lists
- **Inline elements**: `gap-2` (0.5rem) for icons + text
- **Tight inline**: `gap-1` or `gap-1.5` for labels and small elements

---

## Border Radius

### Card Radius
- **Primary cards**: `rounded-none` - all major cards, panels, containers
- **Secondary buttons**: `rounded-none` - buttons, input fields, smaller interactive elements
- **Pills/badges**: `rounded-none` - difficulty badges, tags, status indicators
- **Avatars**: `rounded-none` - keep profile and interviewer surfaces square
- **Progress bars**: `rounded-none` - keep the overall interface geometry consistent

### Consistency Rule
Use `rounded-none` as the default for all containers and controls. Do not introduce curved corners unless a future design change explicitly calls for them.

---

## Shadows & Elevation

### Shadow Scale (Minimal Approach)
LeetSpeak uses **minimal shadows** to maintain a clean, flat aesthetic with subtle depth:

- **No shadow (default)**: Most cards have no shadow at rest—rely on borders for definition
- **Hover shadow**: `hover:shadow-sm` - subtle shadow on hover for interactive cards
  - Translates to: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- **Avatar rings**: `ring-2 ring-white` - creates depth for avatars without heavy shadows
- **Focus states**: Browser default focus rings (accessible)

### When to Use Shadows
- **Interactive cards on hover**: Scenario cards, mistake cards, track cards
- **Floating panels**: Side panels in practice session (if applicable)
- **Modals/overlays**: Use `shadow-lg` or `shadow-xl` only for elements that truly float above content

### What NOT to Shadow
- Static content cards
- Progress indicators
- Headers and text sections
- Navigation elements

---

## Colors & Semantic Meaning

### Color Tokens (from theme.css)
LeetSpeak uses Tailwind v4 CSS variables. Reference `/src/styles/theme.css` for the source of truth.

### Semantic Color Usage

#### Primary (Indigo/Purple - #4F46E5)
- **Usage**: Main actions, primary progress indicators, weekly goals
- **Classes**: `bg-primary`, `text-primary`, `border-primary`
- **Where**: CTA buttons, progress ring fills, "Suggested for You" icon

#### Emerald (Success/Growth)
- **Usage**: Beginner difficulty, positive goals, achievements
- **Classes**: `bg-emerald-50`, `text-emerald-700`, `border-emerald-200`, `text-emerald-500`
- **Where**: Difficulty badges, "Current Goals" icon, success states

#### Amber/Orange (Warmth/Motivation)
- **Usage**: Streaks, warnings, areas for improvement, intermediate difficulty
- **Classes**: `bg-amber-50`, `text-amber-700`, `border-amber-200`, `from-amber-500 to-orange-500`
- **Where**: Mistake cards, streak card background, "Learn from Mistakes" icon

#### Violet/Purple (Advanced/Leadership)
- **Usage**: Advanced difficulty, leadership scenarios, premium features
- **Classes**: `bg-violet-50`, `text-violet-700`, `border-violet-200`, `from-violet-500 to-purple-500`
- **Where**: Advanced scenario badges, leadership track

#### Blue/Cyan (Technical/Communication)
- **Usage**: Technical scenarios, informational elements
- **Classes**: `from-blue-500 to-cyan-500`
- **Where**: Technical communication track

#### Background Hierarchy
- **Page background**: `bg-background` (light neutral)
- **Card background**: `bg-card` (white or near-white)
- **Border**: `border-border` (subtle gray)
- **Muted foreground**: `text-muted-foreground` (secondary text)

### Gradient Backgrounds
Used sparingly for emphasis:
- **Streak card**: `bg-gradient-to-br from-amber-50 to-orange-50`
- **Track icons**: `bg-gradient-to-br from-{color}-500 to-{color}-500`

---

## Typography

### Type Scale
LeetSpeak relies on semantic HTML headings with default styles from `/src/styles/theme.css`. Do NOT override these with Tailwind classes unless specifically needed.

- **`<h1>`**: Page titles (e.g., "Good morning, Alex")
- **`<h2>`**: Section headings (e.g., "Suggested for You", "Weekly Progress")
- **`<h3>`**: Card titles (e.g., "Weekly Progress" inside card)
- **`<h4>`**: Item titles (e.g., scenario titles, mistake titles)
- **`<p>`**: Body text

### Font Sizes for UI Elements
Use these sparingly—only when the semantic heading doesn't fit:

- **`text-[1.75rem]`**: Large numbers in progress indicators
- **`text-[1.5rem]`**: Streak count
- **`text-[0.875rem]`**: Secondary body text, button text, card descriptions
- **`text-[0.8125rem]`**: Metadata text (interviewer name, goal labels)
- **`text-[0.75rem]`**: Small labels, tags, helper text
- **`text-[0.6875rem]`**: Tiny labels (difficulty pills, progress percentages)

### Font Weight
Do NOT use Tailwind font weight classes (`font-bold`, `font-semibold`) unless absolutely necessary. Use inline styles for specific emphasis:

- **`style={{ fontWeight: 700 }}`**: Numbers, counts, critical data (e.g., "1/3", "7")
- **`style={{ fontWeight: 500 }}`**: Badges, pills, emphasized labels
- Default weight: Inherit from theme

### Text Color Patterns
- **Primary text**: `text-foreground` (default)
- **Secondary text**: `text-muted-foreground` (metadata, descriptions, helper text)
- **Colored text**: Only in badges/pills with matching backgrounds

---

## Component Patterns

### Cards

#### Standard Card
```tsx
<div className="bg-card rounded-2xl border border-border p-6">
  {/* content */}
</div>
```

#### Interactive Card (Hoverable)
```tsx
<div className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
  {/* content */}
</div>
```

#### Card with Gradient Section
```tsx
<div className="bg-card rounded-2xl border border-border overflow-hidden">
  <div className="p-6 border-b border-border">
    {/* main content */}
  </div>
  <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50">
    {/* highlighted content */}
  </div>
</div>
```

### Badges & Pills

#### Difficulty Badge
```tsx
<span className={`text-[0.6875rem] px-2 py-0.5 rounded-full border ${colorClasses}`} style={{ fontWeight: 500 }}>
  {label}
</span>
```

Color mappings:
- Beginner: `bg-emerald-50 text-emerald-700 border-emerald-200`
- Intermediate: `bg-amber-50 text-amber-700 border-amber-200`
- Advanced: `bg-violet-50 text-violet-700 border-violet-200`

### Buttons

#### Primary CTA
```tsx
<button className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
  <Icon className="w-4 h-4" />
  Button Text
</button>
```

#### Ghost/Text Button
```tsx
<button className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[0.875rem]">
  Action <ChevronRight className="w-4 h-4" />
</button>
```

### Avatars

#### Standard Avatar
```tsx
<ImageWithFallback
  src={avatarUrl}
  alt={name}
  className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
/>
```

Sizes:
- Small: `w-10 h-10`
- Medium: `w-12 h-12` (default for scenario lists)
- Large: `w-16 h-16` or larger (practice session)

### Progress Indicators

#### Linear Progress Bar
```tsx
<Progress value={percentage} className="h-2" />
```

Heights:
- Thin: `h-1.5` (mastery in scenario cards)
- Standard: `h-2` (goals, tracks)

#### Circular Progress Ring (SVG)
```tsx
<div className="relative w-32 h-32">
  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="50" fill="none" stroke="#F0EFFC" strokeWidth="10" />
    <circle cx="60" cy="60" r="50" fill="none" stroke="#4F46E5" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${progress * 314} 314`} />
  </svg>
  <div className="absolute inset-0 flex flex-col items-center justify-center">
    {/* centered content */}
  </div>
</div>
```

### Icon Usage

#### Icon Sizes
- **Section headers**: `w-5 h-5` (20px)
- **Inline with text**: `w-4 h-4` (16px)
- **Small metadata**: `w-3.5 h-3.5` (14px)
- **Large decorative**: `w-10 h-10` or larger

#### Icon + Text Pattern
```tsx
<div className="flex items-center gap-2">
  <Icon className="w-5 h-5 text-primary" />
  Heading Text
</div>
```

### Links

#### Scenario Card Link
```tsx
<Link
  to="/path"
  className="group flex items-center gap-4 bg-card rounded-2xl border border-border p-4 hover:border-primary/30 hover:shadow-sm transition-all"
>
  {/* Use group-hover for nested hover states */}
  <ArrowRight className="group-hover:text-primary transition-colors" />
</Link>
```

---

## Grid & Responsive Patterns

### Common Grid Layouts

#### Two-Column Split (Desktop)
```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
  <div className="lg:col-span-3">{/* main content */}</div>
  <div className="lg:col-span-2">{/* sidebar */}</div>
</div>
```

#### Two-Column Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* cards */}
</div>
```

#### Three-Column Cards
```tsx
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  {/* cards */}
</div>
```

### Responsive Visibility
- **Hide on mobile**: `hidden md:flex` or `hidden md:block`
- **Hide on desktop**: `md:hidden`

---

## Animation & Transitions

### Transition Classes
- **All properties**: `transition-all` - for cards with multiple hover changes
- **Specific properties**: `transition-colors`, `transition-opacity`, `transition-shadow`
- **Speed**: Use default Tailwind timing (200ms) - do NOT customize

### Common Patterns
- **Card hover**: `hover:border-primary/30 hover:shadow-sm transition-all`
- **Button hover**: `hover:opacity-90 transition-opacity`
- **Icon hover**: `group-hover:text-primary transition-colors`
- **Text hover**: `hover:text-foreground transition-colors`

### Animated Elements (Motion)
For complex animations (feedback scores, entrance animations), use `motion/react`:
```tsx
import { motion } from "motion/react";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  {/* content */}
</motion.div>
```

---

## Page-Specific Patterns

### Dashboard
- **Max width**: `max-w-5xl mx-auto`
- **Section spacing**: `space-y-8`
- **Grid split**: 3-column main content, 2-column sidebar
- **Card density**: Medium (p-5 or p-6)

### Practice Session
- **Layout**: Centered avatar, side panels
- **Avatar size**: Large and prominent
- **Panel style**: Minimal borders, subtle backgrounds
- **Focus**: Immersive, distraction-free

### Review Feedback
- **Score cards**: Large numbers with motion animations
- **Color coding**: Emerald for good, amber for needs work
- **Actionable tips**: Clear, concise, bulleted

### Profile & Settings
- **Form spacing**: Generous vertical rhythm
- **Input style**: `rounded-xl` borders
- **Section dividers**: Subtle borders or spacing

---

## Accessibility Guidelines

### Color Contrast
- All text meets WCAG AA standards
- Never rely on color alone to convey information
- Use icons + color for status/categories

### Interactive States
- **Hover**: Visual feedback on all interactive elements
- **Focus**: Preserve browser default focus rings (do not remove with `outline-none` unless providing custom focus styles)
- **Active**: Subtle scale or opacity change

### Semantic HTML
- Use proper heading hierarchy (`<h1>` → `<h2>` → `<h3>`)
- Use `<button>` for actions, `<Link>` for navigation
- Include alt text for all images

---

## Do's and Don'ts

### ✅ Do
- Use `rounded-2xl` for all card containers
- Use `bg-card` + `border border-border` for card backgrounds
- Keep shadows minimal (`hover:shadow-sm`)
- Use semantic color (primary for actions, emerald for success, amber for warnings)
- Preserve generous spacing (`gap-6`, `p-6`)
- Use `text-muted-foreground` for secondary text
- Default to semantic HTML headings

### ❌ Don't
- Don't use emojis anywhere in the UI
- Don't use heavy shadows (`shadow-lg`, `shadow-2xl`) on standard cards
- Don't mix border radius (stick to `rounded-2xl` or `rounded-xl`)
- Don't use Tailwind font-size classes for headings (e.g., `text-2xl` on `<h1>`)
- Don't use font-weight classes (`font-bold`, `font-semibold`) unless necessary
- Don't use color decoratively—every color should signal something
- Don't create tight, cramped layouts—embrace whitespace
- Don't override theme.css typography defaults without reason

---

## File References

- **Theme tokens**: `/src/styles/theme.css`
- **Font imports**: `/src/styles/fonts.css`
- **Progress component**: `/src/app/components/ui/progress.tsx`
- **Image component**: `/src/app/components/figma/ImageWithFallback.tsx`

---

## Version & Updates

**Last updated**: 2026-04-11  
**Maintained by**: LeetSpeak design team

When in doubt, refer to existing components in `/src/app/components/` for live examples of these patterns in practice.
