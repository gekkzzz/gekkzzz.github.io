# gekkzzz site

This is a static site hosted on GitHub Pages.

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
