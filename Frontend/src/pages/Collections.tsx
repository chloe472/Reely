import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ResultCard from '../components/ResultCard';
import { uploadAPI, getImageUrl, folderAPI } from '../services/api';
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
  const [allSearches, setAllSearches] = useState<Location[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [viewMode, setViewMode] = useState<'folders' | 'all'>('folders');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedSearchIds, setSelectedSearchIds] = useState<Set<string>>(new Set());
  const [folderToAddTo, setFolderToAddTo] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch all uploads
      const uploadsData = await uploadAPI.getHistory(1000, 0);
      const uploads = uploadsData.uploads || [];
      
      const locations: Location[] = uploads.map((upload: any) => ({
        id: upload.id,
        name: upload.location_name || 'Unknown Location',
        imageUrl: getImageUrl(upload.imageUrl),
        coordinates: {
          lat: upload.latitude,
          lng: upload.longitude,
        },
        confidence: upload.confidence,
        address: upload.address,
      }));
      
      setAllSearches(locations);

      // Fetch folders
      const foldersData = await folderAPI.getFolders();
      const processedFolders: Folder[] = (foldersData.folders || []).map((folder: any) => ({
        _id: folder._id,
        name: folder.name,
        description: folder.description,
        uploads: folder.uploads.map((upload: any) => ({
          id: upload._id,
          name: upload.location_name || 'Unknown Location',
          imageUrl: getImageUrl(upload.imageUrl),
          coordinates: {
            lat: upload.latitude,
            lng: upload.longitude,
          },
          confidence: upload.confidence,
          address: upload.address,
        })),
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

  const handleAddSearchesToFolder = async () => {
    if (!folderToAddTo || selectedSearchIds.size === 0) return;

    try {
      for (const searchId of selectedSearchIds) {
        await folderAPI.addUploadToFolder(folderToAddTo, searchId);
      }
      
      // Refresh data
      await loadData();
      setSelectedSearchIds(new Set());
      setFolderToAddTo(null);
    } catch (err) {
      setError('Failed to add searches to folder');
      console.error(err);
    }
  };

  const toggleSelectSearch = (searchId: string) => {
    const newSelected = new Set(selectedSearchIds);
    if (newSelected.has(searchId)) {
      newSelected.delete(searchId);
    } else {
      newSelected.add(searchId);
    }
    setSelectedSearchIds(newSelected);
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

        <div className="collections-tabs">
          <button 
            className={`tab-button ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            All Searches ({allSearches.length})
          </button>
          <button 
            className={`tab-button ${viewMode === 'folders' ? 'active' : ''}`}
            onClick={() => setViewMode('folders')}
          >
            Folders ({folders.length})
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

        {viewMode === 'folders' ? (
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
                  <div key={folder._id} className="folder-item">
                    <div 
                      className="folder-preview"
                      onClick={() => handleViewFolder(folder)}
                    >
                      {folder.uploads.length > 0 ? (
                        <div className="folder-thumbnails">
                          {folder.uploads.slice(0, 4).map((upload, idx) => (
                            <img
                              key={idx}
                              src={upload.imageUrl}
                              alt={upload.name}
                              className="thumbnail"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="folder-placeholder">📁</div>
                      )}
                    </div>
                    <div className="folder-details">
                      <h3 className="folder-name">{folder.name}</h3>
                      <p className="folder-count">
                        {folder.uploads.length} search{folder.uploads.length !== 1 ? 'es' : ''}
                      </p>
                    </div>
                    <button
                      className="folder-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder._id);
                      }}
                      title="Delete folder"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="all-searches-section">
            {selectedSearchIds.size > 0 && (
              <div className="selection-bar">
                <span>{selectedSearchIds.size} selected</span>
                <select 
                  value={folderToAddTo || ''}
                  onChange={(e) => setFolderToAddTo(e.target.value)}
                  className="folder-select"
                >
                  <option value="">Select folder...</option>
                  {folders.map((folder) => (
                    <option key={folder._id} value={folder._id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                {folderToAddTo && (
                  <button 
                    className="add-btn"
                    onClick={handleAddSearchesToFolder}
                  >
                    Add to Folder
                  </button>
                )}
              </div>
            )}

            {allSearches.length === 0 ? (
              <div className="empty-state">
                <p>No searches yet</p>
                <p className="subtitle">Upload images from the Dashboard to start</p>
              </div>
            ) : (
              <div className="searches-grid">
                {allSearches.map((search) => (
                  <div 
                    key={search.id}
                    className={`search-card-wrapper ${selectedSearchIds.has(search.id) ? 'selected' : ''}`}
                    onClick={() => toggleSelectSearch(search.id)}
                  >
                    <div className="selection-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSearchIds.has(search.id)}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="search-card">
                      <ResultCard
                        location={search}
                        gameMode={false}
                        isSelected={false}
                        onClick={() => {}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Collections;
