# Yuanpeng He's academic homepage

Live site: https://www.hyppyh.top/

A bilingual academic homepage built with Jekyll and served by GitHub Pages.
The current design uses a warm paper background, restrained burgundy accents,
and an editorial layout. It has no front-end framework or JavaScript dependencies.

## Content and design

- `_pages/about.md`: root page and existing `/about/` / `/about.html` redirects.
- `_layouts/academic.html`: document metadata, responsive navigation, and footer.
- `_includes/academic-*.html`: hero, selected research, publication archive, and CV.
- `_data/publications.json`: all publications, image paths, existing resource links,
  venue labels, and selected-work order. Use `null` for unavailable
  links instead of `#`; use `featured: true` and `featured_order` to feature a publication.
- `_data/profile.json`: bilingual honors, reviewing, and research projects. The
  education timeline is in `_includes/academic-experience.html`.
- `_data/gs.yml`: last verified fallback snapshot embedded into the initial HTML.
  Scheduled updates refresh this file and `assets/data/scholar.json`, and publish
  fresh JSON to the `google-scholar-stats` branch.
- `assets/css/academic.css` and `assets/js/academic.js`: responsive styling,
  language selection, publication search/year filtering, and mobile navigation.
- `assets/js/appearance.js`: scroll-aware glass navigation and one-time section
  entrance motion, with reduced-motion and print support.
- `assets/js/selected-work.js`: arrow and keyboard navigation for the native
  horizontal selected-work carousel; touch scrolling works without JavaScript.
- `assets/js/scholar-stats.js`: validated live snapshot loading, timestamp display,
  and last-successful-value caching.
- `_data/navigation.yml`: shared English/Chinese navigation and main-section labels.
- `_config.yml`: personal details and Jekyll configuration.

All 37 original publication records, 22 honors, 27 reviewing records, seven
research projects, and three education entries were preserved in the redesign.
The old `_pages/includes/` files and default layout are retained as legacy sources;
the active homepage reads the structured data and academic templates above.

## Preview and checks

With the repository's Ruby dependencies installed:

```sh
bundle exec jekyll serve
```

JavaScript syntax can be checked with `node --check assets/js/academic.js`.
Check both languages and phone/desktop widths when changing the layout. Verify
search, year filters, expanded publications, mobile navigation, and CV disclosures.
Without JavaScript, all publications remain readable. Print output includes all
publications and expands the CV disclosures when JavaScript is available.

## Original-site backup

The complete pre-redesign site is preserved at Git tag
`backup/2026-10-14-before-redesign` (commit `371dad4519c86e9b66c111e618cdacea03a04895`).
This tag is also stored in the GitHub repository.

To inspect the old site in a separate directory:

```sh
git worktree add ../homepage-original backup/2026-10-14-before-redesign
```

To restore it online, first preserve any later work, restore the old files in a
separate branch, and publish a normal restoration commit. Do not force-push or
remove history. An offline source ZIP, full-history Git bundle, and original
screenshot were also saved outside this repository during the redesign.

## Automatic Google Scholar synchronization

Daily synchronization runs in the owner's local Codex task at **08:30
Asia/Shanghai**. Keep that computer powered on, online, and Codex running. The
local script was verified to fetch and publish successfully. The in-chat scheduled
task is named `个人主页 Scholar 每日同步` (automation ID: `scholar`).

GitHub's cloud runner passed the parser tests but failed the real Scholar fetch
in the October 14, 2026 validation. Its automatic schedule was therefore removed;
the `Update Google Scholar Stats` workflow remains manual-only for diagnostics
via **Run workflow**. Daily synchronization does not depend on that cloud runner.

The standard-library Python crawler fetches the public profile's **All** column
for citations, h-index, and i10-index. The public profile ID defaults to
`HaefBCQAAAAJ`; no secret or paid API is required. Only a complete, validated
snapshot is published to `google-scholar-stats`. Access denials, CAPTCHA pages,
network failures, and invalid values fail the job without changing published data.
The branch keeps its history; neither the workflow nor manual refresh force-pushes.

The homepage reads the latest JSON on opening and every 15 minutes while visible.
It reads the same-origin `assets/data/scholar.json`, GitHub Raw, and jsDelivr in
parallel and selects the newest valid successful-fetch timestamp. A successful
HTTP response containing old data does not prevent checking the other sources. Only a snapshot
with the matching profile ID, valid counters, and a newer successful-fetch timestamp
can replace the displayed values. A newer correction can legitimately reduce a
counter. Browser storage retains the latest good snapshot when available; on errors,
the previous numbers and timestamp remain visible. The displayed synchronization
time is in UTC+8 and is also visible on phones. This is daily synchronization,
not a guarantee of instantaneous updates from Google Scholar.

Manual refresh (uses the same parser and the local machine's normal connection):

```sh
bash google_scholar_crawler/refresh_local.sh
```

This uses temporary checkouts to update the data branch and **only** the generated
`_data/gs.yml` and `assets/data/scholar.json` files on `main`. That normal commit
triggers a Pages rebuild, keeping the initial HTML current even without browser
JavaScript or external delivery hosts. The user checkout is never changed; a
concurrent main-branch edit is handled with one rebase, never a force-push.
No Python package installation is needed. Check the local scheduled task results if a daily
refresh fails. To validate the parser and failure handling locally:

```sh
python3 -m unittest discover -s google_scholar_crawler -p 'test_*.py'
```
