# gekkzzz.github.io

Personal portfolio and blog hub for gekkzzz. Hosted on [Vercel](https://vercel.com).

Plain HTML, CSS, and vanilla JavaScript — no framework, no build step, no package install required.

## Pages

| Page | Path | What it contains |
| --- | --- | --- |
| Home | `index.html` | Hero, stack, projects, live clocks, GitHub activity calendar, latest blog posts |
| Contact | `contact/index.html` | GitHub, YouTube, Substack, and email links |
| Cookie Policy | `cookies/index.html` | Privacy/data explanation, preference management |

## Features

### Site-wide

- **Weather-driven background animation** — on page load, coordinates are obtained from an IP lookup, then passed to [Open-Meteo](https://open-meteo.com) (free, no API key) to fetch the current WMO weather code. The animation automatically matches the weather:

  | Condition | Animation |
  | --- | --- |
  | Clear / sunny | Golden motes rising upward |
  | Partly / overcast cloudy | Shaped cloud silhouettes drifting across the screen |
  | Fog / mist | Thick horizontal wisps drifting sideways |
  | Drizzle | Light, slow sparse rain streaks |
  | Rain / showers | Standard falling rain streaks |
  | Snow | Softly wobbling snowflakes |
  | Thunderstorm | Heavy angled rain + screen flash + drawn lightning bolts with glow and branching |

  The active animation is cached in `localStorage` for 30 minutes so navigating between pages shows a consistent animation without re-fetching weather on every load.

- **Animation on/off toggle** — `anim: on / anim: off` button in the nav on all pages. Preference persists to `localStorage`.

- **Light / dark / auto theme toggle** — three-button toggle in the nav. Defaults to dark mode. Persists to `localStorage`. When set to "auto" it follows `prefers-color-scheme`. Applied before first paint to prevent flash.

- **Available For Work badge** — pulsing green dot that expands outward, vertically aligned to the text.

- JetBrains Mono typography with system monospace fallbacks.

- Responsive layout for all screen sizes.

- **Accessible** — skip links, `aria-label`, `aria-current`, `aria-modal`, `aria-describedby`, `role` attributes, semantic HTML, `:focus-visible` keyboard indicators, `.sr-only` screen-reader-only headings, `prefers-reduced-motion` support, WCAG AA colour contrast.

- **SEO optimised** — unique `<title>` and `<meta name="description">` per page, Open Graph tags, Twitter Card tags, canonical URLs, `robots.txt`, `sitemap.xml`, JSON-LD structured data (`Person` + `WebSite` schema on home page).

### Home page

- **Stack section** — grouped chips listing languages, frameworks & runtime, tools & platforms, and creative tools.

- **Projects section** — four cards each with a GitHub-style colour-coded language bar and percentage breakdown. Language percentages are **fetched live from the GitHub API** on each page load and update the bars automatically; the hardcoded values serve as the initial render fallback:
  - Glyndwr (JS · Python · CSS · HTML)
  - Study Sprint Tracker (JS 100%)
  - Tape 'N' Torque — portfolio site for a motorsport photography client, links to live Vercel site
  - gekkzzz.github.io (HTML · JS · CSS)

- **Dual live clocks** — "My Time (Liverpool, GB)" using `Europe/London`; "Your time" updates every second. Timezone and city detected via `ipwho.is` / `ipinfo.io`.

- **GitHub activity calendar** — pulls yearly contribution data from `github-contributions-api.jogruber.de`, renders an accessible contribution grid with `aria-label` per cell, refreshes every hour.

- **Latest blog posts** — reads Substack RSS via four CORS proxies with 8-second timeout per attempt and graceful fallback. Handles CDATA-wrapped titles.

- **Cookie consent banner** — shown on all pages. Slides in after 800ms if no preference is set. Accept/Reject persist to `localStorage`.

### Contact page (`/contact`)

- GitHub, YouTube, Substack, and email links.
- Animation toggle and cookie policy link in the footer.

### Cookie policy (`/cookies`)

- Explains all third-party data flows: IP lookup, Open-Meteo weather, GitHub API, Substack RSS.
- `localStorage` keys documented: `gekkzzz-cookie-consent`, `gekkzzz-theme`, `gekkzzz-anim-enabled`, `gekkzzz-anim-last`, `gekkzzz-anim-last-ts`.
- Live accept/reject buttons to update preference at any time.

## Project structure

```text
.
├── index.html
├── contact/index.html
├── cookies/index.html
├── robots.txt
├── sitemap.xml
└── assets/
    ├── css/site.css
    ├── docs/cv-1.pdf
    └── js/
        ├── site.js        — theme, clocks, GitHub calendar, blog feed, language bars
        └── animations.js  — weather detection + all canvas animations
```

## Run locally

```bash
git clone https://github.com/gekkzzz/gekkzzz.github.io.git
cd gekkzzz.github.io
python3 -m http.server 8000
# open http://localhost:8000
```

Or use VS Code Live Server: right-click `index.html` → Open with Live Server.

## Third-party endpoints

| Endpoint | Purpose | Data sent |
| --- | --- | --- |
| `ipwho.is` / `ipinfo.io` | Timezone + coordinates for local time and weather | IP address (implicit) |
| `api.open-meteo.com` | Current weather code for animation selection | Latitude, longitude |
| `github-contributions-api.jogruber.de` | GitHub activity calendar data | GitHub username |
| `api.github.com/repos/{repo}/languages` | Live language percentages for project cards | None (public API) |
| `api.allorigins.win` / `corsproxy.io` / `api.codetabs.com` / `thingproxy.freeboard.io` | CORS proxies for Substack RSS feed | RSS feed URL |

## Deployment

Deployed on **Vercel** — every push to `main` triggers an automatic production deployment.

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Leave build settings at defaults (no build command needed).
3. Configure a custom domain in **Project Settings → Domains**.
