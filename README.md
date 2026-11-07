# Randomizer for EmDash 1.4

Install this package from a checkout or tarball. Register both exports in your site’s `astro.config.mjs` alongside its existing integrations and EmDash options.

```js
import { randomPlugin, randomRoutes } from "emdash-plugin-randomizer";

integrations: [
  randomRoutes,
  emdash({ plugins: [randomPlugin()] }),
]
```

`/random` selects a published post. Use `/random/category/<slug>`, `/random/tag/<slug>`, or `/random/author/<byline-slug>` to narrow the selection. Each visit returns an uncached 302 to the entry's EmDash permalink, or 404 for an empty selection.

To expose another routable collection, pass its slug in the allowlist, e.g. `randomPlugin(["posts", "reviews"])` enables `/random/reviews`. The first collection supplies the default and filtered routes. Remove both registrations to uninstall.

The native handler reads EmDash 1.4 collection, taxonomy and byline tables using the site's database adapter. It selects one ID by count and random offset, then asks EmDash for its published URL. There are no plugin dependencies to install, migrations, background jobs, or client scripts.

## Registry release

The current package runs as a native EmDash 1.4 plugin. Registry installs run in a sandbox. Before a registry release:

1. Port the handler to a sandboxed plugin using capability-scoped content, taxonomy and byline APIs. The native handler’s direct database access is unavailable there. Verify uniform selection and query cost on a large collection before choosing a selection strategy.
2. Expose the public GET/HEAD route through the plugin API. Keep the site's short `/random` alias as a separate integration or site rewrite. Test a clean registry-style installation, disabled-plugin behavior, filtered results, and uncached redirects.
3. Choose the publisher’s Atmosphere handle or DID, license, author, and security contact. Declare them with slug `randomizer` in `emdash-plugin.jsonc`. Pin the plugin CLI as a development dependency.
4. Run `emdash-plugin validate` and `emdash-plugin bundle`. When ready to release, authenticate with `emdash-plugin login <handle>`, then run `emdash-plugin publish`. Follow the approval status using the watch command printed by the CLI. The public listing uses `@<handle>/randomizer`.

[Registry](https://docs.emdashcms.com/plugins/registry/) · [Plugin route mounting](https://docs.emdashcms.com/plugins/creating-plugins/api-routes/) · [Publishing](https://docs.emdashcms.com/plugins/creating-plugins/publishing/)
