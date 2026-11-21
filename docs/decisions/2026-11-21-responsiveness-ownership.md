# Decision: Ouro owns how responsiveness looks and reads, and the app owns the data

Status: accepted, 2026-11-21, for [ourostack/ouro-ui#501](https://github.com/ourostack/ouro-ui/issues/501). It settles the first open question in [Responsiveness, native](2026-11-04-responsiveness.md) ("should the cache live in Ouro UI?") and sets the order web builds in. The rest of that record stands as the plan.

## Why

Responsiveness needs state (what is pending, what is stale) and data (what is true on the server). Apps already have a data layer for the second: TanStack Query, SWR, React Router loaders, Relay or plain `fetch`. A component library that ships its own would fight the app's. What no data layer gives is the same look and the same agent-readable state on every screen, so that is Ouro's part.

## Decision

- **Ouro owns** the parts a person sees and an agent reads:
  - optimistic state and its rollback UI: the change shows at once, and a refusal rolls it back in view with its reason;
  - the pending state, as `data-ouro-pending` on the element, so an agent reads what a person sees;
  - skeleton timing (no flash for a fast load) and sizing (the shape of the content it stands in for);
  - prefetch hooks: intent detection (pointer rest, focus, touch start) and the budget (a few at a time, none on Save-Data);
  - view transitions, with their reduced-motion fallbacks;
  - the measured checks in `ouro-check`: input to paint, layout shift while loading, and first useful content.
- **The app owns** data fetching, the network, and the cache's storage and invalidation. Ouro calls functions the app gives it (`apply`, `commit`, `prefetch`) and never fetches, stores or invalidates data itself.
- **Ouro depends on no data layer.** Its hooks take plain functions that return promises, so TanStack Query, SWR, React Router, Relay or `fetch` each fit with a one-line adapter, and the docs show those adapters.
- **The stale-while-revalidate cache is the app's.** Ouro ships no `createResourceCache`. It ships the display of what the app's cache knows: an age and a refreshing state that a view passes in, drawn the same everywhere and exposed to agents. This answers the earlier record's first open question.
- **Order of work in web:** optimistic updates and pending state first, then prefetch hooks, then skeleton timing and sizing, then the measured checks. Background sync and view transitions follow once an app hits them.

## Prior art

Read on 2026-11-21, from each project's own documentation.

| Find | Verdict | Why |
| --- | --- | --- |
| [React `useOptimistic`](https://react.dev/reference/react/useOptimistic) | **Adopt** | The optimistic value falls back to the real one when the action ends, which is the rollback rule. Ouro's hook builds on it and adds the pending marker, the visible reason and the agent-readable state. |
| [React `useTransition`](https://react.dev/reference/react/useTransition) | **Adopt** | Its pending flag marks work in flight without blocking input. Ouro reads it for `data-ouro-pending` rather than keeping a second flag. |
| [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates) | **Borrow**, **ignore** as a dependency | The mutation lifecycle shapes `apply` and `commit`. The cache is the app's, so Ouro takes no import. |
| [SWR](https://swr.vercel.app/) | **Borrow**, **ignore** as a dependency | Stale-while-revalidate is its model. Ouro draws the age and refreshing state the app's cache reports. |
| [React Router `Link` `prefetch`](https://reactrouter.com/api/components/Link) | **Borrow** | Prefetch on intent. Ouro takes a function instead of a route, since it does not own the router. |
| [Next.js `Link` prefetching](https://nextjs.org/docs/app/api-reference/components/link#prefetch) | **Borrow** one part | The refresh on hover once data is stale. Viewport prefetching exceeds the budget, so it is out. |
| [quicklink](https://github.com/GoogleChromeLabs/quicklink) | **Borrow** | It prefetches links in the viewport during idle time and honours Save-Data. We take the idle and Save-Data rules, not the viewport scan. |
| [guess.js](https://github.com/guess-js/guess) | **Watch** | Predicts the next page from analytics. Ouro has no analytics, and the app can predict and pass the function in. |
| [Speculation Rules API](https://developer.mozilla.org/en-US/docs/Web/API/Speculation_Rules_API) | **Watch** | Browser-level prefetch and prerender of whole pages with `moderate` eagerness. Useful for page loads; Ouro's hooks warm app data and code, which it does not cover. |
| [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) | **Adopt** | The same-document swap, with an instant swap where it is missing or motion is reduced. |
| [web-vitals](https://github.com/GoogleChrome/web-vitals) | **Borrow** | Its INP and CLS definitions and thresholds are the budgets' source. `ouro-check` measures in the test browser and adds no runtime dependency. |
| [Workbox background sync](https://developer.chrome.com/docs/workbox/modules/workbox-background-sync) | **Watch** | A service-worker queue for failed writes. Background sync is later work and the queue lives with the app's data layer; the record revisits it then. |
