import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getImageUrl, folderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Collections.css';

interface Location {
  id: string;
  name: string;
  imageUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  confidence?: string;
  address?: string;
  category?: string;
  district?: string;
  rating?: number;
  reviewCount?: string;
  priceRange?: string;
}

interface Folder {
  _id: string;
  name: string;
  description?: string;
  uploads: Location[];
}

function Collections() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (user && !authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Fetch folders only
      const foldersData = await folderAPI.getFolders();
      const processedFolders: Folder[] = (foldersData.folders || []).map((folder: any) => ({
        _id: folder._id,
        name: folder.name,
        description: folder.description,
        uploads: folder.uploads.map((upload: any) => {
          return {
            id: upload._id,
            name: upload.location_name || 'Unknown Location',
            imageUrl: getImageUrl(`/uploads/${upload.filename}`),
            coordinates: {
              lat: upload.actual_coordinates?.latitude || upload.latitude,
              lng: upload.actual_coordinates?.longitude || upload.longitude,
            },
            confidence: upload.confidence,
            address: upload.address,
            category: upload.category || 'Place',
            district: upload.address ? 
              upload.address.split(',').map((part: string) => part.trim()).find((part: string) => 
                part && !part.match(/^\d+/) && part.length > 2
              ) || 'Unknown District' : 'Unknown District',
            rating: 4.5, // Default rating since backend doesn't provide this
            reviewCount: '100+', // Default review count
            priceRange: '$$', // Default price range
          };
        }),
      }));
      
      setFolders(processedFolders);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load collections. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    try {
      const result = await folderAPI.createFolder(newFolderName);
      setFolders([...folders, {
        _id: result.folder._id,
        name: result.folder.name,
        description: result.folder.description,
        uploads: []
      }]);
      setNewFolderName('');
      setShowCreateFolder(false);
    } catch (err) {
      setError('Failed to create folder');
      console.error(err);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (window.confirm('Are you sure you want to delete this folder?')) {
      try {
        await folderAPI.deleteFolder(folderId);
        setFolders(folders.filter(f => f._id !== folderId));
      } catch (err) {
        setError('Failed to delete folder');
        console.error(err);
      }
    }
  };

  const handleViewFolder = (folder: Folder) => {
    navigate('/results', {
      state: {
        locations: folder.uploads,
        collectionName: folder.name,
        gameMode: false, // Explicitly disable game mode for collections
      }
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
            onClick={() => navigate('/')}
            title="Upload new images"
          >
            <span className="plus-icon">+</span>
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button 
              className="error-close"
              onClick={() => setError('')}
            >
              ✕
            </button>
          </div>
        )}

        <div className="folders-section">
          <button 
            className="create-folder-btn"
            onClick={() => setShowCreateFolder(!showCreateFolder)}
          >
            {showCreateFolder ? '✕ Cancel' : '+ Create Folder'}
          </button>

          {showCreateFolder && (
            <div className="create-folder-form">
              <input
                type="text"
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <button onClick={handleCreateFolder} className="confirm-btn">
                Create
              </button>
            </div>
          )}

          {folders.length === 0 ? (
            <div className="empty-state">
              <p>No folders yet</p>
              <p className="subtitle">Create a folder to organize your searches</p>
            </div>
          ) : (
              <div className="folders-grid">
                {folders.map((folder) => (
                  <div key={folder._id} className="location-card">
                    <div 
                      className="location-hero"
                      onClick={() => handleViewFolder(folder)}
                    >
                      {folder.uploads.length > 0 ? (
                        <>
                          <img
                            src={folder.uploads[0].imageUrl}
                            alt={folder.name}
                            className="location-image"
                          />
                          <div className="play-overlay">
                            <div className="play-button">
                              <svg viewBox="0 0 24 24" className="play-icon">
                                <path fill="white" d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="location-placeholder">📁</div>
                      )}
                      <button
                        className="location-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder._id);
                        }}
                        title="Delete folder"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div className="location-content">
                      <div className="location-header">
                        <h2 className="location-title">{folder.name}</h2>
                        <div className="location-tags">
                          <span className="location-tag">Collection</span>
                          <span className="location-tag">Folder</span>
                          <span className="location-tag">Travel</span>
                        </div>
                      </div>
                      
                      <div className="location-body">
                        <div className="location-info">
                          <div className="location-pin">
                            <span className="pin-icon">📍</span>
                            <span className="location-name">
                              {folder.uploads.length} location{folder.uploads.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="location-footer">
                        <div className="location-address">
                          <span className="address-text">
                            Collection • {folder.description || 'Personal collection of locations'}
                          </span>
                        </div>
                        
                        <button 
                          className="open-maps-btn"
                          onClick={() => handleViewFolder(folder)}
                        >
                          View Collection
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

export default Collections;
