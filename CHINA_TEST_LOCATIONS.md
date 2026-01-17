# China Street View Test Locations

## Popular China Locations with Good Street View Coverage

### 1. **Tiananmen Square, Beijing** (Current Default)
```typescript
{ lat: 39.9163, lng: 116.3972 }
```
- Iconic landmark
- Open square with good visibility
- Easy to navigate

### 2. **The Bund, Shanghai**
```typescript
{ lat: 31.2397, lng: 121.4900 }
```
- Famous waterfront
- Colonial architecture
- Modern skyline view

### 3. **West Lake, Hangzhou**
```typescript
{ lat: 30.2599, lng: 120.1310 }
```
- Scenic lake area
- Traditional Chinese gardens
- Peaceful walking paths

### 4. **Forbidden City, Beijing**
```typescript
{ lat: 39.9163, lng: 116.3972 }
```
- Historical palace complex
- Imperial architecture
- Vast courtyards

### 5. **Oriental Pearl Tower Area, Shanghai**
```typescript
{ lat: 31.2397, lng: 121.4989 }
```
- Iconic TV tower
- Pudong district
- Modern architecture

### 6. **Terracotta Warriors Museum, Xi'an**
```typescript
{ lat: 34.3848, lng: 109.2734 }
```
- Ancient archaeological site
- Museum exterior
- Historical significance

### 7. **Chengdu Research Base (Panda Base)**
```typescript
{ lat: 30.7350, lng: 104.1505 }
```
- Nature/wildlife area
- Bamboo forests
- Unique location

### 8. **Li River, Guilin**
```typescript
{ lat: 25.2736, lng: 110.2900 }
```
- Stunning karst mountains
- Riverside views
- Natural beauty

### 9. **Nanjing Road, Shanghai**
```typescript
{ lat: 31.2352, lng: 121.4759 }
```
- Busy shopping street
- Neon signs
- Urban atmosphere

### 10. **Temple of Heaven, Beijing**
```typescript
{ lat: 39.8822, lng: 116.4066 }
```
- Beautiful temple complex
- Traditional architecture
- Historical park

## How to Change the Test Location

In `MapGuess.tsx`, update line ~87:

```typescript
const streetViewLocation = currentLocation.coordinates.lat && currentLocation.coordinates.lng 
  ? currentLocation.coordinates 
  : { lat: YOUR_LAT, lng: YOUR_LNG }; // Your chosen location
```

## Testing Tips

1. **Navigation Controls**:
   - Click arrows on street to move forward
   - Drag to rotate 360°
   - Double-click to move to that spot
   - Use keyboard arrows to move

2. **Check Coverage**:
   - Some areas in China may have limited Street View
   - Major cities (Beijing, Shanghai) have good coverage
   - Rural areas may not be available

3. **Best Locations for Testing**:
   - Choose landmarks (easy to recognize)
   - Open spaces (better navigation)
   - Tourist areas (usually good coverage)

## Current Setting

**Default Location**: Tiananmen Square, Beijing
- Lat: 39.9163
- Lng: 116.3972
- Great for testing Street View movement
- Iconic and recognizable
