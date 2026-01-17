import './LoadingScreen.css';

interface LoadingScreenProps {
  isLoading: boolean;
}

function LoadingScreen({ isLoading }: LoadingScreenProps) {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h2 className="loading-text">Extracting Info</h2>
      </div>
    </div>
  );
}

export default LoadingScreen;
