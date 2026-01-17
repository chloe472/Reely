import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ImageUpload from '../components/ImageUpload';
import RecentSearches from '../components/RecentSearches';
import LoadingScreen from '../components/LoadingScreen';
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
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches] = useState<RecentSearch[]>([
    {
      id: '1',
      locationName: 'Sample Location 1',
      image: 'https://via.placeholder.com/300x200',
      timestamp: new Date(),
    },
    {
      id: '2',
      locationName: 'Sample Location 2',
      image: 'https://via.placeholder.com/300x200',
      timestamp: new Date(),
    },
    {
      id: '3',
      locationName: 'Sample Location 3',
      image: 'https://via.placeholder.com/300x200',
      timestamp: new Date(),
    },
  ]);

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

  const handleSearch = () => {
    if (images.length === 0) {
      alert('Please add at least one image before searching.');
      return;
    }
    
    // Show loading screen
    setIsLoading(true);
    
    // Simulate API call - Replace this with your actual backend API call
    setTimeout(() => {
      console.log('Searching with images:', images);
      
      // Convert images to location format for Results page
      // TODO: Replace with actual backend response
      const locations = images.map((img, index) => ({
        id: img.id,
        name: `Location ${index + 1}`,
        imageUrl: img.preview,
        coordinates: {
          lat: 1.3521 + (index * 0.05), // Mock coordinates
          lng: 103.8198 + (index * 0.05),
        },
        // Backend should provide these fields:
        rating: 4.5,
        reviewCount: '9,491',
        priceRange: 'RM 20-60',
        category: 'Cafe',
        district: 'Johor Bahru',
        address: '171, Jln Beringin, Taman Melodies, 80250 Johor Bahru, Johor Darul Ta\'zim, Malaysia',
      }));
      
      setIsLoading(false);
      // Navigate to results page with image data
      navigate('/results', { state: { locations } });
    }, 3000); // 3 second delay to simulate API processing
  };

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <h1 className="dashboard-title">Dashboard</h1>
          
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
            Search
          </button>

          <RecentSearches searches={recentSearches} />
        </div>
      </main>
      
      <LoadingScreen isLoading={isLoading} />
    </div>
  );
}

export default Dashboard;
