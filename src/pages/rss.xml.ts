import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { getPosts, postUrl } from '../lib/posts';

// Summary feed: title, description, date and tags per post (drafts are never included
// in production builds). MDX components cannot be rendered into RSS, so no full content.
export async function GET(context: APIContext) {
	const posts = await getPosts();
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site ?? 'https://liuyoshio.github.io',
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			link: postUrl(post),
			categories: post.data.tags,
		})),
		customData: '<language>en</language>',
	});
}
