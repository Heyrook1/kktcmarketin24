# QA Report

Generated: 2026-05-03T05:01:15Z

## Scope

- Read `CLAUDE.md` and reviewed App Router pages under `app/`.
- Checked internal navigation targets referenced by pages and shared layout components.
- Verified `/privacy`, `/terms`, and `/help` routes exist.
- Reviewed public product surfaces for zero-stock and demo product visibility.
- Reviewed `/compare` claims for unlaunched feature indicators.
- Verified footer/help phone number consistency.

## Findings and actions

| Check | Result | Action |
| --- | --- | --- |
| Broken internal links under `app/` | No missing static/dynamic route targets found in reviewed `Link`, `redirect`, and router navigation usages. | No route changes required. |
| `/privacy`, `/terms`, `/help` pages | Present. | No page creation required. |
| Home page `stock=0` products | Home product sections queried active products without enforcing stock. | Added public in-stock filtering and increased fetch window before slicing to the requested section size. |
| Demo products visible publicly | Demo-seeded rows can surface through DB-backed listings/search if active. | Added shared public product filters and applied them to home, `/urunler`, category, vendor, search API, product detail, and related-product surfaces. |
| `/compare` unavailable features marked as available | Mobile app, loyalty program, and 7/24 live support were presented as current Marketin24 features. | Removed mobile app and loyalty program from comparison rows and updated Marketin24 support copy to current help/phone support. |
| Footer phone consistency | `+90 533 873 43 17` is used consistently in footer and help page. | No change required. |

## GitHub issue

Could not open a GitHub Issue from this environment because the available GitHub CLI is read-only and no issue-creation tool is configured. The fixes above are included in this branch and the QA report documents the bug-class findings.
