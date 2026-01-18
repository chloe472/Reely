import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { uploadAPI, getImageUrl, folderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './SearchHistory.css';

interface SearchHistoryItem {
  id: string;
  name: string;
  imageUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  confidence?: string;
  address?: string;
  timestamp: Date;
}

interface Folder {
  _id: string;
  name: string;
  description?: string;
  uploads: any[];
}

function SearchHistory() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authLoading) {
      loadSearchHistory();
      loadFolders();
    }
  }, [user, authLoading]);

  const loadSearchHistory = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch all uploads (search history)
      const uploadsData = await uploadAPI.getHistory(1000, 0);
      const uploads = uploadsData.uploads || [];
      
      const searchItems: SearchHistoryItem[] = uploads.map((upload: any) => ({
        id: upload.id,
        name: upload.location_name || 'Unknown Location',
        imageUrl: getImageUrl(`/uploads/${upload.filename}`),
        coordinates: {
          lat: upload.actual_coordinates?.latitude || upload.latitude,
          lng: upload.actual_coordinates?.longitude || upload.longitude,
        },
        confidence: upload.confidence,
        address: upload.address,
        timestamp: new Date(upload.created_at),
      }));
      
      setSearchHistory(searchItems);
    } catch (err) {
      console.error('Failed to load search history:', err);
      setError('Failed to load search history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const foldersData = await folderAPI.getFolders();
      const processedFolders: Folder[] = (foldersData.folders || []).map((folder: any) => ({
        _id: folder._id,
        name: folder.name,
        description: folder.description,
        uploads: folder.uploads || [],
      }));
      setFolders(processedFolders);
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  };

  const handleSaveToFolder = (searchId: string) => {
    setActiveSearchId(searchId);
    setShowSaveModal(true);
  };

  const handleSaveConfirm = async (folderId: string) => {
    if (!activeSearchId) return;
    
    try {
      await folderAPI.addUploadToFolder(folderId, activeSearchId);
      setShowSaveModal(false);
      setActiveSearchId(null);
      // Show success feedback (you could add a toast notification)
      console.log('Search saved to folder successfully');
    } catch (err) {
      console.error('Failed to save to folder:', err);
      setError('Failed to save to folder. Please try again.');
    }
  };

  const handleCopyAddress = async (address: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      console.log('Address copied to clipboard');
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleDeleteSearch = async (searchId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this search?')) {
      return;
    }
    
    try {
      await uploadAPI.deleteUpload(searchId);
      setSearchHistory(searchHistory.filter(s => s.id !== searchId));
      setOpenMenuId(null);
      console.log('Search deleted successfully');
    } catch (err) {
      console.error('Failed to delete search:', err);
      setError('Failed to delete search. Please try again.');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="search-history">
        <Sidebar />
        <main className="search-history-main">
          <div className="loading-container">
            <p>Loading search history...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="search-history">
      <Sidebar />
      <main className="search-history-main">
        <div className="search-history-header">
          <h1 className="search-history-title">Search History</h1>
          <p className="search-history-subtitle">
            All your past location searches ({searchHistory.length} total)
          </p>
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

        {searchHistory.length === 0 ? (
          <div className="empty-state">
            <p>No search history yet</p>
            <p className="subtitle">Upload images from the Dashboard to start building your search history</p>
          </div>
        ) : (
          <div className="search-history-grid">
            {searchHistory.map((search) => (
              <div key={search.id} className="location-card">
                <div className="location-hero">
                  <img
                    src={search.imageUrl}
                    alt={search.name}
                    className="location-image"
                  />
                  <div className="play-overlay">
                    <div className="play-button">
                      <svg viewBox="0 0 24 24" className="play-icon">
                        <path fill="white" d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Kebab Menu */}
                  <div className="kebab-menu-container">
                    <button 
                      className="kebab-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === search.id ? null : search.id);
                      }}
                      title="More options"
                    >
                      ⋮
                    </button>
                    
                    {openMenuId === search.id && (
                      <div className="kebab-dropdown">
                        <button 
                          className="kebab-option delete"
                          onClick={(e) => handleDeleteSearch(search.id, e)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="location-content">
                  <div className="location-header">
                    <h2 className="location-title">{search.name}</h2>
                    <div className="location-tags">
                      <span className="location-tag">Search</span>
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
                        <span className="location-name">{search.name}</span>
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
                      ) : (
                        <span className="address-text">
                          Coordinates: {search.coordinates.lat.toFixed(4)}, {search.coordinates.lng.toFixed(4)}
                        </span>
                      )}
                    </div>
                    
                    <div className="location-actions">
                      <button 
                        className="save-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveToFolder(search.id);
                        }}
                        title="Save to folder"
                      >
                        Save
                      </button>
                      <button 
                        className="open-maps-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `https://www.google.com/maps/search/?api=1&query=${search.coordinates.lat},${search.coordinates.lng}`;
                          window.open(url, '_blank');
                        }}
                      >
                        Open in Maps
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save to Folder Modal */}
        {showSaveModal && (
          <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Save to Folder</h2>
                <button 
                  className="modal-close"
                  onClick={() => setShowSaveModal(false)}
                >
                  ✕
                </button>
              </div>
              
              <div className="modal-body">
                {folders.length === 0 ? (
                  <div className="no-folders">
                    <p>No folders available. Create a folder first in Collections.</p>
                    <button 
                      className="create-folder-link"
                      onClick={() => {
                        setShowSaveModal(false);
                        navigate('/collections');
                      }}
                    >
                      Go to Collections
                    </button>
                  </div>
                ) : (
                  <div className="folders-list">
                    {folders.map((folder) => (
                      <div 
                        key={folder._id}
                        className="folder-option"
                        onClick={() => handleSaveConfirm(folder._id)}
                      >
                        <div className="folder-preview">
                          {folder.uploads.length > 0 ? (
                            <img 
                              src={getImageUrl(folder.uploads[0].imageUrl)} 
                              alt={folder.name}
                              className="folder-thumbnail"
                            />
                          ) : (
                            <div className="folder-placeholder">
                              📁
                            </div>
                          )}
                        </div>
                        <div className="folder-info">
                          <h3>{folder.name}</h3>
                          <p>{folder.uploads.length} items</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default SearchHistory;
