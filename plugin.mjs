import { definePlugin, pluginResponse } from "emdash";
import { getDb } from "emdash/runtime";

export function createPlugin({ collections = ["posts"] } = {}) {
	if (!collections.length || collections.some((name) => !/^[a-z][a-z0-9_]*$/.test(name))) {
		throw new Error("Randomizer requires at least one valid collection slug.");
	}
	return definePlugin({
		id: "randomizer",
		version: "1.0.0",
		capabilities: ["content:read"],
		routes: {
			pick: {
				public: true,
				methods: ["GET", "HEAD"],
				request: { body: "none" },
				response: "raw",
				cacheControl: "private, no-store",
				async handler(ctx) {
					const scope = new URL(ctx.request.url).searchParams.get("scope") || "";
					const [kind, slug, ...extra] = scope.split("/");
					const collection = slug || !kind ? collections[0] : kind;
					if (!collections.includes(collection) || extra.length ||
						(slug && !["author", "category", "tag"].includes(kind))) {
						return pluginResponse({ status: 404 });
					}
					const db = await getDb();
					let eligible = db.selectFrom(`ec_${collection} as p`)
						.where("p.status", "=", "published")
						.where("p.deleted_at", "is", null)
						.where("p.slug", "!=", "");
					if (slug && kind === "author") {
						eligible = eligible
							.innerJoin("_emdash_content_bylines as c", "c.content_id", "p.id")
							.innerJoin("_emdash_bylines as b", "b.translation_group", "c.byline_id")
							.where("c.collection_slug", "=", collection)
							.where("b.slug", "=", slug)
							.whereRef("b.locale", "=", "p.locale");
					} else if (slug) {
						eligible = eligible
							.innerJoin("content_taxonomies as c", "c.entry_id", "p.translation_group")
							.innerJoin("taxonomies as t", "t.translation_group", "c.taxonomy_id")
							.where("c.collection", "=", collection)
							.where("t.name", "=", kind)
							.where("t.slug", "=", slug)
							.whereRef("t.locale", "=", "p.locale");
					}
					const { count } = await eligible.select(db.fn.countAll().as("count")).executeTakeFirstOrThrow();
					if (!Number(count)) return pluginResponse({ status: 404 });
					const row = await eligible.select("p.id").limit(1)
						.offset(Math.floor(Math.random() * Number(count))).executeTakeFirst();
					const url = row && await ctx.content.getPublicUrl(collection, row.id);
					if (!url) return pluginResponse({ status: 404 });
					return pluginResponse({ status: 302, headers: { Location: new URL(url).pathname } });
				},
			},
		},
	});
}
