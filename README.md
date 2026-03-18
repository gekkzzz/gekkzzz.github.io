# gekkzzz site

This project is now GitHub Pages compatible.

## GitHub Pages mode (`https://gekkzzz.github.io`)

- Works as a static website with no server required.
- Guestbook still works, but entries are stored per-browser on each visitor's device.
- This is the default behavior on `*.github.io` unless you set a custom API URL.

## Optional shared guestbook API

If you want shared messages across all visitors, host the Node API and set it in `index.html`:

```html
<meta name="guestbook-api-url" content="https://your-api-domain.com/api/guestbook">
```

When this value is set, the frontend uses that API even on GitHub Pages.

## Local development with shared API

1. Start the local server:

```bash
npm start
```

2. Open:

```text
http://localhost:3000
```

## Deploying to GitHub Pages

This repo includes an auto-deploy workflow at `.github/workflows/deploy-pages.yml`.

### One-time setup in GitHub

1. Open repository Settings.
2. Go to Pages.
3. Set Source to GitHub Actions.
4. Save.

After that, every push to `main` or `master` deploys automatically.

For user site repo (`gekkzzz.github.io`):

1. Commit and push these files to the default branch.
2. GitHub Actions deploys the site automatically.

For project repo (not `username.github.io`):

1. Enable GitHub Pages in repo Settings.
2. Set Source to GitHub Actions.

The `.nojekyll` file is included so GitHub Pages serves files directly without Jekyll processing.
