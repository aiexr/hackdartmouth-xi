# DaisyUI Migration Plan for LeetSpeak

## Executive Summary

LeetSpeak is migrating from shadcn/ui (Radix-based components) to **DaisyUI 5.5.19** for a cleaner, more maintainable component system. The migration is **~70% complete** with core components already using DaisyUI classes.

**Status:** Hybrid state - DaisyUI installed and partially integrated, but custom CSS variables and some Radix primitives remain.

**Goal:** Complete DaisyUI integration with custom LeetSpeak theme, remove all Radix dependencies, and ensure consistent styling across the application.

---

## Current State Analysis

### ✅ Already Migrated Components

These components are already using DaisyUI classes:

1. **Button** ([`components/ui/button.tsx`](../components/ui/button.tsx))
   - Uses: `btn`, `btn-primary`, `btn-secondary`, `btn-outline`, `btn-ghost`, `btn-link`
   - Uses: `btn-sm`, `btn-lg` for sizing
   - ⚠️ Still uses Radix `Slot` for `asChild` pattern

2. **Card** ([`components/ui/card.tsx`](../components/ui/card.tsx))
   - Uses: `card`, `card-bordered`, `card-body`, `card-title`
   - ✅ Fully DaisyUI native

3. **Badge** ([`components/ui/badge.tsx`](../components/ui/badge.tsx))
   - Uses: `badge`, `badge-neutral`
   - ✅ Fully DaisyUI native

4. **Input** ([`components/ui/input.tsx`](../components/ui/input.tsx))
   - Uses: `input`, `input-bordered`, `input-primary`
   - ✅ Fully DaisyUI native

5. **Textarea** ([`components/ui/textarea.tsx`](../components/ui/textarea.tsx))
   - Uses: `textarea`, `textarea-bordered`
   - ✅ Fully DaisyUI native

6. **Progress** ([`components/ui/progress.tsx`](../components/ui/progress.tsx))
   - Uses: `progress`, `progress-primary`
   - ✅ Fully DaisyUI native

### ⚠️ Partially Migrated Components

1. **Switch** ([`components/ui/switch.tsx`](../components/ui/switch.tsx))
   - ❌ Still uses `@radix-ui/react-switch` primitive
   - Has DaisyUI classes (`toggle`, `toggle-primary`) but wraps Radix component
   - **Action Required:** Replace with pure DaisyUI toggle

### 🎨 Theme Configuration Issues

**Current Setup:**
- DaisyUI plugin configured in [`app/globals.css`](../app/globals.css:2-4) with `business` theme
- Custom CSS variables defined in `:root` (lines 6-33)
- HTML has `data-theme="business"` attribute

**Problems:**
1. **Dual theme system** - Custom variables compete with DaisyUI's semantic tokens
2. **Inconsistent color usage** - Some components use custom vars, others use DaisyUI
3. **Maintenance burden** - Two sources of truth for colors

**Current Custom Colors:**
```css
--background: #fafaf8 (warm off-white)
--foreground: #1a1a2e (dark navy)
--primary: #4f46e5 (indigo)
--secondary: #f0effc (light indigo)
--muted: #f3f3f0 (warm gray)
--accent: #ecfdf5 (mint green)
--destructive: #ef4444 (red)
--border: rgba(0, 0, 0, 0.08)
```

### 📦 Dependencies to Remove

**Radix UI packages still installed:**
- `@radix-ui/react-progress` (v1.1.7) - ❌ Not needed, DaisyUI has native progress
- `@radix-ui/react-slot` (v1.2.3) - ⚠️ Used by Button for `asChild` pattern
- `@radix-ui/react-switch` (v1.2.6) - ❌ Not needed, DaisyUI has native toggle

**Other dependencies:**
- `class-variance-authority` (v0.7.1) - ✅ Keep for Button variants

---

## Migration Strategy

### Phase 1: Theme Foundation ✨

**Goal:** Create a custom DaisyUI theme with LeetSpeak's exact brand colors

**Actions:**

1. **Define custom DaisyUI theme** in [`app/globals.css`](../app/globals.css)
   ```css
   @plugin "daisyui" {
     themes: [
       {
         leetspeak: {
           "primary": "#4f46e5",           // Indigo
           "primary-content": "#ffffff",
           "secondary": "#f0effc",         // Light indigo
           "secondary-content": "#4f46e5",
           "accent": "#059669",            // Emerald (for success states)
           "accent-content": "#ffffff",
           "neutral": "#1a1a2e",           // Dark navy
           "neutral-content": "#ffffff",
           "base-100": "#ffffff",          // Card background
           "base-200": "#fafaf8",          // Page background
           "base-300": "#f3f3f0",          // Muted background
           "base-content": "#1a1a2e",      // Text color
           "info": "#3b82f6",
           "success": "#059669",
           "warning": "#f59e0b",
           "error": "#ef4444",
           "--rounded-box": "0px",         // Square cards
           "--rounded-btn": "0px",         // Square buttons
           "--rounded-badge": "0px",       // Square badges
           "--border-btn": "1px",
         }
       }
     ];
   }
   ```

2. **Update HTML theme attribute** in [`app/layout.tsx`](../app/layout.tsx:32)
   ```tsx
   <html lang="en" data-theme="leetspeak">
   ```

3. **Remove custom CSS variables** from `:root` in [`app/globals.css`](../app/globals.css:6-65)
   - Delete lines 6-65 (custom color variables)
   - Keep typography and base styles (lines 67-132)

4. **Update Tailwind theme** to reference DaisyUI tokens
   - Remove `@theme inline` block (lines 35-65)
   - DaisyUI will provide all color tokens automatically

### Phase 2: Component Updates 🔧

#### 2.1 Switch Component

**File:** [`components/ui/switch.tsx`](../components/ui/switch.tsx)

**Current:**
```tsx
import * as SwitchPrimitive from "@radix-ui/react-switch";

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root className={cn("toggle toggle-primary ...")} {...props}>
      <SwitchPrimitive.Thumb className="toggle-circle ..." />
    </SwitchPrimitive.Root>
  );
}
```

**Replace with:**
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function Switch({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  ...props
}: {
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
} & Omit<React.ComponentProps<"input">, "type" | "onChange">) {
  return (
    <input
      type="checkbox"
      className={cn("toggle toggle-primary", className)}
      checked={checked}
      defaultChecked={defaultChecked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      {...props}
    />
  );
}
```

**Impact:** Settings page uses Switch component - verify functionality after change.

#### 2.2 Button Component - asChild Pattern

**File:** [`components/ui/button.tsx`](../components/ui/button.tsx)

**Current Usage Pattern:**
```tsx
<Button asChild>
  <Link href="/practice">Start Practice</Link>
</Button>
```

**Option A: Keep Radix Slot** (Recommended for minimal changes)
- Keep `@radix-ui/react-slot` dependency
- Maintains current API
- No changes needed in consuming components

**Option B: Remove asChild, use wrapper pattern**
```tsx
// Remove Slot import and asChild prop
export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

// Usage changes to:
<Link href="/practice">
  <Button>Start Practice</Button>
</Link>
```

**Recommendation:** Keep Option A (Radix Slot) for now - it's a small dependency and prevents breaking changes across 20+ usage sites.

#### 2.3 Component Class Audit

**Files to review for DaisyUI class consistency:**

1. **Status Grid** ([`components/app/status-grid.tsx`](../components/app/status-grid.tsx))
   - Line 39: `bg-secondary text-secondary-foreground` ✅ Good
   - Line 43: Custom conditional classes - verify colors match theme

2. **Streak Card** ([`components/app/streak-card.tsx`](../components/app/streak-card.tsx))
   - Line 49: `bg-card` - should use `bg-base-100`
   - Line 51: Custom `bg` prop - ensure uses DaisyUI color classes

3. **Coach Conversation** ([`components/app/coach-conversation.tsx`](../components/app/coach-conversation.tsx))
   - Line 35: `bg-white/80` - should use `bg-base-100/80`
   - Line 37: `rounded-full` - conflicts with square design, change to `rounded-none`
   - Line 49: `bg-white/85` - should use `bg-base-100/85`
   - Line 65: `rounded-full` - change to `rounded-none`
   - Line 74: `rounded-lg` - change to `rounded-none`

4. **Settings Panel** ([`components/app/settings-panel.tsx`](../components/app/settings-panel.tsx))
   - Line 41: `bg-white/80` - should use `bg-base-100/80`
   - Line 44: `rounded-full` - change to `rounded-none`

5. **Profile Editor** ([`components/app/profile-editor.tsx`](../components/app/profile-editor.tsx))
   - Line 226: `rounded-lg` - change to `rounded-none`
   - Line 233: `rounded-lg` - change to `rounded-none`
   - Line 263: `rounded-2xl` - change to `rounded-none`
   - Line 322: `rounded-lg` - change to `rounded-none`
   - Line 333: `rounded-xl` - change to `rounded-none`
   - Line 355: `rounded-lg` - change to `rounded-none`

6. **Main Shell** ([`components/app/main-shell.tsx`](../components/app/main-shell.tsx))
   - All components already use `rounded-none` ✅
   - Uses `bg-card` - should use `bg-base-100`

7. **Practice Session** ([`components/app/practice-session.tsx`](../components/app/practice-session.tsx))
   - Line 426: `bg-white/75` - should use `bg-base-100/75`
   - Line 476: `bg-white` - should use `bg-base-100`
   - Line 689: `bg-white/85` - should use `bg-base-100/85`

8. **Live Avatar** ([`components/app/live-avatar.tsx`](../components/app/live-avatar.tsx))
   - All rounded classes already use `rounded-none` ✅

9. **Voice Call** ([`components/app/voice-call.tsx`](../components/app/voice-call.tsx))
   - All rounded classes already use `rounded-none` ✅

### Phase 3: Systematic Class Replacements 🎯

**Global Find & Replace Operations:**

| Find | Replace | Reason |
|------|---------|--------|
| `bg-white` | `bg-base-100` | Use DaisyUI semantic token |
| `bg-white/80` | `bg-base-100/80` | Use DaisyUI semantic token with opacity |
| `bg-white/85` | `bg-base-100/85` | Use DaisyUI semantic token with opacity |
| `bg-white/75` | `bg-base-100/75` | Use DaisyUI semantic token with opacity |
| `bg-card` | `bg-base-100` | DaisyUI uses base-100 for cards |
| `text-base-content/70` | `text-base-content/70` | ✅ Already correct |
| `rounded-full` | `rounded-none` | Match square design system |
| `rounded-lg` | `rounded-none` | Match square design system |
| `rounded-xl` | `rounded-none` | Match square design system |
| `rounded-2xl` | `rounded-none` | Match square design system |

**⚠️ Exceptions - DO NOT replace:**
- Avatar images in profile (can stay rounded if desired)
- Any third-party component wrappers
- Monaco editor container (keep as-is)

### Phase 4: Dependency Cleanup 🧹

**Remove from [`package.json`](../package.json):**

```json
{
  "dependencies": {
    "@radix-ui/react-progress": "^1.1.7",  // ❌ Remove
    "@radix-ui/react-switch": "^1.2.6",    // ❌ Remove
    "@radix-ui/react-slot": "^1.2.3",      // ⚠️ Keep if using asChild pattern
  }
}
```

**Commands:**
```bash
npm uninstall @radix-ui/react-progress @radix-ui/react-switch
# Only if removing asChild pattern:
# npm uninstall @radix-ui/react-slot
```

### Phase 5: Testing & Validation ✅

**Pages to test visually:**

1. **Dashboard** ([`/`](../app/page.tsx))
   - Weekly progress card
   - Suggested scenarios
   - Streak stats
   - Activity calendar

2. **Practice Index** ([`/practice`](../app/practice/page.tsx))
   - Scenario cards
   - Search input
   - Filter badges

3. **Practice Session** ([`/practice/[scenarioId]`](../app/practice/[scenarioId]/page.tsx))
   - Header progress bar
   - Avatar/voice mode toggle
   - Coding editor (technical rounds)
   - Side panel tabs (rubric, hints, transcript)
   - Control buttons

4. **Review** ([`/review/[scenarioId]`](../app/review/[scenarioId]/page.tsx))
   - Score display
   - Rubric breakdown
   - Feedback sections

5. **Profile** ([`/profile`](../app/profile/page.tsx))
   - Profile editor form
   - Resume upload
   - Track selection

6. **Coach** ([`/coach`](../app/coach/page.tsx))
   - Quick action cards
   - Chat interface
   - Message bubbles

7. **Settings** ([`/settings`](../app/settings/page.tsx))
   - Toggle switches
   - Setting cards

8. **LLM Sandbox** ([`/llm`](../app/llm/page.tsx))
   - Test interface
   - Input fields
   - Response display

**Validation Checklist:**

- [ ] All buttons render correctly with proper variants
- [ ] Cards have consistent styling and borders
- [ ] Input fields and textareas are properly styled
- [ ] Progress bars display correctly
- [ ] Badges render with correct colors
- [ ] Toggle switches work and look correct
- [ ] Color scheme matches LeetSpeak brand (indigo primary, warm neutrals)
- [ ] All corners are square (`rounded-none`)
- [ ] No visual regressions from previous design
- [ ] Responsive design works on mobile and desktop
- [ ] Dark mode (if applicable) works correctly

---

## Implementation Sequence

### Step 1: Create Custom Theme
1. Update [`app/globals.css`](../app/globals.css) with custom DaisyUI theme
2. Update [`app/layout.tsx`](../app/layout.tsx) to use `data-theme="leetspeak"`
3. Remove custom CSS variables from `:root`
4. Test that colors still look correct

### Step 2: Update Switch Component
1. Replace [`components/ui/switch.tsx`](../components/ui/switch.tsx) with pure DaisyUI toggle
2. Test on [`/settings`](../app/settings/page.tsx) page
3. Verify toggle functionality works

### Step 3: Systematic Class Updates
1. Run find & replace for `bg-white` → `bg-base-100`
2. Run find & replace for `bg-card` → `bg-base-100`
3. Run find & replace for `rounded-lg`, `rounded-xl`, `rounded-2xl` → `rounded-none`
4. Run find & replace for `rounded-full` → `rounded-none` (except avatars)
5. Manual review of each changed file

### Step 4: Component-Specific Fixes
1. Update [`components/app/coach-conversation.tsx`](../components/app/coach-conversation.tsx)
2. Update [`components/app/settings-panel.tsx`](../components/app/settings-panel.tsx)
3. Update [`components/app/profile-editor.tsx`](../components/app/profile-editor.tsx)
4. Update [`components/app/practice-session.tsx`](../components/app/practice-session.tsx)

### Step 5: Remove Dependencies
1. Run `npm uninstall @radix-ui/react-progress @radix-ui/react-switch`
2. Verify no import errors
3. Test build: `npm run build`

### Step 6: Full Testing
1. Test all 8 pages listed above
2. Test responsive design
3. Test all interactive elements
4. Fix any visual issues

### Step 7: Documentation
1. Create component usage guide
2. Document DaisyUI theme customization
3. Update README if needed

---

## Risk Assessment

### Low Risk ✅
- Theme creation (reversible)
- Class name updates (visual only)
- Progress component (already using DaisyUI)

### Medium Risk ⚠️
- Switch component replacement (functional change)
- Removing custom CSS variables (affects all pages)
- Global find & replace operations (could miss edge cases)

### High Risk 🔴
- None identified - migration is mostly cosmetic

### Mitigation Strategies
1. **Test incrementally** - Don't change everything at once
2. **Git commits per phase** - Easy rollback if needed
3. **Visual regression testing** - Screenshot before/after
4. **Functional testing** - Verify all interactive elements work

---

## Success Criteria

✅ Migration is complete when:

1. All components use DaisyUI classes exclusively
2. Custom CSS variables removed (except typography)
3. Single source of truth for colors (DaisyUI theme)
4. No Radix UI dependencies (except Slot if keeping asChild)
5. All pages render correctly with no visual regressions
6. Build succeeds with no errors
7. All interactive elements function correctly
8. Design system is consistent (square corners, indigo primary, warm neutrals)

---

## Rollback Plan

If migration causes issues:

1. **Revert theme changes** - Restore `business` theme and custom variables
2. **Revert component changes** - Git revert specific commits
3. **Reinstall dependencies** - `npm install @radix-ui/react-switch @radix-ui/react-progress`
4. **Test original state** - Verify app works as before

---

## Post-Migration Benefits

1. **Simpler maintenance** - One theme system instead of two
2. **Smaller bundle** - Fewer Radix dependencies
3. **Better DX** - DaisyUI's utility-first approach
4. **Easier theming** - Change colors in one place
5. **Better documentation** - DaisyUI has excellent docs
6. **Future-proof** - DaisyUI actively maintained

---

## Timeline Estimate

- **Phase 1 (Theme):** 1-2 hours
- **Phase 2 (Components):** 2-3 hours
- **Phase 3 (Class Updates):** 2-3 hours
- **Phase 4 (Dependencies):** 30 minutes
- **Phase 5 (Testing):** 2-3 hours
- **Phase 6 (Documentation):** 1 hour

**Total:** 8-12 hours of focused work

---

## Next Steps

Ready to proceed? Here's what to do:

1. **Review this plan** - Make sure you agree with the approach
2. **Switch to Code mode** - Ready to implement the changes
3. **Start with Phase 1** - Create the custom theme first
4. **Test incrementally** - Don't skip testing between phases

Would you like me to switch to Code mode and start implementing these changes?
