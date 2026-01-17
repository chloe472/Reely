import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ResultCard from '../components/ResultCard';
import LocationCard from '../components/LocationCard';
import LocationList from '../components/LocationList';
import './Results.css';

interface Location {
  id: string;
  name: string;
  imageUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  // Optional fields from backend
  rating?: number;
  reviewCount?: string;
  priceRange?: string;
  category?: string;
  district?: string;
  address?: string;
  streetViewUrl?: string;
  googleMapsUrl?: string;
  confidence?: string;
}

interface ResultsProps {
  locations?: Location[];
}

function Results({ locations = [] }: ResultsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState(true); // Auto-enabled on load
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card'); // Card or List view

  // Get locations from navigation state (passed from Dashboard)
  const receivedLocations = location.state?.locations || [];
  
  // Use received locations if available, otherwise use prop or empty array
  const displayLocations: Location[] = receivedLocations.length > 0 
    ? receivedLocations 
    : locations;

  const handleCardClick = (locationId: string) => {
    if (gameMode) {
      const currentIndex = displayLocations.findIndex(loc => loc.id === locationId);
      const currentLocation = displayLocations[currentIndex];
      
      // Navigate to map guessing page
      navigate('/map-guess', {
        state: {
          location: currentLocation,
          allLocations: displayLocations,
          currentIndex: currentIndex,
        }
      });
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    alert('Address copied to clipboard!');
  };

  const handleOpenInMaps = (location: Location) => {
    // Use location name if available, otherwise fall back to coordinates
    const query = location.name || `${location.coordinates.lat},${location.coordinates.lng}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="results">
      <Sidebar />
      <main className="results-main">
        <div className="results-header">
          <h1 className="results-title">
            {gameMode ? 'Save it to your Google Maps!' : 'Your Results'}
          </h1>
          
          <div className="results-controls">
            <div className="game-mode-toggle">
              <span className="toggle-label">Game mode</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={gameMode}
                  onChange={() => setGameMode(!gameMode)}
                />
                <span className="slider"></span>
              </label>
            </div>
            
            <div className="view-mode-buttons">
              <button 
                className={`view-button ${viewMode === 'card' ? 'active' : ''}`}
                onClick={() => setViewMode('card')}
              >
                Card
              </button>
              <button 
                className={`view-button ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
            </div>
          </div>
        </div>

        <div className="results-grid">
          {displayLocations.length > 0 ? (
            viewMode === 'list' ? (
              // List View for both Game and Non-Game Mode
              <LocationList
                locations={displayLocations}
                gameMode={gameMode}
                onCopyAddress={handleCopyAddress}
                onOpenInMaps={handleOpenInMaps}
                onGuess={handleCardClick}
              />
            ) : gameMode ? (
              // Card View - Game Mode: Show ResultCard with guessing interface
              displayLocations.map((location) => (
                <ResultCard
                  key={location.id}
                  location={location}
                  gameMode={gameMode}
                  isSelected={false}
                  onClick={() => handleCardClick(location.id)}
                />
              ))
            ) : (
              // Card View - Non-Game Mode: Show LocationCard with details
              displayLocations.map((location) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  onCopyAddress={handleCopyAddress}
                  onOpenInMaps={() => handleOpenInMaps(location)}
                />
              ))
            )
          ) : (
            <div className="no-results">
              <p>No images to display. Please upload images from the Dashboard.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Results;
