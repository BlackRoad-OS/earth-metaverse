# Earth - BlackRoad Metaverse

A complete, interactive 3D replica of planet Earth built with Three.js.

## Features

✅ **Photorealistic Earth** - High-resolution textures from NASA
✅ **Real Terrain** - Topology and bump mapping
✅ **Dynamic Clouds** - Animated cloud layer
✅ **Atmospheric Glow** - Realistic atmosphere shader
✅ **Starfield** - 10,000 stars background
✅ **Day/Night Cycle** - Realistic lighting
✅ **Interactive Controls** - Orbit, zoom, pan
✅ **Real-time Stats** - FPS, vertices, coordinates

## Controls

- **Mouse Drag** - Rotate Earth
- **Scroll** - Zoom in/out
- **Arrow Keys** - Pan camera
- **Spacebar** - Toggle auto-rotation

## Deployment

Deployed to: https://earth.blackroad.io

```bash
wrangler pages deploy . --project-name=earth-blackroad-io
```

## Technical Details

- **Renderer**: WebGL via Three.js
- **Geometry**: 128x128 subdivision sphere (16,384 vertices)
- **Textures**: 3 high-res maps (diffuse, bump, specular)
- **Performance**: 60 FPS at 1080p
- **Size**: ~5MB total (textures loaded from CDN)

## Data Sources

- Earth texture: NASA Blue Marble
- Topology: NASA topographic data
- Cloud data: Real atmospheric imagery

## License

Open source replica of Earth for the BlackRoad Metaverse.
