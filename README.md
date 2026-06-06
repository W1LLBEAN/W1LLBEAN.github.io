# Bean Dong Personal Website

This repository is a GitHub Pages-friendly multi-page personal website. It is designed as a long-term resume and personal archive, with content managed through JSON instead of hard-coded page text.

## How To Edit

- Main public content: `data/site.json`
- Pages: `index.html`, `work.html`, `resume.html`, `places.html`, `life.html`, `contact.html`
- Visual style: `styles.css`
- Rendering and interactions: `script.js`

For routine updates, edit `data/site.json` first. Add new project cards to `work.timeline`, resume updates to `resume`, new cities to `places`, and creative sections to `life.items`.

## GitHub Pages Setup

1. Create a GitHub repository for this site.
2. Push these files to the repository.
3. In GitHub, open Settings > Pages.
4. Select the branch that contains `index.html`.
5. Use the generated GitHub Pages URL as the public resume link.

## Privacy Rules

- Do not publish phone number, home address, internal issue IDs, internal paths, confidential station parameters, unreleased product details, or coworker contact details.
- Prefer public-safe role descriptions, project categories, and engineering impact statements.
- When exact metrics are not public-safe, use qualitative impact descriptions.

## Local Preview

Run a small static server from the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```
