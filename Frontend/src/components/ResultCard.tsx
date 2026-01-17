import './ResultCard.css';

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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" className="world-map-svg">
              <rect fill="#93c5fd" width="800" height="400"/>
              <path fill="#34d399" d="M0,250 Q100,240 150,200 T250,190 L280,210 Q320,200 350,180 L380,200 Q420,190 450,170 L480,190 Q520,200 550,210 T650,200 L680,220 Q720,210 750,200 L800,210 L800,400 L0,400 Z"/>
              <path fill="#10b981" d="M150,300 Q180,290 200,280 L220,300 Q250,290 280,285 L300,300 Q330,295 350,290 L380,310 L420,295 L450,310 Q480,300 500,295 L530,310 L560,300 L590,315 L620,305 L650,320 L800,310 L800,400 L0,400 Z"/>
              <ellipse fill="#fbbf24" cx="100" cy="80" rx="60" ry="40"/>
              <ellipse fill="#f59e0b" cx="300" cy="100" rx="80" ry="50"/>
              <ellipse fill="#34d399" cx="500" cy="90" rx="70" ry="45"/>
              <ellipse fill="#a78bfa" cx="650" cy="110" rx="90" ry="55"/>
            </svg>
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
