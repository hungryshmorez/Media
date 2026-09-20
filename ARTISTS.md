# Artist CDN Structure

Master manifest aggregates multiple artist repositories served via GitHub Pages.

## Artist Repos

| Artist | Repo | CDN URL | Tracks |
|--------|------|---------|--------|
| Sofa King Sad Boi | `Media-SofaKing` | `https://hungryshmorez.github.io/Media-SofaKing/` | 300+ |
| Tanky Johnson | `Media-TankyJohnson` | `https://hungryshmorez.github.io/Media-TankyJohnson/` | 25 |
| Shmorez | `Media-Shmorez` | `https://hungryshmorez.github.io/Media-Shmorez/` | 55 |
| DriftWave STATIC | `Media-DriftWave` | `https://hungryshmorez.github.io/Media-DriftWave/` | 59 |
| Firetrucks | `Media-Firetrucks` | `https://hungryshmorez.github.io/Media-Firetrucks/` | 3 |

## Master Manifest

The main `Media` repo serves a `master-manifest.json` that lists all artist endpoints.

Jukebox loads manifests from each endpoint and aggregates them.
