import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { DareSubmission } from './components/DareSubmission';
import { StreakAnimation } from './components/StreakAnimation';

interface Dare {
  id: string;
  text: string;
  submissions: Submission[];
}

interface Submission {
  id: string;
  userId: string;
  userName: string;
  mediaUrl: string;
  timestamp: number;
  profileImageUrl?: string;
}

interface StreakData {
  count: number;
  lastCompletedDate: string;
}

interface FarcasterUser {
  fid: string;
  username: string;
  displayName: string;
  pfp: {
    url: string;
  };
}

function App() {
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds
  const [streak, setStreak] = useState<StreakData>(() => {
    const savedStreak = localStorage.getItem('dareStreak');
    return savedStreak ? JSON.parse(savedStreak) : { count: 0, lastCompletedDate: '' };
  });
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [currentDare, setCurrentDare] = useState<Dare>({
    id: '1',
    text: 'Take a selfie with a stranger and share a fun fact about yourself!',
    submissions: []
  });
  const [isSharing, setIsSharing] = useState(false);
  const [currentUser, setCurrentUser] = useState<FarcasterUser | null>(null);

  useEffect(() => {
    // Call ready when the app is loaded
    sdk.actions.ready();

    // Fetch current user's profile
    const fetchUserProfile = async () => {
      try {
        // Get the user's FID (Farcaster ID)
        const { fid } = await sdk.actions.getUser();
        
        // Fetch user profile data from Farcaster API
        const response = await fetch(`https://api.warpcast.com/v2/user?fid=${fid}`);
        const data = await response.json();
        
        if (data.result?.user) {
          setCurrentUser(data.result.user);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();

    // Timer logic
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Save streak to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dareStreak', JSON.stringify(streak));
  }, [streak]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDareComplete = async (mediaUrl: string) => {
    // Reset timer
    setTimeLeft(24 * 60 * 60);

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    if (streak.lastCompletedDate !== today) {
      const newStreak = {
        count: streak.count + 1,
        lastCompletedDate: today
      };
      setStreak(newStreak);
      setShowStreakAnimation(true);
    }

    // Add new submission
    const newSubmission: Submission = {
      id: Date.now().toString(),
      userId: currentUser?.fid || 'unknown',
      userName: currentUser?.displayName || 'Anonymous',
      mediaUrl,
      timestamp: Date.now(),
      profileImageUrl: currentUser?.pfp?.url
    };

    setCurrentDare(prev => ({
      ...prev,
      submissions: [newSubmission, ...prev.submissions]
    }));

    // TODO: Save submission to backend
  };

  const handleShare = async (submission: Submission) => {
    try {
      setIsSharing(true);
      
      // Create a shareable message
      const message = `🎯 Just completed today's dare: "${currentDare.text}"\n\n🔥 My streak: ${streak.count} days\n\n#DareChallenge #Farcaster`;
      
      // Open the Farcaster composer with pre-filled content
      await sdk.actions.openUrl({
        url: `https://warpcast.com/~/compose?text=${encodeURIComponent(message)}&embeds[]=${encodeURIComponent(submission.mediaUrl)}`,
        close: true
      });
    } catch (error) {
      console.error('Error sharing to Farcaster:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white p-4">
      {showStreakAnimation && (
        <StreakAnimation
          streak={streak.count}
          onAnimationComplete={() => setShowStreakAnimation(false)}
        />
      )}
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Streak Section */}
        <div className="bg-black/30 p-6 rounded-xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-2">Current Streak</h2>
          <div className="text-4xl font-mono">{streak.count} 🔥</div>
          <p className="text-sm text-gray-300 mt-2">
            {streak.lastCompletedDate ? `Last completed: ${new Date(streak.lastCompletedDate).toLocaleDateString()}` : 'No dares completed yet'}
          </p>
        </div>

        {/* Timer Section */}
        <div className="bg-black/30 p-6 rounded-xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-2">Time Remaining</h2>
          <div className="text-4xl font-mono">{formatTime(timeLeft)}</div>
        </div>

        {/* Current Dare Section */}
        <div className="bg-black/30 p-6 rounded-xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4">Today's Dare</h2>
          <p className="text-xl">{currentDare.text}</p>
          <DareSubmission onComplete={handleDareComplete} />
        </div>

        {/* Submissions Feed */}
        <div className="bg-black/30 p-6 rounded-xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4">Recent Submissions</h2>
          <div className="space-y-4">
            {currentDare.submissions.map((submission) => (
              <div key={submission.id} className="bg-black/20 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <img 
                    src={submission.profileImageUrl || '/default-avatar.png'} 
                    alt={`${submission.userName}'s profile`}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                  <span className="font-semibold">{submission.userName}</span>
                </div>
                <img 
                  src={submission.mediaUrl} 
                  alt="Submission"
                  className="w-full rounded-lg"
                />
                <button
                  onClick={() => handleShare(submission)}
                  disabled={isSharing}
                  className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSharing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
                      </svg>
                      Share to Farcaster
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
