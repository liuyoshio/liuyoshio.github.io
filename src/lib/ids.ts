let counter = 0;

/** A page-unique id for components rendered many times (e.g. Callout titles). */
export function uniqueId(prefix: string): string {
	counter += 1;
	return `${prefix}-${counter}`;
}
