/**
 * Projects shown on /projects/ (and on the home page when `featured` is true).
 *
 * To add a project, append an object to `projects`:
 *
 *   {
 *     title: 'My Project',
 *     description: 'One or two sentences on what it is and why it is interesting.',
 *     tags: ['LLM serving', 'CUDA'],
 *     post: 'my-project-write-up', // optional: file name in src/content/blog/, without extension
 *     repo: 'https://github.com/liuyoshio/my-project', // optional
 *     url: 'https://example.com/demo', // optional: demo, paper, slides...
 *     context: 'Side project · 2027', // optional: a short label
 *     featured: true, // optional: also show it on the home page
 *   },
 *
 * Order in this list is the order on the page.
 */

export interface Project {
	title: string;
	description: string;
	tags: string[];
	/** Id of a post in `src/content/blog/` (the file name without extension). */
	post?: string;
	/** Source code. */
	repo?: string;
	/** Any other link: demo, paper, slides. */
	url?: string;
	/** Short label such as "Course project · 2026". */
	context?: string;
	/** Also show on the home page. */
	featured?: boolean;
}

export const projects: Project[] = [
	{
		title: 'Lookma',
		description:
			'Talk to your Mac and watch an AI use your real apps, right on your screen. Risky steps wait for a spoken yes, and it steps aside while you type.',
		tags: ['AI agents', 'macOS', 'voice', 'open source'],
		post: 'introducing-lookma',
		repo: 'https://github.com/liuyoshio/lookma',
		context: 'Open source · 2026',
		featured: true,
	},
	{
		title: 'Memory-Aware Agent Edge Serving',
		description:
			"A client-side KV-cache manager that lets many tool-using LLM agents share one small GPU through llama.cpp's server.",
		tags: ['LLM serving', 'llama.cpp', 'KV cache', 'agents'],
		post: 'memory-aware-agent-serving',
		repo: 'https://github.com/YufanPeter/Memory-Aware-Agent-Edge-Serving/tree/jiawei',
		context: 'LLM serving · 2026',
		featured: true,
	},
];
