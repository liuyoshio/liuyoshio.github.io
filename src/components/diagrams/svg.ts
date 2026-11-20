/**
 * Tiny build-time SVG toolkit for the diagram components in this folder.
 *
 * Every diagram builds its markup as a string in the component frontmatter (no client JS),
 * usually twice: a wide layout (viewBox width WIDE) and a narrow, stacked one (NARROW).
 * Diagram.astro shows the narrow one when the figure is narrower than 600px.
 *
 * Type scale (SVG user units, see diagrams.css): heading 14, label 13, small 12.5,
 * mono 12. With WIDE = 640 shown from 600px and NARROW = 352 shown down to a 360px phone
 * (326px of figure), the smallest text renders at about 11.3px or more.
 */

export const WIDE = 640;
export const NARROW = 352;

export type Attr = string | number | boolean | undefined | null;
export type Attrs = Record<string, Attr>;

export function esc(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

const round = (n: number) => Math.round(n * 100) / 100;

function attrString(a: Attrs): string {
	let out = '';
	for (const [k, v] of Object.entries(a)) {
		if (v === undefined || v === null || v === false) continue;
		if (v === true) out += ` ${k}`;
		else out += ` ${k}="${typeof v === 'number' ? round(v) : esc(String(v))}"`;
	}
	return out;
}

/** One element. Children are already-built markup strings. */
export function el(tag: string, a: Attrs = {}, children: string | string[] = ''): string {
	const inner = Array.isArray(children) ? children.join('') : children;
	return inner === '' ? `<${tag}${attrString(a)}/>` : `<${tag}${attrString(a)}>${inner}</${tag}>`;
}

export const g = (children: string | string[], a: Attrs = {}) => el('g', a, children);

/** A native hover tooltip (works without JS). */
export const tip = (s?: string) => (s ? el('title', {}, esc(s)) : '');

export function rect(
	x: number,
	y: number,
	w: number,
	h: number,
	cls: string,
	o: { rx?: number; title?: string; style?: string } = {},
): string {
	return el(
		'rect',
		{ x, y, width: Math.max(0, w), height: Math.max(0, h), rx: o.rx, class: cls, style: o.style },
		tip(o.title),
	);
}

export function line(x1: number, y1: number, x2: number, y2: number, cls: string): string {
	return el('line', { x1, y1, x2, y2, class: cls });
}

export function path(d: string, cls: string, title?: string): string {
	return el('path', { d, class: cls }, tip(title));
}

export function circle(cx: number, cy: number, r: number, cls: string, title?: string): string {
	return el('circle', { cx, cy, r, class: cls }, tip(title));
}

/** A text run: plain string, or segments with their own classes (rendered as tspans). */
export type Run = string | { t: string; cls?: string }[];

function runMarkup(r: Run): string {
	if (typeof r === 'string') return esc(r);
	return r.map((s) => (s.cls ? el('tspan', { class: s.cls }, esc(s.t)) : esc(s.t))).join('');
}

export type Anchor = 'start' | 'middle' | 'end';

/**
 * Text at (x, y) (baseline). `lines` may hold several lines, spaced by `lh`.
 * Classes: dg-t (label, default), dg-s (small, muted), dg-h (heading), dg-m (mono),
 * dg-in (white label inside a coloured fill), dg-b (semibold).
 */
export function text(
	x: number,
	y: number,
	lines: Run | Run[],
	o: { cls?: string; anchor?: Anchor; lh?: number; title?: string } = {},
): string {
	const cls = o.cls ?? 'dg-t';
	const anchor = o.anchor && o.anchor !== 'start' ? o.anchor : undefined;
	const list: Run[] =
		Array.isArray(lines) && lines.length > 0 && !(typeof lines[0] === 'object' && 't' in (lines[0] as object))
			? (lines as Run[])
			: [lines as Run];
	if (list.length === 1) {
		return el('text', { x, y, class: cls, 'text-anchor': anchor }, tip(o.title) + runMarkup(list[0]));
	}
	const lh = o.lh ?? 16;
	const spans = list.map((r, i) => el('tspan', { x, dy: i === 0 ? 0 : lh }, runMarkup(r)));
	return el('text', { x, y, class: cls, 'text-anchor': anchor }, tip(o.title) + spans.join(''));
}

/** Straight arrow; the head is a filled triangle (no <marker>, so no id collisions). */
export function arrow(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	cls = 'dg-arrow',
	head = 6,
): string {
	const a = Math.atan2(y2 - y1, x2 - x1);
	const bx = x2 - head * Math.cos(a);
	const by = y2 - head * Math.sin(a);
	const w = head * 0.6;
	const p1 = [bx + w * Math.sin(a), by - w * Math.cos(a)];
	const p2 = [bx - w * Math.sin(a), by + w * Math.cos(a)];
	return g(
		[
			el('line', { x1, y1, x2: bx, y2: by, class: `${cls}-line` }),
			el('path', {
				d: `M${round(x2)} ${round(y2)}L${round(p1[0])} ${round(p1[1])}L${round(p2[0])} ${round(p2[1])}Z`,
				class: `${cls}-head`,
			}),
		],
		{ class: cls },
	);
}

/** Elbow arrow through the given points (the last segment carries the head). */
export function polyArrow(pts: [number, number][], cls = 'dg-arrow', head = 6): string {
	if (pts.length < 2) return '';
	const body = pts.slice(0, -1);
	const [x1, y1] = pts[pts.length - 2];
	const [x2, y2] = pts[pts.length - 1];
	const d = body.map((p, i) => `${i === 0 ? 'M' : 'L'}${round(p[0])} ${round(p[1])}`).join('');
	return g([el('path', { d, class: `${cls}-line`, fill: 'none' }), arrow(x1, y1, x2, y2, cls, head)]);
}

/** Thousands separators: 16384 -> "16,384". */
export const fmt = (n: number, digits = 0) =>
	n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Signed percent: 33.6 -> "+33.6%", -7.6 -> "−7.6%" (true minus sign). */
export const pct = (n: number, digits = 1) =>
	`${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(digits)}%`;

/**
 * Rough width of a string in user units for Inter (or JetBrains Mono when mono).
 * Used to place labels and to decide whether a label fits inside a mark.
 */
export function measure(s: string, size: number, o: { mono?: boolean; bold?: boolean } = {}): number {
	if (o.mono) return s.length * size * 0.6;
	let em = 0;
	for (const ch of s) {
		if (' .,:;\'|!()[]ijlI'.includes(ch)) em += 0.3;
		else if ('frt'.includes(ch)) em += 0.4;
		else if ('mwMW'.includes(ch)) em += 0.86;
		else if (/[0-9]/.test(ch)) em += 0.6;
		else if (/[A-Z]/.test(ch)) em += 0.68;
		else if (/[a-z]/.test(ch)) em += 0.56;
		else em += 0.64;
	}
	return em * size * (o.bold ? 1.05 : 1);
}

let counter = 0;

/**
 * The root <svg>. Accessible name and description come from <title> and <desc>;
 * maxW caps how far it scales up, minW is where the figure starts to scroll instead.
 */
export function svg(o: {
	w: number;
	h: number;
	title: string;
	desc: string;
	body: string | string[];
	maxW?: number;
	minW?: number;
}): string {
	counter += 1;
	const id = `dg${counter}`;
	const maxW = o.maxW ?? Math.round(o.w * (o.w > 500 ? 1.25 : 1.3));
	const minW = o.minW ?? Math.round(o.w * 0.88);
	const body = Array.isArray(o.body) ? o.body.join('') : o.body;
	return el(
		'svg',
		{
			xmlns: 'http://www.w3.org/2000/svg',
			viewBox: `0 0 ${o.w} ${round(o.h)}`,
			width: o.w,
			height: round(o.h),
			role: 'img',
			'aria-labelledby': `${id}-t ${id}-d`,
			class: 'dg-svg',
			style: `--dg-max:${maxW}px;--dg-min:${minW}px`,
		},
		el('title', { id: `${id}-t` }, esc(o.title)) + el('desc', { id: `${id}-d` }, esc(o.desc)) + body,
	);
}

/** A legend key: a small swatch then its label. Returns markup and the width used. */
export function key(
	x: number,
	y: number,
	label: string,
	swatchCls: string,
	o: { shape?: 'rect' | 'dot' | 'ring' | 'line'; cls?: string } = {},
): { m: string; w: number } {
	const shape = o.shape ?? 'rect';
	let sw = '';
	if (shape === 'rect') sw = rect(x, y - 9, 12, 10, swatchCls, { rx: 2 });
	else if (shape === 'dot') sw = circle(x + 6, y - 4, 4.5, swatchCls);
	else if (shape === 'ring') sw = circle(x + 6, y - 4, 4, swatchCls);
	else sw = line(x, y - 4, x + 14, y - 4, swatchCls);
	const tx = x + (shape === 'line' ? 19 : 17);
	const cls = o.cls ?? 'dg-s';
	return { m: sw + text(tx, y, label, { cls }), w: tx - x + measure(label, 12.5) };
}

/** Lay keys out left to right, wrapping at maxX. Returns markup and the bottom baseline. */
export function keyRow(
	x0: number,
	y0: number,
	maxX: number,
	items: { label: string; cls: string; shape?: 'rect' | 'dot' | 'ring' | 'line' }[],
	gap = 16,
	lh = 18,
): { m: string; y: number } {
	let x = x0;
	let y = y0;
	const parts: string[] = [];
	for (const it of items) {
		const width = (it.shape === 'line' ? 19 : 17) + measure(it.label, 12.5);
		if (x > x0 && x + width > maxX) {
			x = x0;
			y += lh;
		}
		const k = key(x, y, it.label, it.cls, { shape: it.shape });
		parts.push(k.m);
		x += width + gap;
	}
	return { m: parts.join(''), y };
}

/** measure() is an estimate; wrapped lines keep this much slack for the real font. */
const WRAP_SAFETY = 1.08;

/** Greedy word wrap to a width in user units (uses measure()). */
export function wrap(s: string, maxW: number, size = 12.5, o: { bold?: boolean } = {}): string[] {
	const lines: string[] = [];
	let cur = '';
	for (const word of s.split(' ')) {
		const next = cur ? `${cur} ${word}` : word;
		if (cur && measure(next, size, o) * WRAP_SAFETY > maxW) {
			lines.push(cur);
			cur = word;
		} else cur = next;
	}
	if (cur) lines.push(cur);
	return lines;
}

/** A bracket under columns from x1 to x2 at y (ticks point up), with a centred label below. */
export function bracket(x1: number, x2: number, y: number, label: string, cls = 'dg-s'): string {
	return (
		path(`M${round(x1)} ${round(y - 4)}L${round(x1)} ${round(y)}L${round(x2)} ${round(y)}L${round(x2)} ${round(y - 4)}`, 's-muted') +
		text((x1 + x2) / 2, y + 15, label, { cls, anchor: 'middle' })
	);
}

/** Text with subscripts: segments are plain strings or { sub } (drawn smaller and lower). */
export function mathText(
	x: number,
	y: number,
	segs: (string | { sub: string })[],
	o: { cls?: string; anchor?: Anchor } = {},
): string {
	let out = '';
	let down = false;
	for (const s of segs) {
		if (typeof s === 'string') {
			out += el('tspan', down ? { dy: -4 } : {}, esc(s));
			down = false;
		} else {
			out += el('tspan', { dy: 4, style: 'font-size:72%' }, esc(s.sub));
			down = true;
		}
	}
	const anchor = o.anchor && o.anchor !== 'start' ? o.anchor : undefined;
	return el('text', { x, y, class: o.cls ?? 'dg-t', 'text-anchor': anchor }, out);
}
