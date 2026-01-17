import './RecentSearches.css';

interface RecentSearch {
  id: string;
  locationName: string;
  image: string;
  timestamp: Date;
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  confidence?: string;
}

interface RecentSearchesProps {
  searches: RecentSearch[];
}

function RecentSearches({ searches }: RecentSearchesProps) {
  const handleCopyAddress = async (address: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      console.log('Address copied to clipboard');
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  return (
    <div className="recent-searches">
      <h2 className="recent-searches-title">Recent Searches</h2>
      <p className="recent-searches-subtitle">
        Shows recent 3 most searches, location name with image.
      </p>
      
      <div className="searches-grid">
        {searches.slice(0, 3).map((search) => (
          <div key={search.id} className="location-card">
            <div className="location-hero">
              <img 
                src={search.image} 
                alt={search.locationName} 
                className="location-image"
              />
              <div className="play-overlay">
                <div className="play-button">
                  <svg viewBox="0 0 24 24" className="play-icon">
                    <path fill="white" d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="location-content">
              <div className="location-header">
                <h2 className="location-title">{search.locationName}</h2>
                <div className="location-tags">
                  <span className="location-tag">Recent</span>
                  {search.confidence && (
                    <span className="location-tag">{search.confidence}% confidence</span>
                  )}
                  <span className="location-tag">{search.timestamp.toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="location-body">
                <div className="location-info">
                  <div className="location-pin">
                    <span className="pin-icon">📍</span>
                    <span className="location-name">{search.locationName}</span>
                  </div>
                </div>
              </div>
              
              <div className="location-footer">
                <div className="location-address">
                  {search.address ? (
                    <>
                      <span className="address-text">{search.address}</span>
                      <button 
                        className="copy-btn" 
                        title="Copy address"
                        onClick={(e) => handleCopyAddress(search.address!, e)}
                      >
                        Copy
                      </button>
                    </>
                  ) : search.coordinates ? (
                    <span className="address-text">
                      Coordinates: {search.coordinates.lat.toFixed(4)}, {search.coordinates.lng.toFixed(4)}
                    </span>
                  ) : (
                    <span className="address-text">
                      No address available
                    </span>
                  )}
                </div>
                
                <button 
                  className="open-maps-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (search.coordinates) {
                      const url = `https://www.google.com/maps/search/?api=1&query=${search.coordinates.lat},${search.coordinates.lng}`;
                      window.open(url, '_blank');
                    } else {
                      console.log('View details for:', search.locationName);
                    }
                  }}
                >
                  {search.coordinates ? 'Open in Maps' : 'View Details'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentSearches;
