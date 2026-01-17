import './ResultCard.css';
import worldMapImage from '../utils/Mapimage.png';

interface Location {
  id: string;
  name: string;
  imageUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  streetViewUrl?: string;
  googleMapsUrl?: string;
  confidence?: string;
}

interface ResultCardProps {
  location: Location;
  gameMode: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function ResultCard({ location, gameMode, isSelected, onClick }: ResultCardProps) {
  const handleStreetView = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick
    if (location.streetViewUrl) {
      window.open(location.streetViewUrl, '_blank');
    } else {
      const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.coordinates.lat},${location.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className={`result-card ${isSelected ? 'selected' : ''}`}>
      <div 
        className={`card-image-container ${gameMode ? 'clickable' : ''}`}
        onClick={gameMode ? onClick : undefined}
      >
        <img 
          src={location.imageUrl} 
          alt={location.name}
          className="card-image"
        />
        {gameMode && (
          <div className="image-overlay">
            <span className="overlay-text">Click to guess location</span>
          </div>
        )}
        {location.confidence === 'low' && (
          <div className="confidence-badge low">Low Confidence</div>
        )}
      </div>

      <div className="card-content">
        <div 
          className={`card-map-preview ${gameMode ? 'clickable' : ''}`}
          onClick={gameMode ? onClick : undefined}
        >
          <div className="world-map-container">
            <img 
              src={worldMapImage} 
              alt="World Map" 
              className="world-map-image"
            />
          </div>
          {gameMode && (
            <div className="map-overlay">
              <span className="map-overlay-text">Click to select location</span>
            </div>
          )}
        </div>

        {gameMode ? (
          <div className="card-actions">
            <button className="guess-button" onClick={onClick}>
              Guess
            </button>
            <button 
              className="street-view-button-small" 
              onClick={handleStreetView}
              title="View Street View"
            >
              📍 Street View
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ResultCard;
