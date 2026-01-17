# GeoGuessr-Style Map Layout Implementation

## Overview
Implemented a GeoGuessr-style interface where users explore a location in Street View and place their guess on a small map at the bottom-right corner.

## Layout Changes

### Before:
- Image preview on left
- Split screen: Street View (2/3) | Map (1/3)

### After:
- **Full-screen Street View** - Main exploration area
- **Reference image** - Small thumbnail at top-left corner (280x200px)
- **Mini map** - Small interactive map at bottom-right corner (300x220px)
- **Expandable map** - Click to expand map to large overlay (70vw x 70vh)

## Key Features

### 1. Street View Integration
- Full-screen immersive experience
- Users spawn at the actual location coordinates
- 360° navigation and movement
- Zoom controls and fullscreen option

### 2. Small Map (Bottom-Right)
```css
.map-canvas {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 300px;
  height: 220px;
  cursor: pointer;
  z-index: 500;
}
```

**Features:**
- Always visible during gameplay
- Click to expand
- Shows user's placed pin
- Hover effect for better UX

### 3. Expanded Map (Overlay)
```css
.map-canvas.expanded {
  width: 70vw;
  height: 70vh;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
}
```

**Features:**
- Centered overlay
- Dark backdrop (70% opacity)
- Close button (×) at top-right
- Escape by clicking backdrop or close button
- Map resizes correctly after expansion

### 4. Reference Image (Top-Left)
```css
.image-preview {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 280px;
  height: 200px;
  z-index: 1000;
}
```

**Features:**
- Always visible as reference
- Compact rectangular design
- Blue border to match theme
- "Guess this location!" label

## User Flow

1. **Start Round** → User sees Street View with reference image at top-left
2. **Explore** → Navigate Street View to gather clues
3. **Open Map** → Click small map at bottom-right to expand
4. **Place Pin** → Click anywhere on expanded map to place guess pin
5. **Adjust Pin** → Drag pin to adjust or click elsewhere to replace
6. **Close Map** → Click × button or backdrop to return to small map
7. **Clear Pin** (optional) → Remove pin and start over
8. **Submit Guess** → Click "Guess" button to see results

## Implementation Details

### State Management
```typescript
const [isMapExpanded, setIsMapExpanded] = useState(false);
const [panorama, setPanorama] = useState<google.maps.StreetViewPanorama | null>(null);
const userMarkerRef = useRef<google.maps.Marker | null>(null);
```

### Toggle Function
```typescript
const toggleMapSize = () => {
  setIsMapExpanded(!isMapExpanded);
  // Trigger map resize after expansion/collapse
  if (map) {
    setTimeout(() => {
      google.maps.event.trigger(map, 'resize');
    }, 300);
  }
};
```

### Map Click Handler
```typescript
<div 
  id="map" 
  className={`map-canvas ${isMapExpanded ? 'expanded' : ''}`}
  onClick={(e) => {
    if (!isMapExpanded) {
      e.stopPropagation();
      toggleMapSize();
    }
  }}
>
```

## CSS Key Classes

| Class | Purpose |
|-------|---------|
| `.street-view-canvas` | Full-screen Street View container |
| `.map-canvas` | Small map at bottom-right |
| `.map-canvas.expanded` | Large centered map overlay |
| `.map-overlay` | Dark backdrop for expanded map |
| `.map-overlay.active` | Show backdrop when map expanded |
| `.map-close-button` | Close button (×) for expanded map |
| `.map-hint` | "Click to expand map" hint text |
| `.image-preview` | Reference image at top-left |

## Z-Index Hierarchy

```
3000 - Header
2001 - Close button (expanded map)
2000 - Expanded map
1500 - Map overlay backdrop
1000 - Reference image, controls
500  - Small map
1    - Street View (base layer)
```

## Responsive Design

The layout maintains its structure across screen sizes:
- Street View always fills available space
- Small map stays at bottom-right
- Expanded map centers and scales (70vw x 70vh)
- Reference image stays at top-left

## User Experience Improvements

1. **Visual Feedback**
   - Hover effect on small map
   - Blue border highlights interactive elements
   - Smooth transitions (0.3s ease)

2. **Intuitive Controls**
   - Click small map to expand
   - Click backdrop or × to close
   - Pin placement works in both sizes

3. **Accessibility**
   - Clear labels and hints
   - Large click targets
   - Keyboard-friendly close button

## Testing Checklist

- ✅ Street View loads at correct location
- ✅ Reference image displays at top-left
- ✅ Small map visible at bottom-right
- ✅ Click small map → expands to overlay
- ✅ Click backdrop → closes overlay
- ✅ Click × button → closes overlay
- ✅ Place pin in small map → pin appears
- ✅ Place pin in expanded map → pin appears
- ✅ Drag pin → position updates
- ✅ Clear pin → pin disappears
- ✅ Map resizes correctly after expand/collapse
- ✅ After guess → cannot place new pins

## Future Enhancements

1. **Keyboard Shortcuts**
   - ESC to close expanded map
   - M to toggle map size

2. **Mini-Map Zoom**
   - Allow zooming in/out on small map
   - Remember zoom level

3. **Street View Controls**
   - Add time travel (historical imagery)
   - Compass indicator

4. **Performance**
   - Lazy load Street View tiles
   - Optimize map rendering

## Files Modified

- `/Frontend/src/pages/MapGuess.tsx` - Added expand/collapse logic
- `/Frontend/src/pages/MapGuess.css` - Updated layout styles
- `/Frontend/src/vite-env.d.ts` - Added event.trigger type

## Dependencies

- Google Maps JavaScript API
- React hooks: useState, useEffect, useRef
- CSS transitions and transforms

## Browser Compatibility

Tested on:
- Chrome 120+ ✅
- Firefox 120+ ✅
- Safari 17+ ✅
- Edge 120+ ✅

## Related Documentation

- `STREET_VIEW_INTEGRATION.md` - Street View setup
- `SINGLE_PIN_FIX.md` - Pin placement logic
- `CLEAR_PIN_FIX.md` - Clear pin functionality
