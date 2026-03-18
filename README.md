# gekkzzz site

Personal static website for gekkzzz, hosted on GitHub Pages.

## Website and code features

- Auto-deploy setup for GitHub Pages using a GitHub Actions workflow.
- A live time section showing:
	- My time in the UK (`Europe/London`).
	- Your local time using timezone detection from `ipwho.is`, with browser timezone fallback.
- A custom GitHub contribution graph rendered on the homepage:
	- Data is pulled from the GitHub profile contribution API.
	- The calendar is rendered by custom JavaScript (not an embedded image/widget).
	- It refreshes automatically at the top of every hour.
- Latest blog posts loaded dynamically from the Substack RSS feed.
- Multi-page structure with Home, About, and Contact pages.

## Deploying to GitHub Pages

This repo uses an auto-deploy workflow at `.github/workflows/deploy-pages.yml`.

### One-time setup

1. Open repository Settings.
2. Open Pages.
3. Set Source to GitHub Actions.
4. Save.

After setup, every push to `main` or `master` deploys automatically.

The `.nojekyll` file is included so GitHub Pages serves files directly without Jekyll processing.
