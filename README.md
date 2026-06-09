# gekkzzz.github.io

Personal portfolio and blog hub for gekkzzz. Hosted on [Vercel](https://vercel.com).

This project is intentionally lightweight: plain HTML, CSS, and vanilla JavaScript. No framework. No build step. No package install required for normal local development.

## What this website includes

### Core pages

| Page | Path | What it contains |
| --- | --- | --- |
| Home | `index.html` | Live clocks, timezone/location-aware visitor time, GitHub activity calendar, latest blog posts, resource links |
| About | `about/index.html` | Profile, personal background, likes/dislikes tags, work focus |
| Work | `work/index.html` | Portfolio of projects and work experience |
| Resources | `resources/index.html` | Free full-stack learning resources and a pre-launch checklist (17 sections, collapsible) |
| Contact | `contact/index.html` | Contact channels for LinkedIn, GitHub, Substack, and email |
| Cookie Policy | `cookies/index.html` | Cookie consent explanation, IP lookup details, preference management |
| Secret | `secret/index.html` | Hidden retro Pong game |

### Site-wide features

- Shared header/nav layout and visual style with `aria-label`, skip links, and `aria-current` for accessibility.
- Fixed avatar shortcut button.
- Intro page loader with a staged completion flow: loading animation → finish acceleration → full bar → DONE → fade out.
- Loader skip on internal navigation (uses `sessionStorage` to avoid replaying the full loader between page transitions).
- **Cookie consent banner** (appears after loader completes if user hasn't chosen a preference).
- Responsive layout for all screen sizes.
- JetBrains Mono typography with system fallbacks.
- Status badge with pulsing availability indicator.
- Keyboard-style blinking cursor effect on nav link hover/focus.
- `prefers-reduced-motion` respected: all animations and transitions are suppressed for users who prefer it.

### Home page feature details

- **Dual live clocks**
  - "My Time (Liverpool, GB)" uses `Europe/London`.
  - "Your time" updates every second.
- **Timezone detection with robust fallback**
  - Starts from browser timezone.
  - Optionally enriches timezone/location via `ipwho.is` and `ipinfo.io` (only if user has accepted cookies).
  - Includes timezone normalisation and alias handling.
  - Supports offset-based inputs like `UTC+5`, `GMT+05:30`, etc.
- **Custom GitHub activity calendar renderer**
  - Pulls yearly contribution data from `github-contributions-api.jogruber.de`.
  - Rebuilds a GitHub-style contribution grid in the DOM with accessible `aria-label` on each cell.
  - Refreshes automatically every hour (aligned to the top of the hour).
- **Latest blog posts feed**
  - Reads Substack RSS feed.
  - Fetches via two CORS proxies in sequence (`allorigins.win` then `corsproxy.io`) with an 8-second timeout per attempt, so the feed loads reliably even if one proxy is down.
  - Safely escapes all content and validates links before rendering.
  - Shows graceful fallback text if feed is unavailable.

### About page feature details

- Profile intro and personal metadata.
- Likes and dislikes displayed as reusable tag chips.
- Structured narrative sections: About Me, What I Do, When I'm Not Working.

### Resources page feature details

- **Free full-stack learning resources** — curated, genuinely free links organised by category:
  - *Full Curricula* — The Odin Project, freeCodeCamp, Full Stack Open (University of Helsinki), CS50W (Harvard)
  - *References & Guides* — MDN Web Docs, JavaScript.info, web.dev
  - *Visual & Interactive* — Web Skills, roadmap.sh
  - *Patterns & Architecture* — Patterns.dev
- **Pre-launch checklist** — a comprehensive, browser-persisted checklist covering **17 sections**:
  - Planning & Setup, HTML & Accessibility, CSS & Design, JavaScript, TypeScript, React, Node.js / Backend, Databases & SQL, APIs & Third-Party Integrations, Security, Performance, Testing, SEO & Meta, Deployment & DevOps, Monitoring & Maintenance, Agent Readiness, Resilience
  - Each item is tagged: **Required**, **Recommended**, **Optional**, or **Avoid**.
  - Sections are **collapsible** via `<details>`/`<summary>` — collapse state persists in `localStorage`.
  - Check items off as you go — progress saves to `localStorage`.
  - Per-section progress bars and an overall progress indicator.
  - Reset button with a confirmation step to avoid accidental clears.

### Contact page feature details

- Readable, label-first contact list design.
- External profile links + direct email.

### Secret page feature details

- Retro-styled Pong implementation in pure canvas JavaScript.
- Input support: keyboard (`W/S`, `Arrow Up/Down`, `Space` to serve), mouse move, touch drag/tap.
- CPU paddle AI, collision/bounce angle calculations, scoring to 10, CRT-style scanline effect.

### Cookie consent system

- **Banner** appears after page loader completes if user hasn't set a preference.
- **Three actions**: Accept, Reject, or Cookie Policy link.
- **Behavior**:
  - If `accept`: IP lookup runs → displays "Your time (City, Country)"
  - If `reject`: No IP calls → displays timezone code only
  - **No IP data is stored** by this site; third-party APIs only
  - Preference stored in browser as `gekkzzz-cookie-consent` (cookie + localStorage mirror)
- **GDPR-compliant**: Users have clear control to accept, reject, or change preference on the Cookie Policy page at any time.
- Cookie is set with `SameSite=Lax; Secure` (Secure flag applied automatically on HTTPS).

## Project structure

```text
.
├── .gitignore
├── LICENSE
├── README.md
├── index.html
├── about/
│   └── index.html
├── work/
│   └── index.html
├── resources/
│   └── index.html
├── contact/
│   └── index.html
├── cookies/
│   └── index.html
├── secret/
│   └── index.html
├── assets/
│   ├── css/
│   │   └── site.css
│   ├── docs/
│   │   └── CV.pdf
│   ├── images/
│   │   └── avatar.png
│   └── js/
│       └── site.js
└── scripts/
    └── check-timezones.js
```

## Run locally

### Option 1: Python (quickest)

```bash
git clone https://github.com/gekkzzz/gekkzzz.github.io.git
cd gekkzzz.github.io
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

### Option 2: VS Code Live Server extension

1. Open the folder in VS Code.
2. Right-click `index.html`.
3. Choose **Open with Live Server**.

## Validate timezone alias logic (optional)

If you edit timezone alias logic in `assets/js/site.js`, run:

```bash
node scripts/check-timezones.js
```

Notes:

- This script is for developer validation only.
- Requires Node.js 20+ for `Intl.supportedValuesOf` checks.

## Reuse features in your own site

You can copy only the pieces you want.

### 1) Reuse the loader behavior

1. Copy loader markup from any page file.
2. Copy loader-related CSS from `assets/css/site.css` (classes beginning with `.page-loader`, `.loader-*`, and `body.is-site-loading`).
3. Copy loader logic from `assets/js/site.js` (the loader setup + navigation-skip logic).

Note: loader skip uses `sessionStorage`. Remove those calls if you want no client-side storage.

### 2) Reuse the dual clock + timezone detection

1. Add target elements with IDs: `my-time`, `your-time`, optionally `your-time-label`, `your-timezone`.
2. Copy the time + timezone functions from `assets/js/site.js`.
3. Set your own base timezone constant (currently `Europe/London`).

### 3) Reuse the GitHub contribution calendar

1. Add a container with `id="github-calendar"`.
2. Copy calendar rendering/fetch functions from `assets/js/site.js`.
3. Update `activityUsername` to your GitHub username.
4. Keep the `.activity-*` styles from `assets/css/site.css`.

### 4) Reuse the blog feed block

1. Add a list container with `id="post-list"`.
2. Update `rssUrl` inside `assets/js/site.js`.
3. Keep `.post-list`, `.post-date`, and related styles.
4. The feed uses two proxy fallbacks with an 8-second timeout — adjust `proxies` if needed.

### 5) Reuse tag chips

Copy `.tag-list` and `.tag` styles, then:

```html
<ul class="tag-list">
  <li><span class="tag">Example</span></li>
</ul>
```

### 6) Reuse the secret Pong page

1. Copy `secret/index.html` as a standalone route.
2. Keep shared asset paths valid for your folder depth.
3. Adjust title text, colors, score limit, and controls in the inline script if needed.

### 7) Reuse the cookie consent system

#### Step 1: Create the policy page

Copy `cookies/index.html`. Customise the heading, descriptions, and footer links.

#### Step 2: Add cookie banner + consent styles

Copy from `assets/css/site.css`: `.cookie-banner*`, `.cookie-btn*`, `.cookie-policy`, `.cookie-preferences-box`, `.cookie-status-message`, `.cookie-policy-note`.

#### Step 3: Add consent logic to your main JS

The consent functions in `site.js` are exposed as `window.siteGetCookieConsent` and `window.siteSetCookieConsent` for use in inline page scripts (e.g. the Cookie Policy page).

In your main JS file, add the core cookie consent logic (see `assets/js/site.js` for the full implementation: `getCookieValue`, `setCookieValue`, `getCookieConsent`, `setCookieConsent`).

#### Step 4: Conditionally enable features based on consent

```javascript
const consent = window.siteGetCookieConsent();
if (consent === 'accept') {
  // enable IP lookup, analytics, etc.
}
```

#### Step 5: Update footer links

```html
<p class="footer-legal">...<a href="/cookies">Cookie Policy</a></p>
```

### 8) Reuse the pre-launch checklist

1. Copy the checklist markup from `resources/index.html` (`.checklist-section` blocks with `<details>`/`<summary>`).
2. Copy checklist styles from `assets/css/site.css` (`.checklist-*`, `.chk-tag*` classes).
3. Copy the inline checklist script from `resources/index.html` — handles localStorage persistence, collapsible state, progress bars, and reset flow.
4. Change `CHECKLIST_KEY` and `CHECKLIST_DETAILS_KEY` to unique strings for your site.

## Common customisation checklist

After cloning/forking, update these first:

1. Replace text content in `index.html`, `about/index.html`, `work/index.html`, and `contact/index.html`.
2. Replace `assets/images/avatar.png`.
3. Update external profile/blog/contact links.
4. Update `activityUsername` and Substack feed URL in `assets/js/site.js`.
5. Tweak theme colors in `:root` variables in `assets/css/site.css`.
6. Update the learning resources in `resources/index.html` to suit your audience.

## Third-party endpoints used client-side

| Endpoint | Purpose | When called |
| --- | --- | --- |
| `github-contributions-api.jogruber.de` | GitHub activity data | Always, on home page |
| `ipwho.is`, `ipinfo.io` | Timezone/location enrichment | Only if user accepts cookies |
| `api.allorigins.win`, `corsproxy.io` | CORS proxy for blog RSS feed | Always, on home page (tries first proxy, falls back to second) |

To make a fully self-contained site, remove or replace these fetch calls.

## Deployment

Deployed on **Vercel**. Every push to `main` triggers an automatic production deployment.

### One-time Vercel setup

1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Leave build settings at their defaults — no build command or output directory needed for a plain HTML site.
3. Vercel assigns a `.vercel.app` domain automatically; configure a custom domain in **Project Settings → Domains**.

### Running locally

Use Python or VS Code Live Server (see [Run locally](#run-locally) above). No Vercel CLI required for day-to-day development.
