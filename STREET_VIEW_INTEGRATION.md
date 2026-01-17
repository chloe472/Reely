# Street View Integration - GeoGuessr Style

## Overview
The map guessing game now features Google Street View integration, just like GeoGuessr! Users are dropped directly at the location shown in the TikTok screenshot and can explore the area before placing their guess pin.

## Features Implemented

### 1. **Gemini API Coordinate Extraction**
- Updated the Gemini prompt to extract GPS coordinates (latitude/longitude)
- Gemini now returns coordinates in the response JSON
- Fallback to city/area coordinates if exact location isn't available

### 2. **Street View Integration**
- **2/3 of screen**: Interactive Street View panorama
- **1/3 of screen**: World map for placing guess pin
- Users start at the actual location in Street View
- Full navigation controls: pan, zoom, move forward/backward
- Reference image stays visible in top-left corner

### 3. **Dual-View Layout**
```
┌─────────────────────────────────────────────────────┐
│  [Reference Image]                                   │
│  ┌──────────────────────────┬─────────────────────┐ │
│  │                          │                     │ │
│  │   STREET VIEW (2/3)      │   MAP (1/3)        │ │
│  │   - Explore location     │   - Place pin      │ │
│  │   - Move around          │   - Make guess     │ │
│  │   - Look in any direction│                     │ │
│  │                          │                     │ │
│  └──────────────────────────┴─────────────────────┘ │
│              [Guess Button] [Clear Pin]              │
└─────────────────────────────────────────────────────┘
```

## How It Works

### User Flow:
1. **Screenshot Upload** → Gemini extracts location name + coordinates
2. **Game Start** → User dropped into Street View at actual location
3. **Exploration** → User navigates around, looks for clues
4. **Guess** → User clicks map to place pin with their guess
5. **Results** → Distance calculated, points awarded, actual location revealed

### Technical Implementation:

#### Backend (Gemini API)
```javascript
{
  "location_name": "Eiffel Tower",
  "coordinates": {
    "lat": 48.8584,
    "lng": 2.2945
  },
  "address": "Champ de Mars, Paris, France",
  // ... other fields
}
```

#### Frontend (MapGuess Component)
```typescript
// Initialize Street View at actual location
const streetViewPanorama = new google.maps.StreetViewPanorama(element, {
  position: currentLocation.coordinates, // From Gemini
  pov: { heading: 0, pitch: 0 },
  zoom: 1,
  // ... other options
});

// Separate map for guess placement
const googleMap = new google.maps.Map(element, {
  center: { lat: 20, lng: 0 }, // World view
  zoom: 2,
  // ... restrictions
});
```

## Street View Features

### Available Controls:
- ✅ **Pan** - Look around 360°
- ✅ **Zoom** - Zoom in/out
- ✅ **Movement** - Navigate streets (arrows on ground)
- ✅ **Jump** - Click on map to jump to different location
- ✅ **Fullscreen** - Expand Street View to full screen
- ❌ **Road Labels** - Disabled (makes it too easy!)
- ❌ **Address** - Hidden (no cheating!)

### Settings:
```typescript
{
  addressControl: false,      // Hide address
  showRoadLabels: false,      // Hide street names
  zoomControl: true,          // Allow zoom
  fullscreenControl: true,    // Allow fullscreen
  motionTracking: false,      // Disable gyroscope
  motionTrackingControl: false // Hide motion button
}
```

## CSS Layout

### Grid System:
```css
.map-section {
  display: grid;
  grid-template-columns: 2fr 1fr; /* 66% Street View, 33% Map */
  gap: 0;
}
```

### Components:
- **Street View Canvas**: Full height, 2/3 width
- **Map Canvas**: Full height, 1/3 width, bordered
- **Reference Image**: Fixed position, top-left, 280x200px
- **Control Panel**: Fixed bottom, centered, floating

## Coordinate Accuracy

### Gemini AI Capabilities:
- ✅ **High Confidence**: Famous landmarks, well-known places
- ✅ **Medium Confidence**: Cities, neighborhoods, general areas
- ⚠️ **Low Confidence**: Ambiguous or unclear locations

### Fallback Strategy:
1. Try to identify exact location → Use precise coordinates
2. If uncertain → Use city/area center coordinates
3. If completely unknown → Use country capital coordinates

## Game Balance

### Making It Fair:
- **No address shown** - Can't see street names/numbers
- **No road labels** - Street names hidden on panorama
- **Can move around** - Just like real GeoGuessr
- **Reference image visible** - Can compare views
- **World map** - Need to know geography to guess well

### Scoring System (unchanged):
- < 1 km: 5000 points (Perfect!)
- < 10 km: 4500 points (Excellent!)
- < 50 km: 4000 points (Great!)
- < 100 km: 3500 points (Good!)
- < 500 km: 2500 points (Not bad!)
- < 1000 km: 2000 points (Could be better)
- > 5000 km: 500 points (Far off)

## Testing

### Prerequisites:
1. Google Maps API key with:
   - Maps JavaScript API enabled
   - Street View Static API enabled (optional)
2. Valid Gemini API key
3. TikTok screenshots with identifiable locations

### Test Cases:
- [ ] Upload screenshot of famous landmark
- [ ] Verify Street View loads at correct location
- [ ] Navigate around in Street View
- [ ] Place pin on map
- [ ] Verify distance calculation is accurate
- [ ] Check reference image stays visible
- [ ] Test with different locations worldwide

## Known Limitations

### Street View Availability:
- Not all locations have Street View coverage
- Some areas have limited/outdated imagery
- Private property interiors not available
- If no Street View → Falls back to map only

### Coordinate Accuracy:
- Gemini may not always get exact coordinates
- Some locations may be approximate
- TikTok screenshots may not show enough detail
- User can still have fun exploring and guessing!

## Future Enhancements

### Potential Improvements:
1. **Check Street View Availability** before loading
2. **Photo spheres** for indoor locations
3. **Time travel** feature (historical imagery)
4. **Difficulty modes**:
   - Easy: Show country outline
   - Medium: Show continent
   - Hard: No hints at all
5. **Multiplayer** - Race to guess fastest
6. **Hints system** - Reveal clues for points

## Files Modified

### Backend:
- `/Backend/services/gemini.js` - Added coordinate extraction to prompt

### Frontend:
- `/Frontend/src/pages/MapGuess.tsx` - Added Street View panorama initialization
- `/Frontend/src/pages/MapGuess.css` - Updated layout for dual-view grid
- `/Frontend/src/vite-env.d.ts` - Added Street View TypeScript definitions

## API Requirements

### Google Maps APIs Needed:
1. **Maps JavaScript API** - For main map
2. **Street View API** - For panorama view

### Gemini API:
- Model: `gemini-1.5-flash` (or better for accuracy)
- Vision capabilities required

## Configuration

### Environment Variables:
```bash
# Frontend (.env)
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_API_URL=http://localhost:3001

# Backend (.env)
GEMINI_API_KEY=your_key_here
MONGODB_URI=your_connection_string
JWT_SECRET=your_secret
```

## Comparison with GeoGuessr

### Similar Features:
✅ Street View exploration
✅ World map for guessing
✅ Distance-based scoring
✅ No address/road labels
✅ Movement allowed

### Unique Features:
🆕 TikTok screenshot as reference
🆕 AI-powered location extraction
🆕 Reference image always visible
🆕 Social media discovery angle

## Troubleshooting

### Street View Not Loading:
1. Check Google Maps API key is valid
2. Verify coordinates are valid (lat: -90 to 90, lng: -180 to 180)
3. Check browser console for errors
4. Ensure Street View coverage exists for location

### Coordinates Missing:
1. Verify Gemini returns coordinates in response
2. Check backend logs for parsing errors
3. Ensure JSON format is correct
4. Add fallback coordinates in frontend

### Performance Issues:
1. Limit Street View quality settings
2. Reduce map tile resolution
3. Lazy load Street View (only when needed)
4. Cache location data

---

**Enjoy exploring the world with Reely! 🌍🎮**
