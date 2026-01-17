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
}

interface ResultCardProps {
  location: Location;
  gameMode: boolean;
  isSelected: boolean;
  onClick: () => void;
}

function ResultCard({ location, gameMode, isSelected, onClick }: ResultCardProps) {
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

        {gameMode && (
          <button className="guess-button" onClick={onClick}>
            Guess
          </button>
        )}
      </div>
    </div>
  );
}

export default ResultCard;
