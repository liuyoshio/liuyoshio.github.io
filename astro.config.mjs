// @ts-check

import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { rehypeProseWrappers } from './src/plugins/rehype-prose-wrappers.mjs';

// Fontsource's "latin" subset. Characters outside it fall back to system fonts.
/** @type {[string, ...string[]]} */
const LATIN = [
	'U+0000-00FF',
	'U+0131',
	'U+0152-0153',
	'U+02BB-02BC',
	'U+02C6',
	'U+02DA',
	'U+02DC',
	'U+0304',
	'U+0308',
	'U+0329',
	'U+2000-206F',
	'U+20AC',
	'U+2122',
	'U+2191',
	'U+2193',
	'U+2212',
	'U+2215',
	'U+FEFF',
	'U+FFFD',
];

// https://astro.build/config
export default defineConfig({
	// GitHub Pages user site (repo `liuyoshio.github.io`), so no `base` is needed.
	site: 'https://liuyoshio.github.io',
	integrations: [mdx(), sitemap()],
	markdown: {
		// Astro 7 defaults to the Sätteri processor; remark/rehype plugins need Unified.
		// MDX inherits this processor (and the Shiki config below).
		processor: unified({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeKatex, rehypeProseWrappers],
		}),
		shikiConfig: {
			themes: { light: 'github-light-default', dark: 'github-dark-default' },
			// Emit only CSS variables; src/styles/prose.css picks the light or dark set
			// so code follows both the OS setting and the manual theme toggle.
			defaultColor: false,
		},
	},
	// Self-hosted variable fonts, resolved from the installed @fontsource-variable packages
	// at build time. Nothing is fetched from a third party at runtime.
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Inter',
			cssVariable: '--font-sans',
			fallbacks: ['system-ui', 'sans-serif'],
			options: {
				variants: [
					{
						src: ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'],
						weight: '100 900',
						style: 'normal',
						unicodeRange: LATIN,
					},
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: 'Source Serif 4',
			cssVariable: '--font-serif',
			fallbacks: ['Georgia', 'serif'],
			options: {
				variants: [
					{
						src: ['@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2'],
						weight: '200 900',
						style: 'normal',
						unicodeRange: LATIN,
					},
					{
						src: ['@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-italic.woff2'],
						weight: '200 900',
						style: 'italic',
						unicodeRange: LATIN,
					},
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: 'JetBrains Mono',
			cssVariable: '--font-mono',
			fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
			options: {
				variants: [
					{
						src: ['@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'],
						weight: '100 800',
						style: 'normal',
						unicodeRange: LATIN,
					},
				],
			},
		},
	],
});
