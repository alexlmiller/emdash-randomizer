import { fileURLToPath } from "node:url";

export const randomPlugin = (collections = ["posts"]) => ({
	id: "randomizer",
	version: "1.0.0",
	entrypoint: fileURLToPath(new URL("./plugin.mjs", import.meta.url)),
	options: { collections },
});

// EmDash owns the handler and its activation state. Astro owns public site URLs.
export const randomRoutes = {
	name: "emdash-randomizer-routes",
	hooks: {
		"astro:config:setup"({ injectRoute }) {
			injectRoute({
				pattern: "/random/[...scope]",
				entrypoint: fileURLToPath(new URL("./endpoint.mjs", import.meta.url)),
				prerender: false,
			});
		},
	},
};
