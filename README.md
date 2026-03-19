# gekkzzz.github.io

Personal portfolio and blog hub for gekkzzz. Code is publicly viewable, so feel free to learn from it or suggest improvements.

## Purpose

This site is a central landing page to show who I am, what I am building, what I am writing, and how to contact me. It is intentionally simple and fast: plain HTML, CSS, and vanilla JavaScript with no framework and no build step.

## Pages

| Page | Path | Description |
|------|------|-------------|
| Home | `index.html` | Live clocks, GitHub activity, latest posts, and resource links |
| About | `about/index.html` | Personal profile, likes/dislikes tags, background, and current focus |
| Contact | `contact/index.html` | Direct links for LinkedIn, GitHub, blog, and email |

## Features

### Home page
- Live time cards for my local time and visitor time.
- Visitor timezone detection with fallback handling.
- Custom GitHub contribution calendar rendered in JS (year-to-date, hourly refresh).
- Latest Substack posts fetched from RSS.
- Footer resource groups for Causes and Cool Stuff.

### About page
- Expanded personal bio and work background.
- Structured sections for About Me, What I Do, and When I'm Not Working.
- Likes and Dislikes displayed as tags.

### Contact page
- Clear contact channels for professional and direct outreach.

### Site-wide UX
- Startup loader with progress behavior and a final DONE state.
- Keyboard-style nav hover cursor effect.
- Avatar hover hint with delayed reveal text.

### Hidden extra
- Added the ability to play pong, I'm not telling you how though.
- Supports keyboard, mouse, and touch controls once you find it.

## Project structure

```
├── index.html
├── about/
│   └── index.html
├── contact/
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

## Development notes

- Timezone parsing and alias support can be validated with:

	```bash
	node scripts/check-timezones.js
	```

- Main behavior and integrations are in `assets/js/site.js`.
- Main styling is in `assets/css/site.css`.

## Deployment

Every push to `main` triggers `.github/workflows/deploy-pages.yml` and deploys to GitHub Pages.

### One-time setup

1. Open repository Settings -> Pages.
2. Set Source to GitHub Actions.
3. Save.

The `.nojekyll` file ensures files are served directly without Jekyll processing.
