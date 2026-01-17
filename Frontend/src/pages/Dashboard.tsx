import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ImageUpload from '../components/ImageUpload';
import RecentSearches from '../components/RecentSearches';
import LoadingScreen from '../components/LoadingScreen';
import Leaderboard from '../components/Leaderboard';
import { uploadAPI, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'video';
}

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

function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // Use context instead of local storage
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [error, setError] = useState('');

  // Load recent searches when user is available
  useEffect(() => {
    if (user) {
      loadRecentSearches();
    }
  }, [user]);

  const loadRecentSearches = async () => {
    try {
      const data = await uploadAPI.getHistory(3, 0);
      const searches: RecentSearch[] = data.uploads.map((upload: any) => ({
        id: upload.id,
        locationName: upload.location_name || 'Unknown Location',
        image: getImageUrl(upload.imageUrl),
        timestamp: new Date(upload.created_at),
        coordinates: upload.latitude && upload.longitude ? {
          lat: upload.latitude,
          lng: upload.longitude,
        } : undefined,
        address: upload.address,
        confidence: upload.confidence,
      }));
      setRecentSearches(searches);
    } catch (err) {
      console.error('Failed to load recent searches:', err);
    }
  };

  const handleAddImages = (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));

    setImages([...images, ...newImages]);
  };

  const handleRemoveImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const handleSearch = async () => {
    if (images.length === 0) {
      alert('Please add at least one image or video before searching.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Upload each file to backend and get analysis with coordinates
      const uploadPromises = images.map(img => uploadAPI.uploadScreenshot(img.file));
      const results = await Promise.all(uploadPromises);
      
      console.log('Upload results:', results);
      
      // Flatten results - videos return multiple locations
      const allLocations = results.flatMap(result => {
        if (result.type === 'video') {
          // Video returns array of locations
          return result.locations || [];
        } else {
          // Image returns single location
          return [result];
        }
      });
      
      // Check for errors in results
      const hasErrors = allLocations.some(result => result.hasError && result.errorType !== 'LOW_CONFIDENCE');
      if (hasErrors) {
        const errorResult = allLocations.find(r => r.hasError && r.errorType !== 'LOW_CONFIDENCE');
        throw new Error(errorResult.message || 'Failed to process one or more files');
      }
      
      // Filter out results without valid coordinates
      const validResults = allLocations.filter(result => 
        result.coordinates && 
        result.coordinates.lat && 
        result.coordinates.lng
      );
      
      if (validResults.length === 0) {
        throw new Error('No valid coordinates detected in any file. Please try files with clear, identifiable locations.');
      }
      
      // Show warning for low confidence results
      const lowConfidenceResults = allLocations.filter(r => r.confidence === 'low' || r.errorType === 'LOW_CONFIDENCE');
      if (lowConfidenceResults.length > 0) {
        console.warn('Some images had low confidence:', lowConfidenceResults.length);
        // You could show a warning banner here
      }
      
      // Convert backend response to location format
      const locations = validResults.map((result) => ({
        id: result.id,
        name: result.location?.name || 'Unknown Location',
        imageUrl: result.imageUrl ? getImageUrl(result.imageUrl) : undefined,
        coordinates: {
          lat: result.coordinates.lat,
          lng: result.coordinates.lng,
        },
        rating: result.analysis?.rating || undefined,
        reviewCount: result.analysis?.reviewCount || undefined,
        priceRange: result.location?.category || undefined,
        category: result.location?.category || undefined,
        district: result.location?.city || undefined,
        address: result.location?.address || undefined,
        confidence: result.confidence,
        streetViewUrl: result.street_view_url || result.streetViewUrl,
        googleMapsUrl: result.google_maps_url || result.googleMapsUrl,
      }));
      
      setIsLoading(false);
      
      // Clear images after successful upload
      setImages([]);
      
      // Reload recent searches
      await loadRecentSearches();
      
      // Navigate to results page
      navigate('/results', { state: { locations } });
      
    } catch (err: any) {
      console.error('Search error:', err);
      setIsLoading(false);
      setError(err.message || 'Failed to process images. Please try again.');
      alert(err.message || 'Failed to process images. Please try again.');
    }
  };

  if (authLoading) {
    return <LoadingScreen isLoading={true} />;
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1 className="dashboard-title">Dashboard</h1>
          
          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}
          
          <ImageUpload
            images={images}
            onAddImages={handleAddImages}
            onRemoveImage={handleRemoveImage}
          />

          <button 
            className="search-button"
            onClick={handleSearch}
            disabled={images.length === 0 || isLoading}
          >
            {isLoading ? 'Processing...' : 'Search'}
          </button>

          {recentSearches.length > 0 && (
            <RecentSearches searches={recentSearches} />
          )}

          <Leaderboard limit={10} />
        </div>
      </main>
      
      <LoadingScreen isLoading={isLoading} />
    </div>
  );
}

export default Dashboard;
