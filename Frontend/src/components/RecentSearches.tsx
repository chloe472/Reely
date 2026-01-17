import './RecentSearches.css';

interface RecentSearch {
  id: string;
  locationName: string;
  image: string;
  timestamp: Date;
}

interface RecentSearchesProps {
  searches: RecentSearch[];
}

function RecentSearches({ searches }: RecentSearchesProps) {
  return (
    <div className="recent-searches">
      <h2 className="recent-searches-title">Recent Searches</h2>
      <p className="recent-searches-subtitle">
        Shows recent 3 most searches, location name with image.
      </p>
      
      <div className="searches-grid">
        {searches.slice(0, 3).map((search) => (
          <div key={search.id} className="search-card">
            <img 
              src={search.image} 
              alt={search.locationName} 
              className="search-image"
            />
            <div className="search-info">
              <h3 className="search-location">{search.locationName}</h3>
              <p className="search-timestamp">
                {search.timestamp.toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentSearches;
