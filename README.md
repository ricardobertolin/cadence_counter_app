# Cadence

A small offline-first PWA for tracking whether you're actually doing the things you meant to do — and whether you're getting better at them.

**[Open the app →](https://ricardobertolin.github.io/cadence_counter_app/)**

An *activity* (say, "Exercise") holds *sub-activities* ("Chin-up", "Squat"). Each logged session takes a date and one or more values in a unit you name. Cadence charts the trend and tells you when something has gone quiet for longer than its interval.

No account, no server, no tracking. Everything lives in your browser's `localStorage`, and you move it between devices with a JSON file.

---

## Features

- **Activities and sub-activities** — one activity groups related things that share a unit and a schedule.
- **Numbers or times** — log plain counts (`10, 7, 5`) or durations (`1:23.4`, `12:05`, `1:02:30`).
- **Cadence tracking** — set an interval in days; activities move from green to amber to red as they go stale.
- **On hold** — pause an activity when you're injured or travelling, without losing its history.
- **Trends** — sparklines on the home screen, a full chart per sub-activity, and a delta against the previous session.
- **Streak and consistency** — how many sessions you've logged in a row, and what share of the sessions your interval asked for actually happened. See [Streak and consistency](#streak-and-consistency).
- **Personal bests** — the best session is ringed and labelled on the chart, and beating it says so.
- **Tap straight through** — tapping a sub-activity row on the home screen opens the activity scrolled to that sub-activity, briefly outlined so you can see where you landed. Tapping the activity header opens it from the top as before.
- **Compare by** session total, best set, or average — and tell it whether higher or lower is better.
- **JSON export and import** — download, copy, or paste your data; merge or replace on the way back in.
- **Installable and offline** — a real PWA with a service worker, vendored dependencies and app icons. Nothing is fetched from a third party at runtime except web fonts, which degrade to system fonts.

## Logging values

Values are comma- or space-separated, so one session can hold several sets. One value is fine.

**Numbers** — `10, 7, 5` logs three sets. Decimals work: `7.5`.

**Times** — set the activity's *Values are* field to **Times**, then log any of:

| Input | Means |
|---|---|
| `1:23.4` | 1 min 23.4 sec |
| `12:05` | 12 min 5 sec |
| `1:02:30` | 1 hr 2 min 30 sec |
| `90` | 90 seconds |

Times are stored internally as seconds, so totals, averages and charts all work normally — they're just displayed back as `m:ss`. Nonsense like `1:75` is rejected rather than silently misread.

## Streak and consistency

Open an activity and you get two numbers under its name.

**Streak** counts consecutive sessions, each logged within the activity's interval of the one before it. The gap between the last session and today counts too, so the moment an activity goes overdue the streak reads 0 rather than showing a number you no longer hold. Several sub-activities logged on the same day count as one session, since cadence is a property of the activity.

**Consistency** is the share of the sessions your interval asked for that actually happened, over the last ten intervals. An activity set to every 2 days that you've logged 5 times in the last 10 days reads 100%; 5 times in the last 20 days reads 50%. The window never reaches back past your first entry, so a new activity isn't marked down for days before it existed, and the figure caps at 100% — logging twice as often as planned is not 200% consistent, it's just consistent.

Both come off the cadence clock, so putting an activity on hold pauses them the same way it pauses the amber and red status colours.

## Personal bests

The best session on each chart gets a lime ring and a `PB` label. Best means the extreme of that sub-activity's *compare by* metric in whichever direction you set as progress, so a "lower is better" sprint time marks its fastest run, not its slowest. Ties go to the first time you hit it, which is when you actually achieved it. A chart needs two entries before a marker appears, since a lone session is trivially its own best.

Log something that beats it and a toast says so. Re-logging a day you've already logged compares against your other days, not against the entry it replaces, so fixing a typo won't falsely congratulate you.

## On hold

Injured, travelling, or deliberately pausing something? Hit **Hold** on the activity's detail screen.

A held activity keeps its full history and charts, but never turns amber or red, and drops out of the "need attention" count in the header. Hit **Resume** to start the clock again. You can also set it from the activity editor.

## Saving and loading

Open **Data** in the header.

**Save** — *Download .json* writes `cadence-YYYY-MM-DD.json`. *Copy JSON* puts the same content on your clipboard. If either is blocked by the browser, the JSON appears in the textarea instead.

**Load** — pick a file, or paste JSON into the box. Two modes:

- **Merge** — keeps what's already there. Activities match on id, then on case-insensitive name; sub-activities match by name; sessions dedupe on *(sub-activity, date)* with the incoming file winning ties.
- **Replace** — wipes local data and loads the file.

Imports are validated, not trusted: unnamed activities, activities with no sub-activities, entries pointing at sub-activities that don't exist, malformed dates and non-numeric values are all dropped rather than corrupting your data.

### File format

```json
{
  "app": "cadence",
  "version": 1,
  "appVersion": "1.5.0",
  "exportedAt": "2026-08-16T12:00:00.000Z",
  "activities": [
    {
      "id": "a1b2c3d",
      "name": "Running",
      "unit": "per km",
      "intervalDays": 3,
      "valueType": "time",
      "onHold": false,
      "subs": [
        { "id": "s1", "name": "5k tempo", "metric": "best", "direction": "down" }
      ],
      "entries": [
        { "id": "e1", "subId": "s1", "date": "2026-08-14", "values": [1470] }
      ]
    }
  ]
}
```

- `version` is the **file format** version; `appVersion` is the build that wrote it. They move independently.
- `valueType` is `"number"` or `"time"`. Time `values` are seconds.
- `metric` is `"total"`, `"best"` or `"avg"`; `direction` is `"up"` or `"down"`.
- The loader also accepts a bare `{ "activities": [...] }` or a bare array, and will parse string times (`"1:47.5"`) in `values`.

## Syncing between devices

There's no built-in sync yet. Today: export on one device, import on the other — a shared cloud-drive folder makes this reasonably painless.

Candidates for building it properly, roughly in order of effort:

1. **Share link** — gzip the export into a URL fragment and send it to yourself. Zero setup, works everywhere, one transfer at a time.
2. **Private GitHub Gist** — a classic PAT with only the `gist` scope; `api.github.com` allows CORS, so a static page can sync directly. Needs per-entry `updatedAt` for tie-breaking and tombstones so deletes propagate.
3. **Cloudflare Worker + KV** — a real endpoint if you'd rather not hold a token.

## Installing

Open the app in Chrome, Edge or Safari and use *Install app* / *Add to Home Screen*. It works offline afterwards.

## How offline works

Three things have to hold for an offline-first app, and each is handled separately.

**Nothing third-party at runtime.** `support.js` would otherwise pull React from unpkg on every boot, which means a first-ever visit while offline, or any unpkg outage, renders a blank page. React and ReactDOM are vendored under `vendor/` and loaded before `support.js`, whose `loadReactUmd()` short-circuits when `window.React` already exists. The vendored files are byte-identical to `react@18.3.1`, checked against the SRI hashes baked into `support.js`. Google Fonts is the one remaining external request, and it degrades to system fonts.

**Cache-first, not network-first.** Every asset is versioned by the service worker's `CACHE` name, so a cached hit is always correct for that build and there is no reason to make the user wait on a round trip to see it. The worker serves from cache and revalidates in the background, so the next launch picks up any change. Only a cache miss touches the network, and only navigations fall back to the app shell, so a missing script never resolves to HTML.

**Durable storage.** `localStorage` is the only copy of your data and browsers may evict it under storage pressure, so the app calls `navigator.storage.persist()` once on load.

Still worth doing if you want to go further: self-host the two web fonts to remove the last external request, and show a "new version, reload" prompt when a new worker activates instead of waiting for the user to relaunch.

## Development

No build step and no package manager. It's static files — serve the directory over HTTP (a `file://` URL won't work, since service workers need an origin):

```bash
python -m http.server 8000
# then open http://127.0.0.1:8000/
```

### Layout

| File | Purpose |
|---|---|
| `index.html` | The whole app — template plus component logic |
| `support.js` | Rendering runtime (generated; don't edit by hand) |
| `vendor/` | React + ReactDOM UMD builds, pinned at 18.3.1 |
| `sw.js` | Service worker: cache-first, background revalidate |
| `manifest.json` | PWA manifest |
| `icon-192.png`, `icon-512.png` | App icons |
| `Cadence.dc.html` | Legacy redirect — see below |

`index.html` holds a declarative template in an `x-dc` element and a `Component extends DCLogic` class in the trailing script. `renderVals()` returns everything the template binds to.

### One trap worth knowing

`support.js` finds the template by running a **regex over the raw file text**, not by querying the DOM:

```js
const openMatch = /<x-dc(?:\s[^>]*)?>/.exec(src);
```

The first literal `<x-dc` in the file wins — including one sitting inside an HTML comment or a JavaScript string. When that happens the template is sliced from the wrong offset and the page renders completely blank, with nothing in the console to explain it. The same goes for `<helmet>`. If the app ever goes blank after an edit to `index.html`, check for a stray mention of those tag names before anything else.

### Icons and the Android crop

Android adaptive icons keep only a centred circle 80% of the icon's width and let the launcher mask away the rest, so artwork has to sit inside that safe zone. The bars are centred and scaled so their furthest corner is ~199px of the 205px safe radius at 512px. If you redraw the icons, keep them centred and check that corner distance, or Android will clip them.

### The `Cadence.dc.html` redirect

The app used to live at `/Cadence.dc.html`, and the URL looked odd for a reason. `.dc.html` is the *Design Component* format used by Claude Design, where this interface was first built: one file holding an `<x-dc>` template plus its logic, rendered at runtime by `support.js`. The project was imported verbatim, filename included, and since a web server resolves a directory root only if an `index.html` exists, the short URL 404'd entirely.

As of **v1.3.0** the app is simply `index.html`, so the canonical URL is the bare directory. The old path survives as a redirect purely for compatibility: PWAs installed before v1.3.0 have `./Cadence.dc.html` baked into their `start_url`, and the old service worker is network-first — it would fetch that path, get a genuine 404 rather than a network error, and never reach its cache fallback. The shim lets those installs migrate themselves.

It's safe to delete once every device has opened the app at least once.

### Versioning

`APP_VERSION` in `index.html` and `CACHE` in `sw.js` must be bumped together. The current version is shown at the bottom of the **Data** sheet, which is the fastest way to tell whether a device is running a stale service worker.

If a device looks stuck on an old build: DevTools → Application → Service Workers → Unregister, then hard reload.

## Credits

Interface originally generated with [Claude Design](https://claude.ai/design). Licensed under the [MIT License](LICENSE).
