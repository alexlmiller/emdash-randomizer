export function GET({ params, rewrite }) {
	const query = new URLSearchParams({ scope: params.scope ?? "" });
	return rewrite(`/_emdash/api/plugins/randomizer/pick?${query}`);
}

export const HEAD = GET;
