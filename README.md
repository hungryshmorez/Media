# media

Media assets for [12matt3r // The Festival](https://github.com/hungryshmorez/Site),
served over GitHub Pages as a CDN.

The site does not bundle these files. It reads `manifest.json` from here at
runtime, so **adding music needs no site rebuild and no code change.**

## Adding a song

1. Drop the file in `music/` (or `music/tanky/`, `music/shmorez/`, etc.).
   Use a lowercase-with-dashes filename — no spaces, brackets or accents, since
   these become URLs.
2. Add an entry to `manifest.json`, in the order you want it played:

   ```json
   { "src": "music/your-new-song.mp3", "title": "Artist — Song Name" }
   ```

3. Commit and push. GitHub Pages republishes in about a minute and the site
   picks it up on the next load. Nothing in the Site repo has to change.

`title` is what the jukebox screen shows. The house style is
`Artist — Track`, or just the track name when the artist is obvious.

## Album art

Anything listed under `covers` is cycled on the jukebox screen. Same deal —
add the image to `music/art/` and add its path to the array.

## Layout

```
manifest.json        the playlist — the only file the site actually reads
music/               the slushwave tape
music/art/           album art and backdrops
music/tanky/         Tanky Johnson
music/shmorez/       Shmorez
music/driftwave/     DriftWave Static
```

## Notes

- **Keep this repo public.** Pages won't serve it for free otherwise, and the
  site fetches it cross-origin.
- **No per-file size limit** worth worrying about, but the whole published site
  must stay under **1GB** and Pages has a **100GB/month** bandwidth soft limit.
- Files here are also copies of tracks that live in the Site repo's EPK folders,
  because each EPK page has its own player that loads them by relative path.
  Editing one does not update the other.
