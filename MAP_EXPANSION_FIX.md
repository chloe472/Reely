# Map Expansion & Dummy Location Fix

## What Was Fixed

### 1. Dummy Location for Street View
Added a fallback dummy location (Marina Bay Sands, Singapore) when no coordinates are provided:

```typescript
const streetViewLocation = currentLocation.coordinates.lat && currentLocation.coordinates.lng 
  ? currentLocation.coordinates 
  : { lat: 1.290270, lng: 103.851959 }; // Default: Marina Bay Sands, Singapore
```

**Benefits:**
- ✅ App works even without real coordinates
- ✅ Perfect for testing before Gemini API integration
- ✅ Shows a famous landmark with good Street View coverage

### 2. Fixed Map Expansion
Changed the map expansion trigger from the entire div to just the hint button:

**Before:**
- Clicking anywhere on the small map would try to expand
- Google Maps clicks were interfering with the expansion
- Map wouldn't expand reliably

**After:**
- Click the "Click to expand map" button to expand
- Map interactions (dragging, zooming) work normally
- Close button (×) in expanded view to collapse
- Click overlay backdrop to collapse

## How It Works Now

### Small Map View (Default)
1. **Location**: Bottom-right corner (300×220px)
2. **Interactions**: 
   - Zoom in/out
   - Drag to pan
   - Click to place pin
3. **Expand Button**: Blue hint at bottom "Click to expand map"

### Expanded Map View
1. **Location**: Center of screen (70vw × 70vh)
2. **Features**:
   - Larger view for better precision
   - Dark overlay backdrop (70% opacity)
   - Close button (×) at top-right
   - Can still place/drag pins
3. **Exit Methods**:
   - Click × button
   - Click dark overlay background

### Street View
1. **Location**: Full-screen background
2. **Default**: Marina Bay Sands, Singapore (1.290270, 103.851959)
3. **Controls**:
   - Navigate with arrows or drag
   - Rotate view by dragging
   - Zoom with + / - buttons
4. **Reference Image**: Top-left corner overlay

## User Flow

```
1. Page loads → Street View appears (Marina Bay Sands)
2. Explore Street View → Look around, move forward/backward
3. Ready to guess → Click "Click to expand map" hint
4. Map expands → Large view appears with dark backdrop
5. Place pin → Click location on map (blue pin drops)
6. Adjust if needed → Drag pin to correct location
7. Done → Click × to close expanded map
8. Submit guess → Click "GUESS" button
```

## CSS Classes

### Map Canvas States
- `.map-canvas` - Small map (bottom-right)
- `.map-canvas.expanded` - Large map (centered)
- `.map-canvas:hover` - Blue border glow effect

### Interactive Elements
- `.map-hint` - Clickable expand button
- `.map-hint:hover` - Darker blue with scale effect
- `.map-close-button` - Close button (×)
- `.map-overlay` - Dark backdrop (hidden by default)
- `.map-overlay.active` - Dark backdrop (visible when expanded)

## Key Features

### 1. Smart Click Handling
- Map hint has its own click handler (doesn't interfere with Google Maps)
- Google Maps clicks only place pins (don't trigger expansion)
- Overlay click closes the map

### 2. Smooth Transitions
```css
.map-canvas {
  transition: all 0.3s ease;
}
```
- Smooth expansion/collapse animation
- Size, position, and border animate together

### 3. Visual Feedback
- Hover effects on hint button
- Blue border highlight
- Shadow effects for depth
- Overlay dims background

## Testing Checklist

- ✅ Page loads with Street View at Marina Bay Sands
- ✅ Can navigate in Street View (arrows, drag, rotate)
- ✅ Reference image visible at top-left
- ✅ Small map visible at bottom-right
- ✅ "Click to expand map" hint is clickable
- ✅ Clicking hint expands map to center
- ✅ Dark overlay appears behind expanded map
- ✅ Can place pin in expanded map
- ✅ Can drag pin in expanded map
- ✅ Click × button closes expanded map
- ✅ Click overlay closes expanded map
- ✅ Map transitions smoothly

## Files Modified

1. **MapGuess.tsx**
   - Added dummy location fallback for Street View
   - Moved click handler from div to hint button
   - Made hint clickable with onClick handler

2. **MapGuess.css**
   - Made `.map-hint` clickable (cursor: pointer)
   - Added hover effects for hint
   - Increased padding and font weight
   - Added transitions for smooth interaction

## Future Enhancements

### When Gemini API Returns Coordinates
Replace the dummy location with actual coordinates:

```typescript
const streetViewLocation = currentLocation.coordinates; // From Gemini API
```

### Optional Improvements
- Add keyboard shortcut (Escape to close expanded map)
- Add double-click to expand/collapse
- Add map type toggle (Satellite/Map/Terrain)
- Save user's preferred map size

## Dummy Locations for Testing

If you want to test different locations, here are some good Street View locations:

```typescript
// Eiffel Tower, Paris
{ lat: 48.8584, lng: 2.2945 }

// Times Square, New York
{ lat: 40.7580, lng: -73.9855 }

// Sydney Opera House, Australia
{ lat: -33.8568, lng: 151.2153 }

// Marina Bay Sands, Singapore (current default)
{ lat: 1.290270, lng: 103.851959 }

// Shibuya Crossing, Tokyo
{ lat: 35.6595, lng: 139.7004 }
```

Simply replace the fallback coordinates in the code!
