# EmDash Randomizer

Send visitors to a random published post. [Try it on my blog](https://blog.alexmiller.net/random).

## Set up `/random`

Randomizer targets EmDash 1.4 and later. After installing it from the registry, open `/_emdash/api/admin/plugins` while signed in as an admin. Find the item with `registrySlug` set to `randomizer` and copy its `id`.

Create `src/pages/random/[...scope].ts` in your Astro site. Replace `YOUR_PLUGIN_ID` with the ID you copied.

```ts
import type { APIRoute } from "astro";

export const prerender = false;
export const GET: APIRoute = ({ params, rewrite }) => {
  const query = new URLSearchParams({ scope: params.scope ?? "" });
  return rewrite(`/_emdash/api/plugins/YOUR_PLUGIN_ID/pick?${query}`);
};
export const HEAD = GET;
```

Deploy your site and visit `/random`. To narrow the selection, use paths like `/random/tag/webdev`, `/random/category/design`, or `/random/author/alex`. To include another collection, add its slug to **Eligible collections** and visit `/random/<slug>`. The first collection is the default.

<!-- The registry CLI bundles this README and omits LICENSE.
The MIT License

Copyright 2026 Alex Miller

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->
