# Globe Earth texture

The 3D globe in `src/components/Globe3D.tsx` uses a **local** equirectangular
satellite map. Runtime loading is `/globe/earth-blue-marble.jpg` from this
repo’s `public/` folder — NASA (or any other host) is **not** hotlinked.
`npm run build` copies it into `.next/standalone/public` so standalone
`server.js` can serve the same path. See [deploy.md](deploy.md).

## Asset

| | |
|---|---|
| File | `public/globe/earth-blue-marble.jpg` |
| Size | 2048 × 1024 JPEG (~234 KB) |
| Projection | Equirectangular (plate carrée), suitable for a UV sphere |
| Content | Cloud-free land, shallow water, and shaded topography |

This is NASA **Blue Marble (2002)** — *Land Surface, Shallow Water, and Shaded
Topography* (`land_shallow_topo_2048.jpg`). It is a true-color mosaic, not a
procedural drawing. There is **no cloud layer** and the app does **not** apply
a day/night terminator shader.

## Source

- Visible Earth / Earth Observatory:
  [Blue Marble: Land Surface, Shallow Water, and Shaded Ocean](https://visibleearth.nasa.gov/images/57752/blue-marble-land-surface-shallow-water-and-shaded-ocean)
- Archive file:
  `https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57752/land_shallow_topo_2048.jpg`

## Credit

NASA Goddard Space Flight Center. Image by Reto Stöckli (land surface, shallow
water, clouds). Enhancements by Robert Simmon (ocean color, compositing, 3D
globes, animation). Additional data: USGS EROS Data Center (topography); USGS
Terrestrial Remote Sensing Flagstaff Field Center (Antarctica).

## License / use

NASA still and motion imagery is generally **not copyrighted** (U.S. government
work) and may be used for educational and commercial purposes when NASA is
credited, subject to [NASA’s image-use guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/).
Do not imply NASA endorsement of this site.
