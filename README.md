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
  venue labels, and optional selected-work summaries. Use `null` for unavailable
  links instead of `#`; use `featured: true` to feature a publication.
- `_data/profile.json`: bilingual honors, reviewing, and research projects. The
  education timeline is in `_includes/academic-experience.html`.
- `_data/gs.yml`: baked Scholar statistics, still maintained by the existing workflow.
- `assets/css/academic.css` and `assets/js/academic.js`: responsive styling,
  language selection, publication search/year filtering, and mobile navigation.
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
