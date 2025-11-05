# DirectTip Design Guidelines

## Design Approach

**Hybrid Approach: Fintech Trust + Consumer Simplicity**

Drawing inspiration from:
- **Stripe Dashboard**: Clean data presentation, professional trust indicators, clear status badges
- **Cash App/Venmo**: Approachable payment flows, large touch targets, confirmation feedback
- **Linear**: Sharp typography hierarchy, minimal UI chrome, purposeful spacing

**Core Principles:**
1. **Trust-First**: Every interaction reinforces security and transparency
2. **Zero-Friction Tipping**: Public tip flow optimized for speed (3 taps maximum)
3. **Data Clarity**: Financial information presented with precision and context
4. **Mobile-Primary**: Touch-optimized, thumb-friendly zones

---

## Typography System

**Font Stack:**
- Primary: Inter (via Google Fonts CDN) - clean, professional, excellent at small sizes
- Monospace: JetBrains Mono - for amounts, transaction IDs, codes

**Hierarchy:**
- Hero/Marketing: text-5xl to text-6xl, font-bold
- Page Titles: text-3xl, font-semibold
- Section Headers: text-xl, font-semibold
- Card Titles: text-lg, font-medium
- Body Text: text-base, font-normal
- Labels/Meta: text-sm, font-medium
- Amounts/Numbers: text-2xl to text-4xl, font-bold, tabular-nums
- Micro-copy: text-xs, font-normal

**Reading Width:** max-w-prose for paragraphs, max-w-2xl for forms

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 3, 4, 6, 8, 12, 16, 20, 24

**Container Strategy:**
- Marketing pages: max-w-7xl with px-4 md:px-8
- App pages: max-w-6xl with px-4 md:px-6
- Dashboards: max-w-screen-2xl with px-4 md:px-6 lg:px-8
- Forms/Cards: max-w-md to max-w-2xl centered

**Grid Patterns:**
- Stats/Metrics: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
- Tip Cards: grid-cols-1 gap-3
- Admin Tables: Full-width responsive tables with sticky headers

**Vertical Rhythm:** Consistent py-12 md:py-16 lg:py-20 for major sections

---

## Component Library

### Navigation
**Main Nav (Marketing):**
- Fixed top bar, backdrop-blur, border-b
- Logo left, Sign In right
- Height: h-16, flex items-center justify-between

**Dashboard Nav:**
- Sidebar on desktop (w-64, fixed left), bottom tab bar on mobile
- Active state: Border accent on left (desktop) or bottom (mobile)
- Icons + labels, p-3 touch targets

### Public Tip Page (/{handle})

**Layout Structure:**
1. **Worker Header Card** (top third of viewport):
   - Centered avatar (w-24 h-24, rounded-full, ring-4 ring-offset-2)
   - Display name (text-2xl font-bold)
   - Tagline: "Tips go directly to [Name]" (text-sm, subdued)
   - Trust badge: "Powered by Stripe" with logo

2. **Amount Selection** (center focus):
   - 4-chip grid: grid-cols-2 gap-3, each min-h-16
   - Preset chips: Large text-xl amounts, "Popular" tag on $5
   - Custom chip: Opens numeric input (text-3xl, monospace)
   - Active state: ring-2, transform scale-105

3. **Optional Note Field:**
   - Expandable textarea, placeholder: "Leave a note (optional)"
   - Character limit: 200, shown on focus

4. **Payment Element Container:**
   - Appears after amount selected
   - White card with p-6, rounded-xl, shadow-lg
   - "Payment Details" header (text-lg font-semibold)
   - Stripe Element mounts here
   - Payment Request Button above element (Apple/Google Pay)

5. **Submit Button:**
   - Full-width, min-h-14, rounded-xl, text-lg font-semibold
   - Fixed to bottom on mobile with safe-area-inset-bottom
   - Shows amount: "Send $5.00 Tip"

**Success Screen:**
- Full-screen takeover with checkmark animation (CSS only, scale + opacity)
- "Thank you!" headline (text-4xl)
- Confirmation: "[Name] received your $X.XX tip"
- Optional: "Send Another Tip" secondary button

### Worker Dashboard

**Overview Cards Grid:**
- 3-stat row: Today | 7 Days | 30 Days
- Each card: Stat value (text-4xl, tabular-nums), label below (text-sm)
- Subtle up/down trend indicators

**Tips List:**
- Card-based, not table on mobile
- Each tip card contains:
  - Amount (text-2xl, font-bold, right-aligned)
  - Timestamp (text-sm, relative: "2 hours ago")
  - Note preview (text-sm, italic, max-lines-2)
  - Status badge (pill shape, text-xs)
- Infinite scroll or "Load More" button

**QR Code Page:**
- Centered QR code (canvas rendered, 300x300)
- Worker info above QR
- Download button below (w-full md:w-auto)
- Share button (native share API on mobile)

### Forms (Login/Onboarding)

**OTP Login:**
- Single-column centered (max-w-md)
- Email input with type="email", autocomplete
- Large submit button (min-h-12)
- OTP verification: 6-digit input boxes (w-12 h-12, text-2xl, centered)

**Worker Onboarding:**
- Multi-step progress indicator (stepper with 3 dots)
- One field per screen on mobile
- Handle input: Prefix display "@", live validation feedback
- Photo upload: Drag-drop zone or tap to select, circular crop preview

### Admin Panel

**Workers Table:**
- Responsive: Cards on mobile, table on desktop
- Columns: Avatar, Name, Handle, Tips Enabled, Last Tip, Actions
- Inline actions: Suspend toggle (switch component)
- Search bar sticky at top

**Settings Card:**
- Platform fee input: Number input with "%" or "bps" toggle
- Live preview calculation on sample amounts
- Save button (shows loading state)

### Status Indicators

**Badges:**
- Pill shape: px-3 py-1, rounded-full, text-xs font-medium
- States: Pending, Verified, Succeeded, Refunded, Disputed
- Icons prefix badges (size-3)

**Trust Indicators:**
- Stripe badge: Small logo + "Secured by Stripe" (text-xs)
- SSL lock icon + "Encrypted" on payment pages

---

## PWA Specific Elements

**Install Prompt (Marketing Page):**
- Floating card: bottom-4, rounded-2xl, shadow-xl, p-4
- App icon preview, "Install DirectTip" headline
- Dismiss X button top-right

**Offline Indicator:**
- Toast notification at top: "You're offline. Showing cached data."
- Retry button for failed actions

**Mobile Optimizations:**
- All interactive elements min-h-12 (48px touch target)
- Bottom sheets for modals on mobile
- Pull-to-refresh on tip lists
- Haptic feedback class names for native feel

---

## Animation Constraints

**Use Sparingly:**
- Success checkmark: Single scale + opacity transition (300ms)
- Card hovers: subtle lift (translateY -2px, 200ms)
- Loading states: Simple spinner or skeleton screens
- NO scroll animations, parallax, or decorative motion

---

## Images

**Hero Image (Marketing Landing):**
- Full-width hero section showcasing a real-world tipping scenario
- Image: Wide shot of service worker (barista, delivery person, etc.) smiling while looking at phone
- Image treatment: Slight gradient overlay (top to bottom) for text legibility
- Placement: Background image with content overlaid
- Text on image: Use backdrop-blur-sm bg-white/10 for button backgrounds

**Worker Profile Photos:**
- Circular avatars throughout
- Fallback: Initials in circle with generated background
- Sizes: w-24 h-24 (tip page), w-12 h-12 (dashboard), w-16 h-16 (admin)

**Trust/Security Imagery:**
- Stripe logo as SVG inline (small, 80px width)
- Lock icon for "Secure Payment" callout
- No decorative illustrations - keep functional

**QR Code:**
- Generated canvas element, black on white, 300x300
- Quiet zone padding built-in
- Optional: Centered logo overlay (small, 40x40)

---

## Responsive Breakpoints

- Mobile: Base styles (< 640px)
- Tablet: md: (640px+) - 2-column layouts emerge
- Desktop: lg: (1024px+) - Sidebar nav, 3-4 column grids
- Wide: xl: (1280px+) - Max container widths apply

**Mobile-First Priorities:**
1. Tip page optimized for one-handed use
2. Bottom navigation on mobile, sidebar on desktop
3. Forms use native mobile inputs (numeric keyboards, email keyboards)
4. Modals become bottom sheets on mobile

---

## Accessibility Standards

- All form inputs have visible labels (not just placeholders)
- Focus states: ring-2 ring-offset-2 on all interactive elements
- Color contrast ratios maintain WCAG AA minimum
- Skip-to-content link for keyboard navigation
- aria-labels on icon-only buttons
- Loading states announced to screen readers
- Error messages linked to inputs via aria-describedby

---

**Final Notes:**
This design prioritizes trust and speed. The public tip flow is optimized for under 30 seconds from QR scan to confirmation. Dashboard emphasizes data clarity with generous spacing and clear visual hierarchy. Every component reinforces the core message: "Tips go directly to the worker."