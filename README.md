# Randomizer

An EmDash 1.4 sandboxed plugin that redirects visitors to a random published entry. GET and HEAD return an uncached 302, or 404 when the selection is empty.

| URL | Selection |
| --- | --- |
| `/random` | Default collection (posts) |
| `/random/category/design` | Entries in the design category |
| `/random/tag/webdev` | Entries tagged webdev |
| `/random/author/alex` | Entries credited to the alex byline |
| `/random/reviews` | Reviews, if enabled in the Collections setting |

## Install in an EmDash site

Install the built package and register it with your existing sandbox runner. Registry installs only need the short URL alias. The alias rewrites to the public sandbox route at `/_emdash/api/plugins/randomizer/pick` and forwards the scope.

```js
import randomizer from "emdash-plugin-randomizer";
import { randomRoutes } from "emdash-plugin-randomizer/astro";

integrations: [
  randomRoutes,
  emdash({ /* keep your database, storage and sandboxRunner options here */
    sandboxed: [randomizer],
  }),
]
```

The plugin reads content, taxonomies, and bylines. It caches compact candidate lists in plugin KV for five minutes. Newly published or newly assigned entries can take that long to enter the pool. Each selection rechecks the public URL and active filter. A cold collection scan follows the host's cursors in batches of 24. Catalogs above 1 MB are rebuilt per request.

## Build and verify

Use Node 24 and run `npm ci`, `npm test`, `npm run validate`, and `npm run bundle`. Use `npm pack` after bundling for a private site test. The marketplace artifact is `dist/randomizer-1.0.0.tar.gz`.

The private test manifest uses the reserved handle `randomizer.invalid` and a proprietary license identifier. Before publication, choose the publisher identity, license, and a public security contact, then validate and bundle again. [EmDash publishing guide](https://docs.emdashcms.com/plugins/creating-plugins/publishing/)
