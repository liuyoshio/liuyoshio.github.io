import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Markdown and MDX posts in `src/content/blog/`. The file name is the URL slug:
	// `src/content/blog/my-post.mdx` -> `/blog/my-post/`.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			/** 1-2 sentences, used for post cards, RSS and SEO. */
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			/** A local image, e.g. `../../assets/blog/my-post/hero.png`. */
			heroImage: z.optional(image()),
			tags: z.array(z.string()).default([]),
			/** Drafts render in `astro dev` but are left out of production pages, RSS and the sitemap. */
			draft: z.boolean().default(false),
		}),
});

export const collections = { blog };
