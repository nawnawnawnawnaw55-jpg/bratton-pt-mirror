# Bratton PT — Modernization Plan v2

## Decisions Made

| # | Topic | Choice |
|---|-------|--------|
| 1 | Content system | **Local page generator tool** — easiest possible |
| 2 | UIKit version | **TBD** (explained below) |
| 3 | Templates | **Explained below** |
| 4 | Visual design | **Partial redesign, same feeling** |
| 5 | Forms | **Email form (kingnaw24@gmail.com), easily swappable** |
| 6 | Hosting | **Vercel** |

---

## 1. CONTENT SYSTEM — Local Page Generator

### Concept
A single HTML file (`page-builder.html`) that opens in a browser locally. 
It looks like a simple form:

```
+--------------------------------------------------+
|  Bratton PT — New Page Builder                    |
|                                                    |
|  Page Type:  [ Conditions v ]  (or Services)      |
|  Title:      [                            ]       |
|  Slug:       [                            ]       |
|  Nav Label:  [                            ]       |
|  Meta Desc:  [                            ]       |
|  Image URL:  [                            ]       |
|                                                    |
|  Content (Markdown):                              |
|  +----------------------------------------------+ |
|  |                                              | |
|  |  ## What Is This Condition?                  | |
|  |                                              | |
|  |  Write your content here using simple        | |
|  |  markdown formatting...                      | |
|  |                                              | |
|  +----------------------------------------------+ |
|                                                    |
|  [Preview]  [Download Page]  [Copy Nav Code]      |
+--------------------------------------------------+
```

### How It Works
1. Staff fills in the form (title, slug, markdown content)
2. Clicks **Preview** — sees exactly how the page will look
3. Clicks **Download Page** — gets a complete `index.html` file
4. The tool also shows: "Save this file to: `services/new-service/index.html`"
5. The tool also generates nav code to paste into the navigation

### What Staff Needs to Do
1. Open `page-builder.html` in Chrome
2. Fill in the form
3. Save the downloaded file to the right folder
4. Copy-paste one line of nav code into `nav.html`
5. Run `python build.py` (or just push to Vercel if using the simple version)

### Files Created
```
services/new-service/
  index.html       <- the full page, auto-formatted
```

### Nav Code Generated
```html
<li><a href="/services/new-service/">New Service</a></li>
```
Staff pastes this into the shared `nav.html` template.

---

## 2. UIKIT — Stay 2.x or Upgrade to 3.x?

### UIKit 2.x (Current)
- **Pros**: Already working, no migration needed, all pages already use it
- **Cons**: 2016-era framework, heavier CSS (150KB), no CSS grid, limited touch support, 
  uses jQuery dependency
- **Size**: ~150KB CSS + ~30KB JS

### UIKit 3.x
- **Pros**: Modern (2022), lighter (80KB CSS), CSS grid, better mobile touch, 
  no jQuery dependency, faster
- **Cons**: Class names changed (`.uk-grid` becomes `.uk-grid` still, but some differ), 
  every page needs migration, risk of breaking layouts
- **Size**: ~80KB CSS + ~20KB JS

### Recommendation
**Stay on 2.x for now.** The migration risk is high for 400+ pages. We can get 
90% of the mobile improvements through CSS overrides. If a full redesign happens 
later, switch to UIKit 3.x at that point.

---

## 3. TEMPLATE SYSTEM — Explained

### Current Problem
Every HTML file (400+) has its own copy of:
- The `<head>` with meta tags, CSS links, fonts
- The header with logo, orange bars, navigation
- The footer with hours, address, copyright
- The mobile menu and quick-access buttons

If you want to change the phone number or add a nav item, you must edit ALL 400+ files.

### How Templates Fix This
Instead of 400 complete HTML files, we have:

```
/templates/
  head.html           <- everything from <!DOCTYPE> to </head>
  header.html         <- logo, orange bars, desktop nav, mobile menu
  footer.html         <- hours, address, copyright, privacy links

/content/
  conditions/
    knee-pain.md      <- just the page content (markdown)
    shoulder-pain.md
  services/
    cupping.md

/build.py             <- Python script that builds the site

/dist/                <- generated output (what gets deployed)
  index.html
  services/cupping/index.html
  conditions/knee-pain/index.html
  ...
```

### What build.py Does
```python
# Pseudocode
for each .md file in /content/:
    html = read('templates/head.html')
    html += read('templates/header.html')   # shared header
    html += convert_markdown_to_html(md_file)  # unique content
    html += read('templates/footer.html')   # shared footer
    write(html, to='/dist/services/cupping/index.html')
```

### What Changes When You Edit Something
| Change | Old Way | New Way |
|--------|---------|---------|
| Phone number | Edit 400+ files | Edit 1 file (`footer.html`), rebuild |
| Nav item | Edit 400+ files | Edit 1 file (`header.html`), rebuild |
| Logo | Edit 400+ files | Edit 1 file (`header.html`), rebuild |
| Add service page | Copy HTML, edit 400+ files for nav | Write 1 `.md` file, add 1 nav line, rebuild |

### The "In-Between" Option
Don't use a build script. Instead, use **JavaScript includes** that load at runtime:

```html
<!-- header is loaded from /templates/header.html via JS -->
<div id="site-header"></div>
<script>
  fetch('/templates/header.html')
    .then(r => r.text())
    .then(html => document.getElementById('site-header').innerHTML = html);
</script>
```

This is simpler (no build step) but has downsides:
- Flash of unstyled content while header loads
- Bad for SEO (search engines may not see the nav)
- Slower page load

**Recommendation**: Use the build script approach. It's a one-time setup, then staff 
just runs `python build.py` after making changes.

---

## 4. FORM SYSTEM — Email to kingnaw24@gmail.com

### Solution: Vercel Serverless Function

A single file `/api/contact.js` (Vercel Edge Function):

```javascript
export default async function handler(request) {
  const formData = await request.formData();
  const name = formData.get('name');
  const email = formData.get('email');
  const phone = formData.get('phone');
  const message = formData.get('message');
  
  // Send email via SendGrid, Mailgun, or Resend (free tiers available)
  await sendEmail({
    to: 'kingnaw24@gmail.com',
    subject: `New Appointment Request from ${name}`,
    body: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`
  });
  
  return new Response(null, {
    status: 302,
    headers: { Location: '/thank-you/' }
  });
}
```

### The Form (on the website)
```html
<form action="/api/contact" method="POST">
  <input name="name" placeholder="Full Name" required>
  <input name="email" type="email" placeholder="Email" required>
  <input name="phone" type="tel" placeholder="Phone">
  <textarea name="message" placeholder="What can we help with?"></textarea>
  <button type="submit">Request Appointment</button>
</form>
```

### Why This Is Swappable
- The form always posts to `/api/contact`
- To change the email provider, edit ONE file (`/api/contact.js`)
- To change the recipient email, change ONE line in that file
- To switch to Calendly/JotForm later, change the form's `action` URL

### Email Providers (Free Tiers)
| Provider | Free Tier | Setup |
|----------|-----------|-------|
| **Resend** | 100 emails/day | Easiest — just an API key |
| **SendGrid** | 100 emails/day | Requires domain verification |
| **Mailgun** | 100 emails/day | Requires domain verification |
| **mailto:** | Unlimited | No server needed, opens user's email client |

**Recommendation**: Start with Resend (simplest API).

---

## 5. VISUAL REFRESH — Partial Redesign

### Keep
- Blue (#2257a6) and orange (#f86f26) color scheme
- Logo and brand identity
- The warm, professional medical feel
- Montserrat font

### Change
- **Hero section**: Full-viewport height, text overlay with better contrast
- **Service cards**: Larger images, hover effects, cleaner grid
- **Typography**: Larger headings, more line-height, better readability
- **Spacing**: More breathing room between sections (120px instead of 50px)
- **Shadows**: Softer, modern box-shadows instead of hard borders
- **Buttons**: More consistent sizing, better hover states
- **Mobile**: Native-feeling touch targets (48px minimum), proper font scaling

### Before/After Example (Service Card)
```
BEFORE:
+------------------+
| [small 400x260]  |
| Service Name     |
| [Learn More btn] |
+------------------+

AFTER:
+---------------------+
|                     |
|   [larger image]    |
|                     |
| Service Name        |
| Brief description   |
| [Learn More --->]   |
+---------------------+
```

---

## 6. IMPLEMENTATION ORDER

### Phase 1: Foundation (Week 1)
1. Set up template system (`/templates/`, `/content/`, `build.py`)
2. Migrate 5 key pages to prove it works (homepage, about, 2 services, 1 condition)
3. Create the page builder tool (`page-builder.html`)
4. Set up email form with Resend

### Phase 2: Content Migration (Week 2)
5. Migrate all remaining pages to the template system
6. Add loading="lazy" to all images
7. Add proper meta tags to every page
8. Generate sitemap.xml

### Phase 3: Visual Refresh (Week 3)
9. New hero section design
10. Updated service cards
11. Typography and spacing improvements
12. Mobile CSS fixes

### Phase 4: Polish (Week 4)
13. Accessibility audit and fixes
14. Performance optimization (minify, cache, defer)
15. Final testing across devices
16. Deploy to Vercel

---

## DECISIONS STILL NEEDED

- [ ] **UIKit**: Stay on 2.x? (Recommended: Yes, for now)
- [ ] **Templates**: Build script (build.py) or runtime JS includes? (Recommended: build.py)
- [ ] **Email provider**: Resend, or start with simple `mailto:` links?
- [ ] **Phase 1 start**: Ready to begin building the template system and page builder?


---

## UPDATED DECISIONS

| # | Topic | Decision |
|---|-------|----------|
| 2 | UIKit | **Stay on 2.x** |
| 3 | Templates | **JS includes** (easiest maintenance — no build step) |
| 4 | Visual | **Easiest path** (conservative CSS, no redesign) |
| 5 | Cards | **See options below** |

---

## 3. TEMPLATES — Easiest Approach (JS Includes)

### How It Works
One shared file per component. Every page loads it via a 3-line script.

```
/templates/
  header.html    <- logo, orange bars, desktop nav, mobile menu
  footer.html    <- hours, address, copyright

/every-page.html:
  <div id="site-header"></div>       <- placeholder
  <script>
    fetch('/templates/header.html')  <- loads shared header
      .then(r => r.text())
      .then(h => document.getElementById('site-header').innerHTML = h);
  </script>
  
  <!-- unique page content here -->
  
  <div id="site-footer"></div>       <- placeholder  
  <script>
    fetch('/templates/footer.html')  <- loads shared footer
      .then(r => r.text())
      .then(f => document.getElementById('site-footer').innerHTML = f);
  </script>
```

### Why This Is Easiest
- **No build step** — changes appear instantly when you refresh
- **One file to edit** — change phone number in `footer.html`, ALL pages update
- **No Python required** — just edit HTML, save, done
- **Staff can do it** — open footer.html in Notepad, change phone number, save

### The Catch (and Fix)
There's a brief flash before the header loads. Fix: add a tiny CSS rule that hides 
the placeholders until loaded:

```css
#site-header, #site-footer { min-height: 50px; }
```
After JS loads the content, the placeholder fills in. It's barely noticeable.

---

## 5. SERVICE CARDS — Alternative Options

### Current
```
+------------------+
|   [image 400x260]|
|   SERVICE NAME   |
|  [Learn More]    |
+------------------+
```

### Option A: Cleaned Up (Minimal Change)
Keep the same card structure but:
- Softer shadows (no harsh borders)
- Slightly larger images
- Better hover effect (subtle lift + shadow)
- Remove the orange background animation on hover (keep it simple)
- Add a short one-line description under the name

```
+------------------+
|   [image 400x260]|
|   Service Name   |
|   Brief one-liner|
|   Learn More --> |
+------------------+
```

### Option B: Horizontal Row Layout
Instead of cards in a grid slider, show each service as a full-width row:

```
+-------------------------------------------+
| [image] | Service Name                    |
| [400x ] | Brief description of what this  |
| [  260] | service is and who it helps     |
|         | [Learn More -->]                |
+-------------------------------------------+
```

Better for mobile (stacks vertically), more room for text, feels more premium.

### Option C: Icon + Text (No Images)
Replace stock photos with simple SVG icons + service name + description:

```
   (icon)
  Service Name
  Short description
  [Learn More]
```

Clean, fast-loading (no images), consistent look. Works great on mobile.
But loses the visual appeal of photography.

### Option D: Keep Exactly As-Is
Don't touch the cards at all. Focus on other improvements.

---

## REVISED IMPLEMENTATION ORDER

Since we chose the easiest path for everything:

### Phase 1: Shared Templates (1-2 days)
1. Extract header/footer into `/templates/header.html` and `/templates/footer.html`
2. Add JS include script to every page
3. Test that all pages load correctly

### Phase 2: Page Builder Tool (1 day)
4. Build `page-builder.html` — form-based page generator
5. Generates properly formatted pages with nav code

### Phase 3: Email Form (1 day)
6. Create `/api/contact.js` (Vercel function)
7. Add contact form to the appointment pages
8. Test email delivery

### Phase 4: Visual Polish (2-3 days)
9. Apply chosen card style from options above
10. Mobile spacing/scaling fixes
11. Loading="lazy" on images

### Phase 5: SEO + Performance (1-2 days)
12. Meta tags, sitemap, robots.txt
13. Defer JS, minify, cache headers

---

## QUICK DECISIONS

- [ ] **Card style**: Option A, B, C, or D?
- [ ] **Start Phase 1**: Ready to extract shared templates?


---

## CARD DECISION

**Chosen: Option A (Cleaned Up)** — keep current card structure but:
- Softer shadows, slightly larger images, subtle hover lift
- Add short description under name
- Keep the orange hover animation but make it smoother/faster
- NEW animation: instead of the circular orange fill from corners, use a 
  subtle underline slide-in or border glow on hover

---

## HOMEPAGE REDESIGN — Same Info, Different Look, Shorter on Mobile

### Current Homepage Structure (14 sections, ~8,000px scroll on mobile)

```
1. HERO (slideshow + CTA buttons)
2. VALUE PROPS (3 icon cards: goal, audience, running)
3. WELCOME / "Does This Sound Familiar?"
4. "Not All Physical Therapy Is The Same"
5. "Finding the right treatment" + bullet list
6. "How To Get Started" (3 steps)  
7. CTA: "Ready to Feel Better?"
8. CONDITIONS GRID (17 conditions)
9. SERVICES SLIDER (13 services)
10. REVIEWS (3 testimonials)
11. INSURANCE (logos + text)
12. CTA: "Ready to Feel Better?" (DUPLICATE of #7)
13. COMPARISON TABLE (Bratton vs Corporate vs Hospital)
14. RECOVERY PROCESS (5 phases)
```

### Proposed New Structure (9-10 sections, ~4,500px scroll)

```
1. HERO — Full-screen, single image with text overlay
   "Physical Therapy Before & After Surgery in Slidell"
   [Request Appointment] [Work Injury? Start Here]
   
2. VALUE PROPS — Same 3 icons, moved into a single row
   "Structured, goal-oriented rehab | Active participation | Return to normal quickly"
   
3. WELCOME — Combined: "Does This Sound Familiar?" + "Not All PT Is The Same"
   Two columns: pain points (left) + why choose us (right)
   On mobile: stacks vertically, ~40% shorter
   
4. GET STARTED — 3 steps, keep as-is but more compact
   
5. CTA — "Ready to Feel Better?" (only ONCE now, not twice)
   
6. CONDITIONS — Horizontal scroll pills (not a grid)
   Like tags: [Shoulder] [Knee] [Back] [Neck] [Sports] [Work] ...
   Each pill links to the condition page. Much shorter on mobile.
   
7. SERVICES — Keep the slider, with Option A cards (cleaned up)
   NEW animation: cards scale up slightly + subtle glow on hover
   instead of the orange-circle-fill animation
   
8. REVIEWS — Keep, but show 1 at a time with dots (not 3 stacked)
   
9. INSURANCE — Simplified: logo row only, no redundant text
   
10. RECOVERY PROCESS — Condensed to horizontal stepper with
    numbers (1-5), tap to expand description. No images needed.
```

### What Gets Cut/Combined
| Removed | Why |
|---------|-----|
| Duplicate CTA (#12) | Same as #7, just repeated |
| Comparison table (#13) | Moved to its own page (/why-choose-us/) or footer |
| Recovery images | Replace with number stepper, saves 5 image loads |
| Bullet list in section 5 | Merged into Welcome section |
| "Most patients see results" section | Merged into Welcome |

---

## NEW ANIMATIONS (Replacing the Orange Circle Fill)

### Current: `.tm-services-animation`
Two orange circles grow from corners to fill the card on hover.

### Option 1: Border Glow
```css
.service-card:hover {
  box-shadow: 0 0 20px rgba(248, 111, 38, 0.3);
  transform: translateY(-4px);
  border-color: #f86f26;
}
```
Clean, modern, no heavy animations.

### Option 2: Underline Slide
```css
.service-card::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0;
  width: 0; height: 3px;
  background: #f86f26;
  transition: width 0.3s;
}
.service-card:hover::after {
  width: 100%;
}
```
Subtle orange line slides in from left on hover.

### Option 3: Gentle Scale + Shadow
```css
.service-card:hover {
  transform: scale(1.03);
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}
```
Simple, effective, works on mobile.

### Option 4: Keep Current But Faster
Same orange circle fill, but transition shortened to 0.3s (was 1s).
Feels snappier, less distracting.

---

## MOBILE LENGTH — Before vs After

| Section | Current Height (mobile) | New Height |
|---------|------------------------|------------|
| Hero | ~650px | ~500px (single image) |
| Value Props | ~300px | ~200px |
| Welcome | ~1200px (two sections) | ~600px (combined) |
| Get Started | ~400px | ~300px |
| CTA | ~250px | ~200px |
| Conditions | ~1200px (grid) | ~200px (scroll pills) |
| Services | ~800px | ~800px |
| Reviews | ~600px | ~300px (one at a time) |
| Insurance | ~400px | ~250px |
| Recovery | ~800px (5 images) | ~200px (stepper) |
| **TOTAL** | **~6,600px** | **~3,550px** |

That's about **46% shorter** on mobile.

---

## QUICK DECISIONS

- [ ] **Homepage sections**: Approve the 10-section plan? Any to keep/remove?
- [ ] **Conditions display**: Horizontal scroll pills, or keep the button grid?
- [ ] **Comparison table**: Move to its own page, or keep on homepage?
- [ ] **Recovery process**: Number stepper (tap to expand), or keep current?
- [ ] **Animation style**: Option 1, 2, 3, or 4?
- [ ] **Ready to start Phase 1** (shared templates)?


---

## ANIMATION — Flashy But Different (Avoid Copy Claims)

### Current (e-rehab): Orange Circle Fill
Two orange circles grow from bottom-left and top-right corners, fill the card.
Transition: 1 second. Color: #f86f26.

### Proposed: Ripple Pulse + Tilt

**On hover (desktop):**
1. Card lifts slightly (translateY: -6px)
2. A glowing orange ripple expands from the center outward
3. The card tilts 2-3 degrees toward the cursor (3D parallax feel)
4. A subtle white flash sweeps across the image (light reflection)

```css
.service-card {
  transition: transform 0.3s, box-shadow 0.3s;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.service-card:hover {
  transform: translateY(-6px) rotateX(2deg) rotateY(-2deg);
  box-shadow: 0 20px 40px rgba(248,111,38,0.25), 0 0 0 2px #f86f26;
}

/* Ripple on hover */
.service-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(248,111,38,0.3) 0%, transparent 70%);
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 0.3s, transform 0.4s;
  z-index: 2;
  pointer-events: none;
}
.service-card:hover::before {
  opacity: 1;
  transform: scale(1.5);
}

/* Light sweep across image */
.service-card::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transform: skewX(-15deg);
  transition: left 0.5s;
  z-index: 3;
  pointer-events: none;
}
.service-card:hover::after {
  left: 150%;
}
```

**On tap (mobile):**
- Card pulses (scales to 0.97 then back to 1.0)
- Orange border flashes briefly
- Subtle haptic-like visual feedback

### Visual Difference from e-rehab
| Feature | e-rehab | New |
|---------|---------|-----|
| Effect | Corner circles fill inward | Center ripple + light sweep |
| Color | Solid orange fill | Glowing orange overlay |
| 3D | Flat | Subtle tilt toward cursor |
| Speed | 1 second | 0.3-0.5 seconds (snappier) |
| Mobile | Same as desktop | Tailored tap animation |

---

## MOBILE — Tailored Experience

### Changes Per Section

**Hero**
- Full-bleed image (no margins)
- Text overlay with gradient fade at bottom (better readability)
- CTA buttons stack vertically, full-width, 56px tall (thumb-friendly)

**Conditions**
- Horizontal scroll pills with momentum/inertia (feels like a native app)
- Each pill: rounded, 44px tall, tappable
- Active pill has orange fill
- No visible scrollbar
```
[Shoulder] [Knee] [Back Pain] [Neck] [Sports] [Work Injury] [Arthritis] ->
```

**Services**
- Single-column vertical list instead of slider on mobile
- Each card: full-width, larger image (400x260), easier to tap
- Swipe is disabled — scroll naturally
- Cards have the ripple animation on tap

**Reviews**
- Single testimonial at a time with dot indicators
- Swipe left/right to see next
- Auto-advances every 5 seconds (pauses on touch)

**Recovery Process**
- Collapsible accordion steps
- Tap "Phase 1: Pain Relief" to expand description
- Only one open at a time
- No images — saves bandwidth

**CTA**
- Floaty/glowing button at bottom of screen on mobile
- "Call Now (985) 641-5825" — always visible
- Disappears when scrolling up, reappears when scrolling down

**Insurance**
- 2-column logo grid
- Smaller logos, less padding

### Mobile-Specific CSS
```css
@media (max-width: 768px) {
  /* Bigger touch targets */
  a, button, .service-card { min-height: 48px; }
  
  /* Font scaling */
  h1 { font-size: 28px; line-height: 1.2; }
  h2 { font-size: 22px; }
  body { font-size: 16px; }
  
  /* Full-width cards */
  .tm-services-animation { width: 100%; margin-bottom: 12px; }
  
  /* Invisible scrollbars */
  .conditions-scroll { scrollbar-width: none; -ms-overflow-style: none; }
  .conditions-scroll::-webkit-scrollbar { display: none; }
  
  /* Section spacing */
  section { padding: 40px 16px; }
}
```

---

## DECISIONS MADE

| # | Topic | Decision |
|---|-------|----------|
| 1 | Content system | Page builder tool |
| 2 | UIKit | Stay 2.x |
| 3 | Templates | JS includes (no build step) |
| 4 | Visual | Conservative CSS, same feeling |
| 5 | Cards | Option A (cleaned up) |
| 6 | Hosting | Vercel |
| 7 | Animation | **Ripple + tilt + light sweep** (flashy, distinct from e-rehab) |
| 8 | Homepage | **10-section plan, 46% shorter on mobile** |
| 9 | Mobile | **Tailored per-section (pills, accordion, floating CTA)** |

---

## READY TO BUILD

All decisions are made. The plan is complete. Say "go" and I'll start Phase 1:

**Phase 1: Shared Templates**
1. Extract header into `/templates/header.html`
2. Extract footer into `/templates/footer.html`  
3. Add JS includes to every page
4. Test on port 3001

**Phase 2: Page Builder**
5. Build `page-builder.html` tool

**Phase 3: Email Form**
6. Create `/api/contact.js` with Resend

**Phase 4: Homepage Redesign**
7. New hero layout
8. Combined Welcome section
9. Condition scroll pills
10. New card animations
11. Mobile optimizations
12. Recovery accordion
