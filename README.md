# gekkzzz.github.io

Personal portfolio and blog hub for gekkzzz — a web developer, video essayist, and general nerd based in Wales, UK. Hosted on GitHub Pages.

## Purpose

This site serves as a central landing page: somewhere to find out who I am, see what I've been building on GitHub, read my latest writing, and get in touch. It's intentionally minimal and fast — no frameworks, no build step, just hand-written HTML, CSS, and vanilla JavaScript.

## Pages

| Page | Path | Description |
|------|------|-------------|
| Home | `index.html` | Activity calendar, live clocks, and latest blog posts |
| About | `pages/about.html` | Bio, current focus, interests, and things I'm not into |
| Contact | `pages/contact.html` | GitHub, Substack, and email links |

## Features

### Live time section
- Displays my current time in the UK (`Europe/London`) and the visitor's local time, ticking every second.
- Visitor timezone is detected via `ipwho.is` with a browser `Intl` fallback.
- If a city is detected, the label updates to show the visitor's location.

### GitHub contribution calendar
- Renders a custom contribution graph — no embedded image or third-party widget.
- Data is fetched from the [github-contributions-api](https://github.com/jogruber/github-contributions-api) and rendered entirely in vanilla JS.
- Shows Jan 1 of the current year through today. Future squares are invisible; the calendar grows day by day and resets automatically on each new year.
- Refreshes at the top of every hour. All 7 weekday labels (Mon–Sun) are shown.

### Latest blog posts
- Pulls the five most recent posts from the Substack RSS feed via `rss2json`.
- Falls back gracefully if the feed is unavailable.

### Blinking cursor on nav links
- Hovering a nav link triggers a blinking text-cursor animation next to it.

## Project structure

```
├── index.html              # Homepage
├── pages/
│   ├── about.html          # About page
│   └── contact.html        # Contact page
├── assets/
│   ├── css/site.css        # All styles
│   ├── js/site.js          # All JavaScript
│   └── images/avatar.png   # Profile avatar
├── .github/
│   └── workflows/
│       └── deploy-pages.yml  # Auto-deploy to GitHub Pages
└── .nojekyll               # Disables Jekyll processing
```

## Deploying

Every push to `main` triggers the GitHub Actions workflow at `.github/workflows/deploy-pages.yml`, which deploys the site to GitHub Pages automatically.

### One-time setup

1. Open repository **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Save.

The `.nojekyll` file ensures GitHub Pages serves files directly without Jekyll processing.
