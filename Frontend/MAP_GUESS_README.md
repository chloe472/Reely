# Map Guessing Game Feature

## Overview
The Map Guessing page provides an interactive GeoGuessr-style game where users can test their geography knowledge by guessing locations on a world map.

## How It Works

### 1. **Starting the Game**
- From the Results page in **Game Mode**, users click on a card or the "Guess" button
- They are navigated to the Map Guess interface

### 2. **Game Interface**
```
┌─────────────────────────────────────────────────────┐
│  Round 1 of 3                    [Back to Results]  │
├──────────┬──────────────────────────────────────────┤
│          │                                           │
│  Image   │         Interactive Google Map           │
│ Preview  │                                           │
│          │         [Control Panel at bottom]         │
│          │                                           │
└──────────┴──────────────────────────────────────────┘
```

### 3. **Gameplay Flow**
1. User sees the location image on the left
2. User clicks anywhere on the Google Map to place their pin
3. User clicks the "Guess" button to submit
4. System shows:
   - Blue pin: User's guess
   - Red pin: Actual location
   - Red line: Distance between guess and actual location
   - Results panel with distance, points, and accuracy

### 4. **Scoring System** (GeoGuessr-style)
- **Perfect (< 1 km)**: 5000 points
- **Excellent (< 10 km)**: 4500 points
- **Great (< 50 km)**: 4000 points
- **Good (< 100 km)**: 3500 points
- **Not bad (< 500 km)**: 2500 points
- **Could be better (< 1000 km)**: 2000 points
- **Far off (> 1000 km)**: 500-1500 points

### 5. **After Guessing**
- **Next Round**: Continue to the next location
- **View All Results**: Return to Results page after all rounds
- **Open in Google Maps**: View the actual location in Google Maps

## Google Maps API Setup

### Required API Key
To use the map guessing feature, you need a Google Maps JavaScript API key.

### Steps to Set Up:

1. **Get an API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable "Maps JavaScript API"
   - Create credentials (API Key)

2. **Add API Key to the Project**:
   - Open `src/pages/MapGuess.tsx`
   - Find line 49: `script.src = \`https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY\`;`
   - Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key

3. **Alternative: Environment Variable** (Recommended):
   ```typescript
   const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
   script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
   ```
   
   Then create `.env` file:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

### API Restrictions (Recommended):
- **Application restrictions**: HTTP referrers
  - Add your domain: `https://yourdomain.com/*`
  - Add localhost for development: `http://localhost:5173/*`
  
- **API restrictions**: 
  - Restrict key to only use: Maps JavaScript API

## Features

### Interactive Map
- Pan and zoom around the world
- Click to place pin
- Visual feedback on pin placement

### Distance Calculation
- Haversine formula for accurate distance calculation
- Shows distance in kilometers
- Draws line between guess and actual location

### Responsive Design
- Works on desktop and tablet
- Mobile-optimized layout
- Image preview collapses on small screens

### Multi-Round Support
- Sequential gameplay through multiple locations
- Round counter (Round X of Y)
- Automatic progression to next location
- Final results view after all rounds

## File Structure

```
src/
├── pages/
│   ├── MapGuess.tsx      # Main map guessing component
│   ├── MapGuess.css      # Styling for map interface
│   └── Results.tsx       # Updated to navigate to map guess
└── App.tsx               # Added /map-guess route
```

## State Management

### Navigation State:
```typescript
{
  location: Location,        // Current location to guess
  allLocations: Location[],  // All locations in the game
  currentIndex: number       // Current round number (0-based)
}
```

## Customization

### Scoring Formula
Modify `calculatePoints()` in `MapGuess.tsx` to adjust scoring:
```typescript
const calculatePoints = (distance: number): number => {
  // Your custom scoring logic
}
```

### Accuracy Levels
Modify `getAccuracyLevel()` to change feedback messages:
```typescript
const getAccuracyLevel = (distance: number): string => {
  // Your custom accuracy messages
}
```

### Map Starting Position
Change the default center in `MapGuess.tsx`:
```typescript
center: { lat: 20, lng: 0 }, // Change these coordinates
zoom: 2,                      // Change zoom level
```

## Known Issues & TODOs

- [ ] Add total score tracking across all rounds
- [ ] Add leaderboard functionality
- [ ] Store game history
- [ ] Add time limit option
- [ ] Add difficulty levels (show more/less of the world)
- [ ] Add multiplayer support

## Dependencies

- **react-router-dom**: For navigation between pages
- **Google Maps JavaScript API**: For interactive map
- TypeScript definitions included in `vite-env.d.ts`
