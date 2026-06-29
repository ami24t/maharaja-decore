# 3D models (.glb)

Real product models live here, **one per product**, named by slug:

```
assets/models/ganesha-de-resina.glb
assets/models/buda-de-bali.glb
...
```

A product shows the 3D viewer when its entry in `assets/js/product-data.js` has a
`model` field. The value can be:

- a local path — `"assets/models/<slug>.glb"` (self-hosted, recommended for production), or
- a full URL — used now for the luminária-turca **preview** (a CDN sample lantern),
  clearly labelled as a placeholder until the real model is produced.

## How the models are made (AI image-to-3D)

See the project `README.md` → *Modelos 3D* for the full pipeline. In short: feed the
existing product photo to an image-to-3D tool (Meshy / Luma / Rodin / Tripo), export
`.glb`, then **optimize** before committing:

```bash
# target < 3–5 MB; Draco/meshopt compression + texture resize
npx gltf-transform optimize input.glb assets/models/<slug>.glb --texture-size 1024
```

Keep models lightweight — they are lazy-loaded (only when a visitor opens the 3D view),
but smaller files mean a faster first rotation.
