# World Map Image Setup

## Current Setup

The app currently uses **`Mapimage.png`** located in `src/utils/` folder. This is your colorful illustrated world map that displays when users play in game mode.

## How to Update the World Map Image

### Option 1: Replace the Existing File (Easiest)

Simply replace the file at:
```
src/utils/Mapimage.png
```

Make sure to keep the same filename (`Mapimage.png`) and the app will automatically use your new image.

### Option 2: Use a Different File

1. **Add your new image** to `src/utils/` folder (e.g., `my-world-map.png`)

2. **Update** `src/components/ResultCard.tsx`:
   ```typescript
   import worldMapImage from '../utils/my-world-map.png';
   ```

## Current Setup

The app currently uses a placeholder image from Unsplash. Replace it with your colorful illustrated world map that shows:
- Continents (North America, South America, Europe, Africa, Asia, Australia)
- Oceans (Pacific, Atlantic, Indian)
- Colorful illustrations with landmarks and animals
- Kid-friendly, educational style

## Image Specifications

- **Recommended Size**: 1200x600px or larger
- **Format**: JPG or PNG
- **Aspect Ratio**: 2:1 (width:height)
- **Style**: Colorful, illustrated, educational

## Where It's Used

The world map appears in:
1. **Result Cards** (Game Mode) - In the card view
2. **Map Guessing Interface** - When users click to guess a location
