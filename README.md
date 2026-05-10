# steno-public

Public GitHub Pages site for Steno support and privacy information.

## Structure

- `index.html` is the public landing page
- `marketing/index.html` contains the public marketing page
- `support/index.html` contains the published support page
- `privacy/index.html` contains the published privacy policy
- `styles.css` contains the shared site styles
- `assets/steno-logo.jpg` contains the shared logo asset
- `CNAME` configures the GitHub Pages custom domain: `trysteno.app`

This repo is intentionally separate from the private application source repo.

## Custom Domain

GitHub Pages serves this site from `trysteno.app`.

Configure DNS for the apex domain with these `A` records:

- `185.199.108.153`
- `185.199.109.153`
- `185.199.110.153`
- `185.199.111.153`

If `www.trysteno.app` should also resolve, add a `CNAME` record for `www` pointing to `pancham97.github.io`.
