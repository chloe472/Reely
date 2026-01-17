import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './MapGuess.css';

interface Location {
  id: string;
  name: string;
  imageUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  rating?: number;
  reviewCount?: string;
  priceRange?: string;
  category?: string;
  district?: string;
  address?: string;
}

interface GuessResult {
  distance: number;
  points: number;
  accuracy: string;
}

function MapGuess() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentLocation: Location | undefined = location.state?.location;
  const allLocations: Location[] = location.state?.allLocations || [];
  const currentIndex: number = location.state?.currentIndex || 0;
  
  const [userGuess, setUserGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [panorama, setPanorama] = useState<google.maps.StreetViewPanorama | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  // Use refs to track state in event listeners
  const hasGuessedRef = useRef(false);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  // Sync hasGuessed state with ref
  useEffect(() => {
    hasGuessedRef.current = hasGuessed;
  }, [hasGuessed]);

  // Initialize Google Map (only once)
  useEffect(() => {
    if (!currentLocation) {
      navigate('/results');
      return;
    }

    // Skip if map already exists
    if (map) return;

    const loadGoogleMaps = () => {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Google Maps API key is missing. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file');
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        console.error('Failed to load Google Maps API. Check your API key and billing settings.');
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      const mapElement = document.getElementById('map');
      const panoramaElement = document.getElementById('street-view');
      if (!mapElement || !panoramaElement) return;

      // Use dummy location if no coordinates provided (for testing)
      const streetViewLocation = currentLocation.coordinates.lat && currentLocation.coordinates.lng 
        ? currentLocation.coordinates 
        : { lat: 39.9163, lng: 116.3972 }; // Default: Tiananmen Square, Beijing, China

      // Initialize Street View Panorama at the actual location
      const streetViewPanorama = new google.maps.StreetViewPanorama(panoramaElement, {
        position: streetViewLocation,
        pov: { heading: 0, pitch: 0 },
        zoom: 1,
        addressControl: false,
        showRoadLabels: false,
        zoomControl: true,
        fullscreenControl: true,
        motionTracking: false,
        motionTrackingControl: false,
      });

      setPanorama(streetViewPanorama);

      // Initialize regular map (for placing guess pin)
      const googleMap = new google.maps.Map(mapElement, {
        center: { lat: 20, lng: 0 }, // Center of world
        zoom: 2,
        minZoom: 2, // Prevent zooming out too far
        maxZoom: 18, // Maximum zoom level
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        restriction: {
          latLngBounds: {
            north: 85,
            south: -85,
            west: -180,
            east: 180,
          },
          strictBounds: false,
        },
      });

      setMap(googleMap);

      // Add click listener to place pin
      googleMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        // Don't allow placing pins after guessing
        if (hasGuessedRef.current) return;
        
        if (e.latLng) {
          const clickedLat = e.latLng.lat();
          const clickedLng = e.latLng.lng();
          
          // Update guess state
          setUserGuess({ lat: clickedLat, lng: clickedLng });

          // Remove old marker if exists
          if (userMarkerRef.current) {
            userMarkerRef.current.setMap(null);
            userMarkerRef.current = null;
          }

          // Add new marker with draggable capability
          const newMarker = new google.maps.Marker({
            position: { lat: clickedLat, lng: clickedLng },
            map: googleMap,
            title: 'Your Guess (drag to adjust)',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            },
          });

          // Make marker draggable
          newMarker.setDraggable(true);

          // Update position when marker is dragged
          google.maps.event.addListener(newMarker, 'dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              setUserGuess({ 
                lat: event.latLng.lat(), 
                lng: event.latLng.lng() 
              });
            }
          });

          // Store marker in ref
          userMarkerRef.current = newMarker;
        }
      });
    };

    // Check if Google Maps is already loaded
    if (typeof google !== 'undefined' && google.maps) {
      initMap();
    } else {
      loadGoogleMaps();
    }
  }, [currentLocation, navigate, map]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  const calculatePoints = (distance: number): number => {
    // GeoGuessr-style scoring: max 5000 points, decreases with distance
    if (distance < 1) return 5000;
    if (distance < 10) return 4500;
    if (distance < 50) return 4000;
    if (distance < 100) return 3500;
    if (distance < 250) return 3000;
    if (distance < 500) return 2500;
    if (distance < 1000) return 2000;
    if (distance < 2000) return 1500;
    if (distance < 5000) return 1000;
    return 500;
  };

  const getAccuracyLevel = (distance: number): string => {
    if (distance < 1) return 'Perfect!';
    if (distance < 10) return 'Excellent!';
    if (distance < 50) return 'Great!';
    if (distance < 100) return 'Good!';
    if (distance < 500) return 'Not bad!';
    if (distance < 1000) return 'Could be better';
    return 'Far off';
  };

  const handleGuess = () => {
    if (!userGuess || !currentLocation || !map) return;

    const distance = calculateDistance(
      userGuess.lat,
      userGuess.lng,
      currentLocation.coordinates.lat,
      currentLocation.coordinates.lng
    );

    const points = calculatePoints(distance);
    const accuracy = getAccuracyLevel(distance);

    setResult({ distance, points, accuracy });
    setHasGuessed(true);

    // Show actual location marker
    new google.maps.Marker({
      position: currentLocation.coordinates,
      map: map,
      title: 'Actual Location',
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      },
    });

    // Draw line between guess and actual
    new google.maps.Polyline({
      path: [userGuess, currentLocation.coordinates],
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 0.7,
      strokeWeight: 3,
      map: map,
    });

    // Fit bounds to show both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userGuess);
    bounds.extend(currentLocation.coordinates);
    map.fitBounds(bounds);
  };

  const handleNextRound = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < allLocations.length) {
      // Go to next location
      navigate('/map-guess', {
        state: {
          location: allLocations[nextIndex],
          allLocations: allLocations,
          currentIndex: nextIndex,
        },
        replace: true,
      });
      // Reset state
      window.location.reload();
    } else {
      // All done, go back to results
      navigate('/results', { 
        state: { locations: allLocations },
        replace: true 
      });
    }
  };

  const handleClearPin = () => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
    setUserGuess(null);
  };

  const toggleMapSize = () => {
    setIsMapExpanded(!isMapExpanded);
    // Trigger map resize after expansion/collapse
    if (map) {
      setTimeout(() => {
        google.maps.event.trigger(map, 'resize');
      }, 300);
    }
  };

  const handleBackToResults = () => {
    navigate('/results', { 
      state: { locations: allLocations },
      replace: true 
    });
  };

  if (!currentLocation) {
    return null;
  }

  return (
    <div className="map-guess">
      <div className="map-guess-header">
        <div className="round-info">
          <h2>Round {currentIndex + 1} of {allLocations.length}</h2>
        </div>
        <button className="back-button" onClick={handleBackToResults}>
          ← Back to Results
        </button>
      </div>

      <div className="map-guess-container">
        <div className="image-preview">
          <img src={currentLocation.imageUrl} alt="Location to guess" />
          <div className="image-label">Guess this location!</div>
        </div>

        <div className="map-section">
          <div id="street-view" className="street-view-canvas"></div>
          
          {/* Map overlay backdrop */}
          <div 
            className={`map-overlay ${isMapExpanded ? 'active' : ''}`}
            onClick={toggleMapSize}
          ></div>
          
          {/* Small map at bottom-right (expandable) */}
          <div 
            id="map" 
            className={`map-canvas ${isMapExpanded ? 'expanded' : ''}`}
          >
            {/* Hint to expand */}
            {!isMapExpanded && !hasGuessed && (
              <div 
                className="map-hint"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMapSize();
                }}
              >
                Click to expand map
              </div>
            )}
            
            {/* Close button when expanded */}
            {isMapExpanded && (
              <button 
                className="map-close-button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMapSize();
                }}
              >
                ×
              </button>
            )}
          </div>
          
          <div className="map-controls">
            {!hasGuessed ? (
              <>
                <div className="instruction">
                  {userGuess 
                    ? '📍 Pin placed! Drag to adjust or click Guess to submit.' 
                    : 'Explore in Street View, then click the map to place your guess pin'}
                </div>
                <div className="control-buttons">
                  <button 
                    className="guess-button"
                    onClick={handleGuess}
                    disabled={!userGuess}
                  >
                    Guess
                  </button>
                  {userGuess && (
                    <button 
                      className="clear-button"
                      onClick={handleClearPin}
                    >
                      Clear Pin
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="result-panel">
                <h3>{result?.accuracy}</h3>
                <div className="result-details">
                  <div className="result-item">
                    <span className="result-label">Distance:</span>
                    <span className="result-value">{result?.distance.toFixed(2)} km</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Points:</span>
                    <span className="result-value points">{result?.points}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Location:</span>
                    <span className="result-value">{currentLocation.name}</span>
                  </div>
                </div>
                <div className="result-actions">
                  {currentIndex < allLocations.length - 1 ? (
                    <button className="next-button" onClick={handleNextRound}>
                      Next Round →
                    </button>
                  ) : (
                    <button className="finish-button" onClick={handleBackToResults}>
                      View All Results
                    </button>
                  )}
                  <button 
                    className="open-maps-button"
                    onClick={() => window.open(
                      `https://www.google.com/maps/search/?api=1&query=${currentLocation.coordinates.lat},${currentLocation.coordinates.lng}`,
                      '_blank'
                    )}
                  >
                    Open in Google Maps
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapGuess;
