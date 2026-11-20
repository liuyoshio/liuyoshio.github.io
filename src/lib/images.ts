import type { ImageMetadata } from 'astro';

/**
 * srcset widths for a local image: the candidates narrower than the source, plus the
 * source width itself (capped at the largest candidate). Never upscales.
 */
export function srcsetWidths(src: ImageMetadata, candidates: number[]): number[] {
	const max = Math.max(...candidates);
	const widths = candidates.filter((w) => w < src.width);
	widths.push(Math.min(src.width, max));
	return [...new Set(widths)].sort((a, b) => a - b);
}
