/**
 * Shared pieces for the operator diagrams (OperatorArchitecture, HandsPipeline, ApprovalRoutes,
 * ConsentGate): titled blocks, chips, two-headed arrows, and the overlay's marks (the coral
 * ring, the ghost cursor and the label that hangs off the ring). Styles: operator.css.
 */
import { arrow, circle, el, measure, rect, text, wrap } from './svg';

const CJK = /[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/g;

/** measure(), with CJK characters at a full em (measure() counts them as Latin letters). */
export function measureMixed(s: string, size: number): number {
	const n = (s.match(CJK) ?? []).length;
	return measure(s.replace(CJK, ''), size) + n * size;
}

/** Room around the text in a block. */
export const PAD = 10;

export interface BlockLayout {
	w: number;
	pad: number;
	tl: string[];
	bl: string[];
	titleY: number;
	bodyY: number;
	h: number;
}

/**
 * Lay out a block: a bold title, then a muted body, both wrapped to the width.
 * The returned h is the height the block needs; pass a larger one to align a row.
 */
export function layoutBlock(
	w: number,
	title: string | undefined,
	body: string | undefined,
	o: { pad?: number } = {},
): BlockLayout {
	const pad = o.pad ?? PAD;
	const inner = w - 2 * pad;
	const tl = title ? wrap(title, inner, 13, { bold: true }) : [];
	const bl = body ? wrap(body, inner, 12.5) : [];
	const titleY = pad + 11;
	let last = 0;
	if (tl.length) last = titleY + (tl.length - 1) * 16;
	const bodyY = tl.length ? last + 17 : pad + 11;
	if (bl.length) last = bodyY + (bl.length - 1) * 15;
	return { w, pad, tl, bl, titleY, bodyY, h: last + pad + 1 };
}

/** Draw a laid-out block at (x, y), h tall (defaults to the height it needs). */
export function drawBlock(
	x: number,
	y: number,
	L: BlockLayout,
	o: { h?: number; box?: string; titleCls?: string; bodyCls?: string; rx?: number } = {},
): string {
	const h = o.h ?? L.h;
	const out: string[] = [];
	if (o.box !== '') out.push(rect(x, y, L.w, h, o.box ?? 'f-box', { rx: o.rx ?? 6 }));
	if (L.tl.length) out.push(text(x + L.pad, y + L.titleY, L.tl, { cls: o.titleCls ?? 'dg-t dg-b', lh: 16 }));
	if (L.bl.length) out.push(text(x + L.pad, y + L.bodyY, L.bl, { cls: o.bodyCls ?? 'dg-s', lh: 15 }));
	return out.join('');
}

export interface Chip {
	t: string;
	/** chip fill class (default op-chip) */
	cls?: string;
	/** text class (default dg-s) */
	tcls?: string;
	/** a small coral dot before the text, as on the overlay's mark label */
	dot?: boolean;
}

/** Chips laid left to right from (x0, y0), wrapping at maxW. Returns markup and the height used. */
export function chips(x0: number, y0: number, maxW: number, items: Chip[], o: { h?: number; gap?: number } = {}): { m: string; h: number } {
	const h = o.h ?? 22;
	const gap = o.gap ?? 6;
	let x = x0;
	let y = y0;
	const out: string[] = [];
	for (const c of items) {
		const lead = c.dot ? 15 : 8;
		const w = lead + measureMixed(c.t, 12.5) * 1.04 + 8;
		if (x > x0 && x + w > x0 + maxW) {
			x = x0;
			y += h + gap;
		}
		out.push(rect(x, y, w, h, c.cls ?? 'op-chip', { rx: h / 2 }));
		if (c.dot) out.push(circle(x + 9, y + h / 2, 3, 'op-coral'));
		out.push(text(x + lead, y + h / 2 + 4.3, c.t, { cls: c.tcls ?? 'dg-s' }));
		x += w + gap;
	}
	return { m: out.join(''), h: y + h - y0 };
}

/** A straight arrow with a head at both ends. */
export function biArrow(x1: number, y1: number, x2: number, y2: number, cls = 'dg-arrow', head = 6): string {
	return arrow(x1, y1, x2, y2, cls, head) + arrow(x2, y2, x1, y1, cls, head);
}

/** The coral ring around a target (x, y, w, h), drawn `pad` outside it, with its soft halo. */
export function ring(x: number, y: number, w: number, h: number, o: { rx?: number; pad?: number } = {}): string {
	const pad = o.pad ?? 4;
	const rx = (o.rx ?? 5) + pad;
	return (
		rect(x - pad, y - pad, w + 2 * pad, h + 2 * pad, 'op-halo', { rx }) +
		rect(x - pad, y - pad, w + 2 * pad, h + 2 * pad, 'op-ring', { rx })
	);
}

/** The ghost cursor (the agent's hand), in the overlay's own arrow shape, tip at (x, y). */
export function ghost(x: number, y: number, s = 0.8): string {
	return el('path', {
		d: 'M2 2v20.5l5.1-5 3.3 7.6 3.3-1.4-3.2-7.5h7z',
		class: 'op-ghost',
		transform: `translate(${Math.round((x - 2 * s) * 100) / 100} ${Math.round((y - 2 * s) * 100) / 100}) scale(${s})`,
	});
}

/** The label that hangs off the ring: a glass pill with a coral dot. Returns markup and width. */
export function markLabel(x: number, y: number, label: string): { m: string; w: number } {
	const w = 23 + measureMixed(label, 12.5) * 1.04 + 11;
	return {
		m:
			rect(x, y, w, 24, 'op-glass', { rx: 12 }) +
			circle(x + 13, y + 12, 3.5, 'op-coral') +
			text(x + 23, y + 16.5, label, { cls: 'dg-s op-gt' }),
		w,
	};
}

/** A small microphone glyph (the approval card's own), centred at (cx, cy). */
export function mic(cx: number, cy: number, s = 0.8): string {
	const r = (n: number) => Math.round(n * 100) / 100;
	return el(
		'g',
		{ transform: `translate(${r(cx - 8 * s)} ${r(cy - 8 * s)}) scale(${s})`, class: 'op-mic' },
		el('rect', { x: 5.5, y: 1.8, width: 5, height: 8, rx: 2.5 }) + el('path', { d: 'M3.2 8a4.8 4.8 0 0 0 9.6 0M8 12.8v1.8' }),
	);
}
