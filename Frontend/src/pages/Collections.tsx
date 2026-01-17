import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { uploadAPI, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Collections.css';

interface Upload {
  id: string;
  location_name: string;
  imageUrl: string;
  created_at: string;
  latitude: number;
  longitude: number;
  confidence?: string;
  address?: string;
}

interface Batch {
  id: string;
  createdAt: Date;
  imageCount: number;
  topImages: string[];
  uploads: Upload[];
}

function Collections() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [viewMode, setViewMode] = useState<'folders' | 'all'>('folders');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !authLoading) {
      loadCollections();
    }
  }, [user, authLoading]);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch all uploads
      const data = await uploadAPI.getHistory(1000, 0);
      const uploads: Upload[] = data.uploads || [];

      // Group uploads by batch (upload session)
      // Uploads within 5 minutes of each other are considered the same batch
      const BATCH_TIMEOUT = 5 * 60 * 1000; // 5 minutes
      const batchMap = new Map<string, Upload[]>();
      
      // Sort by created_at descending
      const sortedUploads = [...uploads].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      let currentBatchId = '';
      let lastUploadTime: number | null = null;

      sortedUploads.forEach((upload: any) => {
        const uploadTime = new Date(upload.created_at).getTime();
        
        // If this is the first upload or too much time has passed, create a new batch
        if (!lastUploadTime || (uploadTime - lastUploadTime) > BATCH_TIMEOUT) {
          currentBatchId = `batch_${uploadTime}`;
          batchMap.set(currentBatchId, []);
        }
        
        batchMap.get(currentBatchId)!.push({
          id: upload.id,
          location_name: upload.location_name || 'Unknown Location',
          imageUrl: getImageUrl(upload.imageUrl),
          created_at: upload.created_at,
          latitude: upload.latitude,
          longitude: upload.longitude,
          confidence: upload.confidence,
          address: upload.address,
        });
        
        lastUploadTime = uploadTime;
      });

      // Convert map to batches array
      const batchesArray: Batch[] = Array.from(batchMap).map(([batchId, uploads]) => {
        // Get top 3 most recent images from the batch
        const topImages = uploads
          .slice(0, 3)
          .map(u => u.imageUrl);

        return {
          id: batchId,
          createdAt: new Date(uploads[0].created_at),
          imageCount: uploads.length,
          topImages,
          uploads,
        };
      });

      // Batches are already sorted by time (newest first due to reverse iteration)
      setBatches(batchesArray);
    } catch (err) {
      console.error('Failed to load collections:', err);
      setError('Failed to load collections. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchClick = (batch: Batch) => {
    // Convert uploads to locations format
    const locations = batch.uploads.map((upload) => ({
      id: upload.id,
      name: upload.location_name,
      imageUrl: upload.imageUrl,
      coordinates: {
        lat: upload.latitude,
        lng: upload.longitude,
      },
      confidence: upload.confidence,
      address: upload.address,
    }));

    // Navigate to results page with the batch's locations
    navigate('/results', {
      state: {
        locations,
        collectionName: `Batch - ${batch.createdAt.toLocaleDateString()}`,
      }
    });
  };

  const handleCreateNewCollection = () => {
    // Navigate to dashboard to upload new images
    navigate('/');
  };

  const formatBatchDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="collections">
        <Sidebar />
        <main className="collections-main">
          <div className="loading-container">
            <p>Loading collections...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="collections">
      <Sidebar />
      <main className="collections-main">
        <div className="collections-header">
          <h1 className="collections-title">Your Collections</h1>
          <button 
            className="create-collection-btn"
            onClick={handleCreateNewCollection}
            title="Create new collection by uploading images"
          >
            <span className="plus-icon">+</span>
          </button>
        </div>

        <div className="collections-tabs">
          <button 
            className={`tab-button ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            All Searches
          </button>
          <button 
            className={`tab-button ${viewMode === 'folders' ? 'active' : ''}`}
            onClick={() => setViewMode('folders')}
          >
            Folders
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {batches.length === 0 ? (
          <div className="no-collections">
            <p>No collections yet</p>
            <p className="subtitle">Upload images from the Dashboard to create your first collection</p>
            <button 
              className="create-btn-secondary"
              onClick={handleCreateNewCollection}
            >
              Get Started
            </button>
          </div>
        ) : viewMode === 'all' ? (
          <div className="all-searches-view">
            {batches.flatMap((batch) => 
              batch.uploads.map((upload) => (
                <div 
                  key={upload.id} 
                  className="search-item"
                  onClick={() => handleBatchClick(batch)}
                >
                  <img src={upload.imageUrl} alt={upload.location_name} />
                  <div className="search-info">
                    <h4>{upload.location_name}</h4>
                    <p>{new Date(upload.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="folders-view">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="folder-card"
                onClick={() => handleBatchClick(batch)}
              >
                <div className="folder-images">
                  {batch.topImages.length > 0 ? (
                    <>
                      <div className="main-image">
                        <img src={batch.topImages[0]} alt="Batch preview" />
                      </div>
                      {batch.topImages.length > 1 && (
                        <div className="side-images">
                          {batch.topImages.slice(1, 3).map((img, idx) => (
                            <img key={idx} src={img} alt={`Preview ${idx + 2}`} />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="folder-placeholder">
                      <span>📸</span>
                    </div>
                  )}
                </div>
                <div className="folder-info">
                  <p className="batch-date">{formatBatchDate(batch.createdAt)}</p>
                  <p className="batch-count">
                    {batch.imageCount} location{batch.imageCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Collections;
