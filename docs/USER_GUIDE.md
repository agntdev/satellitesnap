# SatelliteSnap — User Guide

SatelliteSnap pulls the freshest satellite imagery for any address or
coordinates, with a minimalist terminal-style interface.

Live app: **https://agntdev.github.io/satellitesnap/**

## Finding a place

Type into the search box and press **snap** (or Enter). You can enter either:

- **An address or place name** — e.g. `Eiffel Tower`, `1600 Amphitheatre Pkwy`,
  `Tokyo Station`. These are resolved to coordinates via OpenStreetMap.
- **Raw coordinates** — `lat,lng`, e.g. `48.8584,2.2945`. A leading `@` and
  extra spaces are tolerated.

Press the **⌖ locate** button to jump to your current location (your browser
will ask for permission).

If a place can't be found or the network fails, a message explains what
happened — nothing breaks.

## The map

Once a target is acquired, the imagery loads in the main viewport. Pan by
dragging and zoom with the scroll wheel or the **+ / −** controls. A marker
pins the exact point you searched for. The coordinates are shown below the map.

## Time-travel 🕓

Below the map is the **time-travel** timeline. Drag the slider — or use the
**◂ / ▸** buttons — to step through historical imagery of the same spot. The
selected capture date is shown, and the newest release is flagged **· latest**.
This uses Esri's Wayback archive, which has many years of revisions.

## Image details (metadata)

Click **▸ metadata** on the map to expand an EXIF-style panel showing the
location, coordinates, imagery source, capture date, zoom level, and the
ground resolution (metres per pixel) at the current zoom.

## Search history

Every place you look up is saved to the **history** panel. Click any entry to
reopen it instantly. **clear** empties the list. History is kept in your
browser (and, when a backend is configured, synced server-side).

## Sharing 🔗

Press **share ⎘** to copy a permalink to the exact current view — location and
imagery date included. Anyone who opens the link sees the same thing. The
address bar also updates as you go, so you can copy it at any time.

## Privacy

The static app talks only to OpenStreetMap (geocoding) and Esri (imagery).
History stays in your browser unless a shared backend is configured.
