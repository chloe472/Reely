import './LocationList.css';

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

interface LocationListProps {
  locations: Location[];
  gameMode: boolean;
  onCopyAddress?: (address: string) => void;
  onOpenInMaps: (location: Location) => void;
  onGuess?: (locationId: string) => void;
}

function LocationList({ locations, gameMode, onOpenInMaps, onGuess }: LocationListProps) {
  return (
    <div className="location-list">
      <table className="list-table">
        <thead>
          <tr>
            <th className="number-column">#</th>
            <th>Name</th>
            <th>Location</th>
            <th>Country</th>
            <th>Your image</th>
            <th>Google Maps</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location, index) => (
            <tr key={location.id}>
              <td className="number-cell">{index + 1}</td>
              <td className="name-cell">{gameMode ? '???' : (location.name || 'Unknown')}</td>
              <td className="location-cell">{gameMode ? '???' : (location.district || 'xxx')}</td>
              <td className="country-cell">{gameMode ? '???' : (location.address ? location.address.split(',').pop()?.trim() : 'JB')}</td>
              <td className="image-cell">
                <div className="list-image-container">
                  <img src={location.imageUrl} alt={location.name} className="list-image" />
                </div>
              </td>
              <td className="maps-cell">
                {gameMode ? (
                  <button 
                    className="list-guess-button"
                    onClick={() => onGuess?.(location.id)}
                  >
                    Guess
                  </button>
                ) : (
                  <button 
                    className="list-open-maps-button"
                    onClick={() => onOpenInMaps(location)}
                  >
                    Open in Maps
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LocationList;
