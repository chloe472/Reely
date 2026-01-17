import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ImageUpload from '../components/ImageUpload';
import RecentSearches from '../components/RecentSearches';
import LoadingScreen from '../components/LoadingScreen';
import { uploadAPI, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
}

interface RecentSearch {
  id: string;
  locationName: string;
  image: string;
  timestamp: Date;
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
    }));

    setImages([...images, ...newImages]);
  };

  const handleRemoveImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const handleSearch = async () => {
    if (images.length === 0) {
      alert('Please add at least one image before searching.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Upload each image to backend and get analysis
      const uploadPromises = images.map(img => uploadAPI.uploadScreenshot(img.file));
      const results = await Promise.all(uploadPromises);
      
      console.log('Upload results:', results);
      
      // Convert backend response to location format
      const locations = results.map((result) => ({
        id: result.id,
        name: result.analysis.location_name || 'Unknown Location',
        imageUrl: getImageUrl(result.imageUrl),
        coordinates: {
          lat: result.analysis.latitude || 1.3521,
          lng: result.analysis.longitude || 103.8198,
        },
        rating: result.analysis.rating || undefined,
        reviewCount: result.analysis.reviewCount || undefined,
        priceRange: result.analysis.price_range || result.analysis.priceRange || undefined,
        category: result.analysis.category || undefined,
        district: result.analysis.city || undefined,
        address: result.analysis.address || undefined,
      }));
      
      setIsLoading(false);
      
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
        </div>
      </main>
      
      <LoadingScreen isLoading={isLoading} />
    </div>
  );
}

export default Dashboard;
