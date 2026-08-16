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
- **Compare by** session total, best set, or average — and tell it whether higher or lower is better.
- **JSON export and import** — download, copy, or paste your data; merge or replace on the way back in.
- **Installable and offline** — a real PWA with a service worker and app icons.

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
  "appVersion": "1.2.0",
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
| `sw.js` | Service worker: network-first, cache fallback |
| `manifest.json` | PWA manifest |
| `icon-192.png`, `icon-512.png` | App icons |
| `Cadence.dc.html` | Legacy redirect — see below |

`index.html` holds a declarative template in `<x-dc>` and a `Component extends DCLogic` class in the trailing script. `renderVals()` returns everything the template binds to. `support.js` loads React from a CDN — it's cached by the service worker, so offline still works after the first visit.

### The `Cadence.dc.html` redirect

The app used to live at `/Cadence.dc.html`, and the URL looked odd for a reason. `.dc.html` is the *Design Component* format used by Claude Design, where this interface was first built: one file holding an `<x-dc>` template plus its logic, rendered at runtime by `support.js`. The project was imported verbatim, filename included, and since a web server resolves a directory root only if an `index.html` exists, the short URL 404'd entirely.

As of **v1.3.0** the app is simply `index.html`, so the canonical URL is the bare directory. The old path survives as a redirect purely for compatibility: PWAs installed before v1.3.0 have `./Cadence.dc.html` baked into their `start_url`, and the old service worker is network-first — it would fetch that path, get a genuine 404 rather than a network error, and never reach its cache fallback. The shim lets those installs migrate themselves.

It's safe to delete once every device has opened the app at least once.

### Versioning

`APP_VERSION` in `index.html` and `CACHE` in `sw.js` must be bumped together. The current version is shown at the bottom of the **Data** sheet, which is the fastest way to tell whether a device is running a stale service worker.

If a device looks stuck on an old build: DevTools → Application → Service Workers → Unregister, then hard reload.

## Credits

Interface originally generated with [Claude Design](https://claude.ai/design). Licensed under the [MIT License](LICENSE).
