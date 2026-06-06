# AGENTS.md

## Project Goal

This is Bean Dong's personal website. It is a long-term professional profile and personal archive, not a one-time resume page.

The website should present:

- Career timeline
- Project highlights
- Public resume view
- Cities and work memories
- Drawing, gaming, and creative interests
- Contact entry for HR and professional conversations

## Editing Rules

- Prefer editing content in `data/site.json`.
- Preserve the multi-page navigation: `index.html`, `work.html`, `resume.html`, `places.html`, `life.html`, and `contact.html` should remain separate pages.
- Do not rewrite career history unless explicitly requested.
- Keep the tone professional, warm, direct, and public-safe.
- Use English as the main website language, with Chinese optional in future versions.
- Preserve the existing visual style unless the user asks for a redesign.
- Do not expose private information such as phone number, home address, internal confidential project details, customer-sensitive workflows, coworker names, or unreleased product information.

## Data Rules

Timeline entries should include:

- `period`
- `company`
- `location`
- `role`
- `highlights`

Project entries should include:

- `label`
- `name`
- `summary`
- `role`
- `approach`
- `impact`

Place entries should include:

- `city`
- `work`
- `people`
- `taste`

## Before Finishing

- Run a local static server when previewing the site.
- Check desktop and mobile layout.
- Summarize changed files.
- Mention content that still needs human review.
