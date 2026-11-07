import { pluginResponse, type PluginContext, type SandboxedPlugin } from "emdash/plugin";

type Filter = "all" | "category" | "tag" | "author";
type Entry = { id: string; locale: string };
type Groups = Record<string, Entry[]>;
type Catalog = { expires: number; groups: Groups };

// Cache membership, never redirect responses or public URLs. A visitor-supplied
// slug cannot allocate KV keys or trigger another full scan for the same filter.
const catalogLifetime = 300_000;
const batchSize = 24;

async function memberships(ctx: PluginContext, collection: string, filter: Filter, entries: Entry[]) {
	if (entries.length === 0) return [];
	if (filter === "all") return entries.map(() => [""]);
	if (filter === "author") {
		const credits = await ctx.bylines!.getEntriesBylines(collection, entries.map(e => e.id));
		const byId = new Map(credits.map(c => [c.entryId, c.bylines.map(b => b.byline.slug)]));
		return entries.map(e => byId.get(e.id) ?? []);
	}
	return Promise.all(entries.map(async e => {
		const terms = await ctx.taxonomies!.getEntryTerms(collection, e.id, { taxonomy: filter, locale: e.locale });
		return terms.map(t => t.slug);
	}));
}

async function getCatalog(ctx: PluginContext, collection: string, filter: Filter) {
	const key = `catalog-v1/${collection}/${filter}`;
	const previous = await ctx.kv.get<Catalog>(key);
	if (previous && previous.expires > Date.now()) return previous.groups;

	const groups: Groups = {};
	let cursor: string | undefined;
	do {
		const page = await ctx.content!.list(collection, {
			where: { status: "published" }, limit: batchSize, cursor,
		});
		const entries = page.items.filter(e => e.slug && e.status === "published")
			.map(({ id, locale }) => ({ id, locale: locale || ctx.site.locale }));
		const slugs = await memberships(ctx, collection, filter, entries);
		for (const [i, entry] of entries.entries()) {
			for (const slug of new Set(slugs[i])) (groups["/" + slug] ??= []).push(entry);
		}
		if (page.hasMore && (!page.cursor || page.cursor === cursor)) throw new Error("Invalid content cursor");
		cursor = page.hasMore ? page.cursor : undefined;
	} while (cursor);
	// Leave headroom below the D1 per-value limit for very large collections.
	if (new TextEncoder().encode(JSON.stringify(groups)).length < 1_000_000) {
		await ctx.kv.set(key, { groups, expires: Date.now() + catalogLifetime });
	}
	return groups;
}

const plugin: SandboxedPlugin = {
	routes: {
		pick: {
			public: true, methods: ["GET", "HEAD"], request: { body: "none" },
			response: "raw", cacheControl: "private, no-store",
			async handler(route, ctx) {
				const scope = new URL(route.request.url).searchParams.get("scope") ?? "";
				const names = (await ctx.settings.get<string>("collections") ?? "posts")
					.split(",").map(s => s.trim()).filter(s => /^[a-z][a-z0-9_]*$/.test(s));
				const [first, slug, ...extra] = scope.split("/");
				const collection = slug === undefined && first ? first : names[0];
				const filter = slug === undefined ? "all" : first;
				const missing = () => pluginResponse({ status: 404 });
				if (!collection || !names.includes(collection) || extra.length || slug === "" ||
					(filter !== "all" && filter !== "category" && filter !== "tag" && filter !== "author") ||
					(filter === "all" && slug !== undefined)) return missing();

				const groups = await getCatalog(ctx, collection, filter);
				const candidates = [...(groups["/" + (slug ?? "")] ?? [])];
				// Draw without replacement when entries have changed since the snapshot.
				for (let left = candidates.length; left > 0; left--) {
					const index = Math.floor(Math.random() * left);
					const entry = candidates[index];
					candidates[index] = candidates[left - 1];
					if (slug && !(await memberships(ctx, collection, filter, [entry]))[0].includes(slug)) continue;
					const url = await ctx.content!.getPublicUrl!(collection, entry.id);
					if (url) {
						const { pathname } = new URL(url);
						if (pathname.startsWith("//")) continue;
						return pluginResponse({ status: 302, headers: { location: pathname } });
					}
				}
				return missing();
			},
		},
	},
};
export default plugin;
