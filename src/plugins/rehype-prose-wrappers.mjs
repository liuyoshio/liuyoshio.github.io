// @ts-check
/**
 * Small rehype plugin for long-form posts. Astro runs user rehype plugins after
 * Shiki, in both .md and .mdx files, so code blocks are already highlighted here.
 *
 * - Wraps every <table> in a focusable region that scrolls horizontally, so wide
 *   tables scroll inside the text column instead of widening the page.
 * - Wraps every Shiki code block (<pre class="astro-code">) in a frame with a
 *   language label and a copy button. The button ships `hidden`; the post layout's
 *   script reveals it, so readers without JavaScript never see a dead control.
 *
 * Nodes are plain hast objects; `any` keeps this file free of extra type packages.
 */

/** @param {any} node @param {string} tagName @param {string} className */
function is(node, tagName, className) {
	if (node?.type !== 'element' || node.tagName !== tagName) return false;
	const value = node.properties?.className ?? node.properties?.class;
	const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/\s+/) : [];
	return list.includes(className);
}

/** @param {string} tagName @param {Record<string, unknown>} properties @param {any[]} children */
function h(tagName, properties, children) {
	return { type: 'element', tagName, properties, children };
}

/** @param {any} table */
function wrapTable(table) {
	return h('div', { className: ['table-wrap'], role: 'region', ariaLabel: 'Table', tabIndex: 0 }, [
		table,
	]);
}

/** @param {any} pre */
function wrapCode(pre) {
	const raw = pre.properties?.dataLanguage;
	const lang = typeof raw === 'string' && raw && raw !== 'plaintext' ? raw : 'text';
	return h('div', { className: ['code-block'] }, [
		h('div', { className: ['code-header'] }, [
			h('span', { className: ['code-lang'] }, [{ type: 'text', value: lang }]),
			h(
				'button',
				{ type: 'button', className: ['code-copy'], hidden: true, ariaLabel: `Copy ${lang} code` },
				[{ type: 'text', value: 'Copy' }],
			),
		]),
		pre,
	]);
}

/** @param {any} parent */
function walk(parent) {
	const children = parent.children;
	if (!Array.isArray(children)) return;
	for (let i = 0; i < children.length; i++) {
		const node = children[i];
		if (node.type === 'element' && node.tagName === 'table' && !is(parent, 'div', 'table-wrap')) {
			children[i] = wrapTable(node);
		} else if (is(node, 'pre', 'astro-code') && !is(parent, 'div', 'code-block')) {
			children[i] = wrapCode(node);
		} else {
			// Recurse into elements and MDX JSX nodes alike (e.g. code inside a <Callout>).
			walk(node);
		}
	}
}

export function rehypeProseWrappers() {
	/** @param {any} tree */
	return (tree) => {
		walk(tree);
	};
}
