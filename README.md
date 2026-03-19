# gekkzzz.github.io

Personal portfolio and blog hub for gekkzzz.

This project is intentionally lightweight: plain HTML, CSS, and vanilla JavaScript. No framework. No build step. No package install required for normal local development.

## What this website includes

### Core pages

| Page | Path | What it contains |
|------|------|------------------|
| Home | `index.html` | Live clocks, timezone/location-aware visitor time, GitHub activity calendar, latest blog posts, resource links |
| About | `about/index.html` | Profile, personal background, likes/dislikes tags, work focus |
| Contact | `contact/index.html` | Contact channels for LinkedIn, GitHub, Substack, and email |
| Cookie Policy | `cookies/index.html` | Cookie consent explanation, IP lookup details, preference management |
| Secret | `secret/index.html` | Hidden retro Pong game |

### Site-wide features (used across pages)

- Shared header/nav layout and visual style.
- Fixed avatar shortcut button.
- Intro page loader with a staged completion flow:
	- loading animation
	- finish acceleration
	- full bar state
	- DONE state
	- fade out
- Loader skip on internal navigation (uses `sessionStorage` to avoid replaying the full loader between internal page transitions).
- **Cookie consent banner** (appears after loader completes if user hasn't chosen a preference).
- Responsive behavior for desktop/mobile breakpoints.
- JetBrains Mono typography with system fallbacks.
- Status badge with pulsing availability indicator.
- Keyboard-style blinking cursor effect on nav link hover/focus.

### Home page feature details

- **Dual live clocks**
	- "My Time (Liverpool, GB)" uses `Europe/London`.
	- "Your time" updates every second.
- **Timezone detection with robust fallback**
	- Starts from browser timezone.
	- Optionally enriches timezone/location via `ipwho.is` and `ipinfo.io`.
	- Includes timezone normalization and alias handling.
	- Supports offset-based inputs like `UTC+5`, `GMT+05:30`, etc.
- **Custom GitHub activity calendar renderer**
	- Pulls yearly contribution data.
	- Rebuilds a GitHub-style contribution grid in the DOM.
	- Recomputes contribution levels for visual scaling.
	- Refreshes automatically every hour (aligned to top of hour).
- **Latest blog posts feed**
	- Reads Substack RSS feed.
	- Converts via `rss2json` endpoint for browser-friendly JSON.
	- Safely escapes content and validates links.
	- Shows graceful fallback text if feed is unavailable.

### About page feature details

- Profile intro and personal metadata.
- Likes and dislikes displayed as reusable tag chips.
- Structured narrative sections:
	- About Me
	- What I Do
	- When I'm Not Working

### Contact page feature details

- Readable, label-first contact list design.
- External profile links + direct email.

### Secret page feature details

- Retro-styled Pong implementation in pure canvas JavaScript.
- Input support:
	- Keyboard (`W/S`, `Arrow Up/Down`, `Space` to serve)
	- Mouse move
	- Touch drag/tap (pointer events)
- Game logic includes:
	- CPU paddle AI tracking
	- collision/bounce angle calculations
	- scoring to 10
	- restart/serve loop
	- CRT-style scanline effect

### Cookie consent system

- **Banner** appears after page loader completes if user hasn't set a preference.
- **Consent message**: "I use some non-essential cookies to power a few extra features and make the site look and feel better. Your call!"
- **Three actions**:
  - Accept — enables IP-based timezone/location enrichment
  - Reject — disables IP lookups, uses local browser timezone only
  - Cookie Policy link — navigates to `/cookies` for full transparency and preference management
- **Behavior**:
  - If `accept`: IP lookup runs → displays "Your time (City, Country)"
  - If `reject`: No IP calls → displays timezone code only
  - **No IP data is stored** by this site; third-party APIs only
  - Preference stored locally in browser as `gekkzzz-cookie-consent`
- **GDPR-compliant**: Users have clear control to accept, reject, or change preference anytime.

## Project structure

```text
.
├── index.html
├── about/
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
│   ├── images/
│   │   └── avatar.png
│   └── js/
│       └── site.js
├── scripts/
│   └── check-timezones.js
├── .github/
│   └── workflows/
│       └── deploy-pages.yml
└── .nojekyll
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
- Use Node.js 20+ for `Intl.supportedValuesOf` checks.

## Reuse features in your own site

You can copy only the pieces you want.

### 1) Reuse the loader behavior

1. Copy loader markup from one of the page files (`index.html`, `about/index.html`, or `contact/index.html`).
2. Copy loader-related CSS blocks from `assets/css/site.css` (classes beginning with `.page-loader`, `.loader-*`, and `body.is-site-loading`).
3. Copy loader logic from `assets/js/site.js` (the loader setup + navigation-skip logic).

Important:
- Loader skip uses `sessionStorage`.
- If you do not want any client-side storage, remove the `sessionStorage` calls and keep loader always-on.

### 2) Reuse the dual clock + timezone detection

1. Add target elements with IDs used by the script:
	 - `my-time`
	 - `your-time`
	 - optional: `your-time-label`, `your-timezone`
2. Copy the time + timezone functions from `assets/js/site.js`.
3. Set your own base timezone constant (currently `Europe/London`).

### 3) Reuse the GitHub contribution calendar

1. Add a container with ID `github-calendar`.
2. Copy calendar rendering/fetch functions from `assets/js/site.js`.
3. Update `activityUsername` to your GitHub username.
4. Keep the `.activity-*` styles from `assets/css/site.css`.

### 4) Reuse the blog feed block

1. Add a list container with ID `post-list`.
2. Update `rssUrl` inside `assets/js/site.js`.
3. Keep `.post-list`, `.post-date`, and related styles.

### 5) Reuse tag chips (likes/dislikes style)

1. Copy `.tag-list` and `.tag` styles.
2. Use markup:

```html
<ul class="tag-list">
	<li><span class="tag">Example</span></li>
</ul>
```

### 6) Reuse the secret Pong page

1. Copy `secret/index.html` as a standalone route.
2. Keep shared avatar image path and stylesheet link valid for your new folder depth.
3. Adjust title text, colors, score limit, and controls in the inline script if needed.

### 7) Reuse the cookie consent system

This site includes a GDPR-compliant cookie consent banner and policy page. Reuse it by:

#### Step 1: Create the policy page

Copy `cookies/index.html` to your site at the same path. Customize:
- Heading and description text
- Cookie explanations (describe your actual data usage)
- Footer links to your contact page

#### Step 2: Add cookie banner styles

Copy these CSS classes from `assets/css/site.css`:
- `.cookie-banner*` (all cookie banner styles)
- `.cookie-btn*` (all button styles)
- `.cookie-policy` (policy page styling)
- `.cookie-preferences-box` and `.cookie-status-message`

#### Step 3: Add consent logic to your JavaScript

In your main JS file, add:

```javascript
const cookieConsentKey = 'your-site-cookie-consent';

function createCookieBanner() {
  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.id = 'cookie-banner';
  banner.innerHTML = `
    <p class="cookie-banner-message">Your cookie message here</p>
    <div class="cookie-banner-buttons">
      <button id="cookie-accept-btn" class="cookie-btn cookie-btn-accept">Accept</button>
      <button id="cookie-reject-btn" class="cookie-btn cookie-btn-reject">Reject</button>
      <a href="/cookies" class="cookie-btn" style="text-decoration: none;">Cookie Policy</a>
    </div>
  `;
  return banner;
}

function showCookieBanner() {
  const existingBanner = document.getElementById('cookie-banner');
  if (existingBanner) return;

  const banner = createCookieBanner();
  document.body.appendChild(banner);

  const acceptBtn = banner.querySelector('#cookie-accept-btn');
  const rejectBtn = banner.querySelector('#cookie-reject-btn');

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem(cookieConsentKey, 'accept');
    banner.classList.add('hidden');
    // Re-run any feature that depends on cookies/consent
  });

  rejectBtn.addEventListener('click', () => {
    localStorage.setItem(cookieConsentKey, 'reject');
    banner.classList.add('hidden');
  });
}

// Call after your page finishes loading:
// const consent = localStorage.getItem(cookieConsentKey);
// if (!consent) showCookieBanner();
```

#### Step 4: Conditionally enable features based on consent

```javascript
const consent = localStorage.getItem(cookieConsentKey);

if (consent === 'accept') {
  // Enable IP lookup, analytics, or other features
  detectUserTimeFromLocation();
} else if (consent === 'reject') {
  // Disable IP lookups, use local timezone only
  // userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
}
```

#### Step 5: Update footer links

Add a link to your cookie policy in the footer of all pages:

```html
<p class="footer-legal">...<a href="/cookies" style="border: none;">Cookie Policy</a></p>
```

## Common customization checklist

After cloning/forking, most people update these first:

1. Replace text content in `index.html`, `about/index.html`, and `contact/index.html`.
2. Replace `assets/images/avatar.png`.
3. Update external profile/blog/contact links.
4. Update `activityUsername` and Substack feed URL in `assets/js/site.js`.
5. Tweak theme colors in `:root` variables in `assets/css/site.css`.

## Third-party endpoints used client-side

The browser-side script can call:

- `https://github-contributions-api.jogruber.de` (activity data)
- `https://ipwho.is` and `https://ipinfo.io` (timezone/location enrichment — **only if user accepts cookies**)
- `https://api.rss2json.com` + your feed source (blog posts)

If you want a fully self-contained site, remove or replace these fetch calls.

## Deployment

Every push to `main` (or `master`) triggers `.github/workflows/deploy-pages.yml` and deploys the repository root to GitHub Pages.

### One-time GitHub Pages setup

1. Open repository **Settings -> Pages**.
2. Set **Source** to **GitHub Actions**.
3. Save.

`.nojekyll` ensures static files are served directly without Jekyll processing.
