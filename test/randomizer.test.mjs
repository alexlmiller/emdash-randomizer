import assert from "node:assert/strict";
import test from "node:test";
import plugin from "../src/plugin.ts";

function fixture(posts) {
	const kv = new Map();
	const stats = { lists: 0, urls: 0 };
	const ctx = {
		site: { locale: "en" },
		settings: { get: async () => "posts, reviews" },
		kv: {
			get: async key => structuredClone(kv.get(key)),
			set: async (key, value) => kv.set(key, structuredClone(value)),
		},
		content: {
			list: async (collection, { limit, where, cursor }) => {
				stats.lists++;
				assert.equal(where.status, "published");
				const rows = posts.filter(p => p.collection === collection && p.status === where.status);
				const start = Number(cursor || 0);
				const end = start + limit;
				return { items: rows.slice(start, end), hasMore: end < rows.length, cursor: String(end) };
			},
			getPublicUrl: async (collection, id) => {
				stats.urls++;
				const post = posts.find(p => p.collection === collection && p.id === id && p.status === "published");
				return post && `https://example.org/${collection}/${post.slug}`;
			},
		},
		taxonomies: { getEntryTerms: async (_, id) => posts.find(p => p.id === id).terms },
	};
	return {
		stats, kv,
		pick: scope => plugin.routes.pick.handler({ request: { url: 'https://example.org/pick?' + new URLSearchParams({ scope }) } }, ctx),
	};
}

const post = n => ({ id: String(n), slug: String(n), collection: "posts", status: "published", locale: "en", terms: [] });
const location = result => new Headers(result.headers).get("location");

test("includes the last cursor page and reuses the catalog for repeat visits", async t => {
	const f = fixture(Array.from({ length: 51 }, (_, n) => post(n)));
	t.mock.method(Math, "random", () => 0.99999);
	assert.equal(location(await f.pick("")), "/posts/50");
	assert.equal(location(await f.pick("posts")), "/posts/50");
	assert.deepEqual(f.stats, { lists: 3, urls: 2 });
});

test("rechecks publication and taxonomy after the catalog has been cached", async () => {
	const p = post(1);
	p.terms = [{ slug: "webdev" }];
	const f = fixture([p]);
	assert.equal((await f.pick("tag/webdev")).status, 302);
	p.terms = [];
	assert.equal((await f.pick("tag/webdev")).status, 404);
	assert.equal((await f.pick("")).status, 302);
	p.status = "draft";
	assert.equal((await f.pick("")).status, 404);
});

test("only allowed collections are queried and arbitrary missing terms share a cache", async () => {
	const f = fixture([{ ...post(1), collection: "reviews" }]);
	assert.equal((await f.pick("pages")).status, 404);
	assert.equal((await f.pick("all/x")).status, 404);
	assert.equal(f.stats.lists, 0);
	assert.equal(location(await f.pick("reviews")), "/reviews/1");
	for (const slug of ["unknown", "constructor", "__proto__"]) assert.equal((await f.pick("tag/" + slug)).status, 404);
	assert.equal(f.kv.size, 2);
});
