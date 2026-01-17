import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { uploadAPI } from '../services/api';
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
  streetViewUrl?: string;
  googleMapsUrl?: string;
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
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  // Initialize Google Maps and Street View
  useEffect(() => {
    if (!currentLocation) {
      navigate('/results');
      return;
    }

    const loadGoogleMaps = () => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMapsAndStreetView;
      document.head.appendChild(script);
    };

    const initMapsAndStreetView = () => {
      // Initialize Street View
      const streetViewElement = document.getElementById('street-view');
      if (streetViewElement && 'google' in window) {
        new (window as any).google.maps.StreetViewPanorama(streetViewElement, {
          position: currentLocation.coordinates,
          pov: { heading: 0, pitch: 0 },
          zoom: 1,
          addressControl: false,
          linksControl: true,
          panControl: true,
          enableCloseButton: false,
          fullscreenControl: false,
        });
      }

      // Initialize Map
      const mapElement = document.getElementById('mini-map');
      if (!mapElement) return;

      const googleMap = new google.maps.Map(mapElement, {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      setMap(googleMap);

      // Add click listener to place pin
      googleMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!hasGuessed && e.latLng) {
          const clickedLat = e.latLng.lat();
          const clickedLng = e.latLng.lng();
          setUserGuess({ lat: clickedLat, lng: clickedLng });

          // Remove old marker if exists
          if (userMarker) {
            userMarker.setMap(null);
          }

          // Add new marker
          const newMarker = new google.maps.Marker({
            position: { lat: clickedLat, lng: clickedLng },
            map: googleMap,
            title: 'Your Guess',
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            },
          });

          setUserMarker(newMarker);
        }
      });
    };

    // Check if Google Maps is already loaded
    if (typeof google !== 'undefined' && google.maps) {
      initMapsAndStreetView();
    } else {
      loadGoogleMaps();
    }
  }, [currentLocation, navigate, hasGuessed, userMarker]);

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

  const handleGuess = async () => {
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

    // Save guessed coordinates to backend
    try {
      await uploadAPI.saveGuess(
        currentLocation.id,
        userGuess.lat,
        userGuess.lng,
        distance,
        points
      );
    } catch (error) {
      console.error('Failed to save guess:', error);
      // Continue with UI update even if save fails
    }

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
      {/* Header */}
      <div className="map-guess-header">
        <div className="round-info">
          <h2>Round {currentIndex + 1} of {allLocations.length}</h2>
        </div>
        <button className="back-button" onClick={handleBackToResults}>
          ← Back to Results
        </button>
      </div>

      {/* Main Street View */}
      <div className="street-view-container">
        <div id="street-view" className="street-view-canvas"></div>
      </div>

      {/* Minimized Screenshot - Top Left */}
      <div className={`mini-screenshot ${isImageExpanded ? 'expanded' : ''}`}>
        <div className="mini-header">
          <span className="mini-title">Location Clue</span>
          <button 
            className="expand-button"
            onClick={() => setIsImageExpanded(!isImageExpanded)}
            title={isImageExpanded ? 'Minimize' : 'Expand'}
          >
            {isImageExpanded ? '−' : '+'}
          </button>
        </div>
        <img src={currentLocation.imageUrl} alt="Location clue" />
      </div>

      {/* Minimized World Map - Bottom Right */}
      <div className={`mini-map-container ${isMapExpanded ? 'expanded' : ''}`}>
        <div className="mini-header">
          <span className="mini-title">Make Your Guess</span>
          <button 
            className="expand-button"
            onClick={() => setIsMapExpanded(!isMapExpanded)}
            title={isMapExpanded ? 'Minimize' : 'Expand'}
          >
            {isMapExpanded ? '−' : '+'}
          </button>
        </div>
        <div id="mini-map" className="mini-map-canvas"></div>
        
        {/* Map Controls */}
        <div className="mini-map-controls">
          {!hasGuessed ? (
            <>
              <div className="instruction-text">
                {userGuess ? 'Pin placed!' : 'Click map to place pin'}
              </div>
              <button 
                className="guess-button-mini"
                onClick={handleGuess}
                disabled={!userGuess}
              >
                {userGuess ? 'Guess' : 'Place Pin First'}
              </button>
            </>
          ) : (
            <div className="result-panel-mini">
              <div className="result-header-mini">
                <h3>{result?.accuracy}</h3>
                <div className="result-points">{result?.points} pts</div>
              </div>
              <div className="result-distance">
                Distance: {result?.distance.toFixed(2)} km
              </div>
              <div className="result-location">
                Location: {currentLocation.name}
              </div>
              <div className="result-actions-mini">
                {currentIndex < allLocations.length - 1 ? (
                  <button className="next-button-mini" onClick={handleNextRound}>
                    Next Round →
                  </button>
                ) : (
                  <button className="finish-button-mini" onClick={handleBackToResults}>
                    View Results
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MapGuess;
