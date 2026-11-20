# Jiawei Liu's blog

Personal technical blog: notes on ML systems, LLM serving, and things I build.
Built with [Astro](https://docs.astro.build) 7 and deployed to GitHub Pages at
<https://liuyoshio.github.io>.

- Markdown and MDX posts in a typed content collection, with drafts
- Math with KaTeX (`remark-math` + `rehype-katex`), code highlighting with Shiki (light and dark)
- `<Figure>` and `<Callout>` components for posts
- Table of contents, reading time, tag pages, RSS feed and sitemap
- Light/dark theme that follows the OS, with a toggle; self-hosted fonts; no runtime third-party requests

## Run locally

Requires Node 22.23+ (24 recommended) and pnpm 9.

```sh
pnpm install
pnpm dev          # http://localhost:4321, drafts included
pnpm check        # type-check .astro/.ts files and content schemas
pnpm build        # production build into dist/, drafts excluded
pnpm preview      # serve dist/ locally
```

## Write a post

Create `src/content/blog/<slug>.md` or `.mdx`. The file name becomes the URL:
`src/content/blog/my-post.mdx` is published at `/blog/my-post/`.

```mdx
---
title: 'A clear, specific title'
description: 'One or two sentences. Used on post cards, in RSS and for search/social previews.'
pubDate: 2026-11-16
updatedDate: 2026-11-20 # optional
heroImage: '../../assets/blog/my-post/hero.png' # optional
tags: ['LLM serving', 'llama.cpp'] # optional, default []
draft: true # optional, default false
---
```

- **Headings:** start at `##`. The title is the page's only `h1`. `##` and `###` headings
  build the table of contents automatically, so do not write one by hand.
- **Drafts:** `draft: true` posts show in `pnpm dev` (with a "Draft" badge) and are left out
  of `pnpm build`: no page, no list entry, no tag page, no RSS item, no sitemap URL.
- **Unpublished posts** live in `drafts/`, which git ignores and which mirrors `src/`. To publish
  one, copy its files back into `src/` and set `draft: false`.
- **Tags:** free text. Each tag gets a page at `/tags/<slug>/` (`llama.cpp` -> `/tags/llama-cpp/`).
- **Reading time** is estimated from the post body at 220 words per minute.

### Images and figures (MDX)

Put a post's images in `src/assets/blog/<slug>/`, import them at the top of the file, and
render them with `<Figure>`. Astro resizes them and serves responsive WebP.

```mdx
import Figure from '../../components/Figure.astro';
import kvTimeline from '../../assets/blog/my-post/kv-timeline.png';

<Figure src={kvTimeline} alt="What the image shows, for screen readers" caption="Optional caption." />
<Figure src={kvTimeline} alt="..." caption="Wide figures break out of the text column on desktop." wide />
```

| Prop      | Type            | Notes                                                       |
| --------- | --------------- | ----------------------------------------------------------- |
| `src`     | `ImageMetadata` | an imported local image (required)                          |
| `alt`     | `string`        | required                                                    |
| `caption` | `string`        | optional, plain text                                        |
| `wide`    | `boolean`       | optional; up to 60rem wide on large screens                 |

Images sit on a white background with a thin border in both themes, so charts with
transparent backgrounds stay readable in dark mode.

### Callouts (MDX)

```mdx
import Callout from '../../components/Callout.astro';

<Callout type="tip" title="Pin each worker to a slot">
Markdown works inside, including `code`, links and code blocks.
</Callout>
```

`type` is `note`, `tip` or `warning`; `title` is optional (defaults to the type's name).

### Math and code

- Inline math: `$O(n^2)$`. Display math on its own lines:

  ```md
  $$
  \text{KV bytes} = 2 \cdot n_\text{layers} \cdot n_\text{kv heads} \cdot d_\text{head} \cdot 2
  $$
  ```

- The KaTeX stylesheet comes from the `katex` package in `package.json`, while
  `rehype-katex` renders the HTML. The two must be the same version (KaTeX renames
  layout classes between minor versions), so `katex` is pinned to the version
  `rehype-katex` supports and `pnpm.overrides` makes every package use that one copy.
  Bump them together, and check that `ls node_modules/.pnpm | grep '^katex@'` lists one.
- Fenced code blocks with a language (`bash`, `json`, `python`, `text`, ...) get syntax
  highlighting in both themes, a language label and a copy button.
- Tables scroll horizontally inside the text column when they are wide.

## Projects

`/projects/` is generated from `src/data/projects.ts`; the comment at the top shows how to
add one. Set `featured: true` to also show a project on the home page. A project's
`post` field links its write-up only while that post is published.

## Deploy (GitHub Pages)

The workflow in `.github/workflows/deploy.yml` builds with the official
[Astro GitHub Action](https://docs.astro.build/en/guides/deploy/github/) and deploys on
every push to `main`. One-time setup:

1. Create a public GitHub repository named **`liuyoshio.github.io`** (a user site, so
   `astro.config.mjs` needs no `base`).
2. Push this project to its `main` branch:
   ```sh
   git add -A && git commit -m "Initial blog"
   git remote add origin https://github.com/liuyoshio/liuyoshio.github.io.git
   git push -u origin main
   ```
3. On GitHub: **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**.
4. Watch the run under **Actions**; the site appears at <https://liuyoshio.github.io>.

Commit `pnpm-lock.yaml`: the action uses it to install exact versions.

## Where things live

```text
src/
  components/   BaseHead, Header, Footer, Figure, Callout, TableOfContents, PostList, ...
  content/blog/ posts (.md / .mdx)
  data/         projects.ts
  layouts/      BaseLayout (every page), BlogPost (posts)
  lib/          posts.ts (drafts, sorting, tags, reading time), images.ts
  pages/        index, blog/, tags/, projects, 404, rss.xml
  plugins/      rehype-prose-wrappers.mjs (table scroll wrapper, code block frame)
  styles/       global.css (tokens, theme, base), prose.css (post typography)
src/consts.ts   site title, description, GitHub link
```

Colours are CSS custom properties at the top of `src/styles/global.css` (light, then dark).
Fonts (Inter, Source Serif 4, JetBrains Mono) are installed from npm and self-hosted
through Astro's fonts API; see `fonts` in `astro.config.mjs`.
