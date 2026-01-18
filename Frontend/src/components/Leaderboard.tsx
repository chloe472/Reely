import { useState, useEffect } from 'react';
import { uploadAPI } from '../services/api';
import './Leaderboard.css';

// CORS proxy function
const getCorsProxiedUrl = (url: string): string => {
  if (!url) return '';
  // Use cors-anywhere proxy or check if it's a Google image that needs proxying
  if (url.includes('lh3.googleusercontent.com') || url.includes('googleapis.com')) {
    // Use allorigins CORS proxy which is reliable
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
  }
  return url;
};

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  userEmail?: string;
  avatarUrl?: string;
  totalPoints: number;
  gamesPlayed: number;
  bestScore: number;
  averageDistance: number;
}

interface LeaderboardProps {
  limit?: number;
}

function Leaderboard({ limit = 10 }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [limit]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await uploadAPI.getLeaderboard(limit);
      console.log('🏆 Leaderboard data received:', data.leaderboard);
      console.log('📊 Avatar URLs:', data.leaderboard.map((e: LeaderboardEntry) => ({ 
        name: e.displayName, 
        avatar: e.avatarUrl 
      })));
      setLeaderboard(data.leaderboard);
      setError('');
    } catch (err: any) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="leaderboard">
        <h2 className="leaderboard-title">🏆 Leaderboard</h2>
        <div className="leaderboard-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard">
        <h2 className="leaderboard-title">🏆 Leaderboard</h2>
        <div className="leaderboard-error">{error}</div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="leaderboard">
        <h2 className="leaderboard-title">🏆 Leaderboard</h2>
        <div className="leaderboard-empty">
          No players yet. Be the first to play and claim the top spot!
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h2 className="leaderboard-title">🏆 Leaderboard</h2>
      <p className="leaderboard-subtitle">Top {limit} players by total points</p>
      
      <div className="leaderboard-table">
        <div className="leaderboard-header">
          <div className="rank-col">Rank</div>
          <div className="player-col">Player</div>
          <div className="stat-col">Points</div>
          <div className="stat-col">Games</div>
          <div className="stat-col">Best</div>
        </div>

        {leaderboard.map((entry, index) => (
          <div 
            key={entry.userId} 
            className={`leaderboard-row ${index < 3 ? 'top-three' : ''}`}
          >
            <div className="rank-col">
              <span className="rank-badge">{getMedalEmoji(index + 1)}</span>
            </div>
            <div className="player-col">
              {entry.avatarUrl ? (
                <>
                  <img 
                    src={getCorsProxiedUrl(entry.avatarUrl)} 
                    alt={entry.displayName}
                    className="player-avatar"
                    onLoad={() => console.log(`✅ Avatar loaded for ${entry.displayName}`)}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      console.error(`❌ Avatar failed for ${entry.displayName}:`, entry.avatarUrl);
                      // Show placeholder instead
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const placeholder = target.nextElementSibling as HTMLElement;
                      if (placeholder) {
                        placeholder.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="player-avatar-placeholder" style={{ display: 'none' }}>
                    {entry.displayName?.charAt(0).toUpperCase() || '?'}
                  </div>
                </>
              ) : (
                <div className="player-avatar-placeholder">
                  {entry.displayName?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div className="player-info">
                <span className="player-name">
                  {entry.displayName}
                </span>
                {entry.averageDistance > 0 && (
                  <span className="player-stat">
                    Avg: {entry.averageDistance.toFixed(0)}km
                  </span>
                )}
              </div>
            </div>
            <div className="stat-col">
              <span className="stat-value primary">{entry.totalPoints.toLocaleString()}</span>
            </div>
            <div className="stat-col">
              <span className="stat-value">{entry.gamesPlayed}</span>
            </div>
            <div className="stat-col">
              <span className="stat-value">{entry.bestScore}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leaderboard;
