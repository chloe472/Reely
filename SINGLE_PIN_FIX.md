# Single Pin Placement Fix

## Problem
Users could place multiple pins on the map at once. Each click would create a new pin without removing the previous one.

## Root Cause
The issue was caused by using React state (`setUserMarker`) to manage the marker removal. Since React state updates are asynchronous and may be batched, the old marker wasn't being removed in time before the new one was created. This resulted in multiple pins appearing on the map simultaneously.

## Solution

### Changed from State to Ref for Marker Management
Replaced the `userMarker` state with `userMarkerRef` to ensure immediate, synchronous removal of the old marker:

**Before (using state):**
```typescript
const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);

setUserMarker((prevMarker) => {
  if (prevMarker) {
    prevMarker.setMap(null);
  }
  return newMarker;
});
```

**After (using ref):**
```typescript
const userMarkerRef = useRef<google.maps.Marker | null>(null);

// Remove old marker immediately
if (userMarkerRef.current) {
  userMarkerRef.current.setMap(null);
  userMarkerRef.current = null;
}

// Create and store new marker
const newMarker = new google.maps.Marker({...});
userMarkerRef.current = newMarker;
```

## Why This Works

1. **Synchronous Updates**: Refs update immediately without waiting for React's render cycle
2. **Direct DOM Manipulation**: Google Maps markers are DOM elements that need immediate cleanup
3. **No State Batching**: Refs bypass React's state batching mechanism

## Technical Details

### React State vs Refs
- **State**: Asynchronous, triggers re-renders, may be batched
- **Refs**: Synchronous, no re-renders, immediate access to current value

### Marker Lifecycle
1. User clicks map
2. Check if old marker exists via `userMarkerRef.current`
3. If yes, immediately remove it: `setMap(null)`
4. Create new marker at click position
5. Store new marker in ref: `userMarkerRef.current = newMarker`

## Updated Code Flow

```typescript
// Click handler
googleMap.addListener('click', (e) => {
  if (hasGuessedRef.current) return; // Already guessed
  
  // STEP 1: Remove old marker synchronously
  if (userMarkerRef.current) {
    userMarkerRef.current.setMap(null);
    userMarkerRef.current = null;
  }
  
  // STEP 2: Create new marker
  const newMarker = new google.maps.Marker({...});
  newMarker.setDraggable(true);
  
  // STEP 3: Store in ref
  userMarkerRef.current = newMarker;
});

// Clear Pin handler
const handleClearPin = () => {
  if (userMarkerRef.current) {
    userMarkerRef.current.setMap(null);
    userMarkerRef.current = null;
  }
  setUserGuess(null);
};
```

## Testing
- ✅ Click to place pin - Only one blue pin appears
- ✅ Click again elsewhere - Old pin removed, new pin appears
- ✅ Drag pin - Pin moves smoothly
- ✅ Clear pin - Pin removed completely
- ✅ After guessing - Cannot place new pins (locked)

## Files Modified
- `/Frontend/src/pages/MapGuess.tsx` - Changed marker management from state to ref

## Related Fixes
- See `CLEAR_PIN_FIX.md` for the previous fix using refs for `hasGuessed` state
- Both fixes use the same pattern: **refs for event listener state management**
