import { type CollectionEntry, getCollection } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/**
 * Posts to show, newest first. Drafts are included in `astro dev` and excluded from
 * production builds (and therefore from every list, tag page, RSS item and sitemap URL).
 */
export async function getPosts(): Promise<Post[]> {
	const posts = await getCollection('blog', ({ data }) =>
		import.meta.env.PROD ? data.draft !== true : true,
	);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function postUrl(post: Post | string): string {
	return `/blog/${typeof post === 'string' ? post : post.id}/`;
}

/** "LLM serving" -> "llm-serving", "llama.cpp" -> "llama-cpp". */
export function tagSlug(tag: string): string {
	return tag
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function tagUrl(tag: string): string {
	return `/tags/${tagSlug(tag)}/`;
}

export interface TagInfo {
	slug: string;
	/** Display name: the first spelling seen, newest post first. */
	name: string;
	posts: Post[];
}

/** Tags across the given posts, grouped by slug, most used first. */
export function collectTags(posts: Post[]): TagInfo[] {
	const tags = new Map<string, TagInfo>();
	for (const post of posts) {
		for (const name of post.data.tags) {
			const slug = tagSlug(name);
			if (!slug) continue;
			const entry = tags.get(slug) ?? { slug, name, posts: [] };
			if (!entry.posts.includes(post)) entry.posts.push(post);
			tags.set(slug, entry);
		}
	}
	return [...tags.values()].sort(
		(a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name),
	);
}

const WORDS_PER_MINUTE = 220;

/**
 * Estimated reading time in minutes from the raw Markdown/MDX body: MDX import/export
 * lines and HTML/JSX tags are dropped, everything else (prose, code, math) is counted.
 */
export function readingMinutes(body: string | undefined): number {
	if (!body) return 1;
	const text = body
		.replace(/^\s*(import|export)\s.*$/gm, ' ')
		.replace(/<\/?[A-Za-z][^>]*>/g, ' ')
		.replace(/[#*_`>|~=[\](){}$\\]+/g, ' ');
	const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
