import { fileURLToPath } from "node:url";

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
