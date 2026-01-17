import './LocationCard.css';

interface Location {
  id: string;
  name: string;
  imageUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  // Optional fields that backend will provide
  rating?: number;
  reviewCount?: string;
  priceRange?: string;
  category?: string;
  district?: string;
  address?: string;
}

interface LocationCardProps {
  location: Location;
  onCopyAddress: (address: string) => void;
  onOpenInMaps: (coordinates: { lat: number; lng: number }) => void;
}

function LocationCard({ location, onCopyAddress, onOpenInMaps }: LocationCardProps) {
  // Use backend data if available, otherwise show placeholder
  const displayName = location.name || 'Unknown Location';
  const displayRating = location.rating || 0;
  const displayReviewCount = location.reviewCount || '0';
  const displayPriceRange = location.priceRange || 'N/A';
  const displayCategory = location.category || 'Place';
  const displayDistrict = location.district || 'Unknown District';
  const displayAddress = location.address || 'Address not available';

  return (
    <div className="location-card">
      <div className="location-image-container">
        <img 
          src={location.imageUrl} 
          alt={displayName}
          className="location-image"
        />
      </div>

      <div className="location-details">
        <h3 className="location-name">{displayName}</h3>
        
        {displayRating > 0 && (
          <div className="location-rating">
            <span className="rating-number">{displayRating.toFixed(1)}</span>
            <span className="rating-stars">⭐⭐⭐⭐⭐</span>
            <span className="review-count">({displayReviewCount})</span>
            <span className="separator">•</span>
            <span className="price-range">{displayPriceRange}</span>
          </div>
        )}

        <div className="location-category">
          <span className="category-tag">{displayCategory}</span>
        </div>

        <div className="location-district">
          <span className="district-icon">📍</span>
          <span className="district-name">{displayDistrict}</span>
        </div>

        <div className="location-address">
          <p className="address-text">{displayAddress}</p>
          <button 
            className="copy-button"
            onClick={() => onCopyAddress(displayAddress)}
          >
            Copy
          </button>
        </div>

        <button 
          className="open-maps-button"
          onClick={() => onOpenInMaps(location.coordinates)}
        >
          Open in Maps
        </button>
      </div>
    </div>
  );
}

export default LocationCard;
