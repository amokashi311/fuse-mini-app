import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';
import { DareSubmission } from './components/DareSubmission';
import { StreakAnimation } from './components/StreakAnimation';

interface Dare {
  id: string;
  text: string;
}

interface Submission {
  id: string;
  imageUrl: string;
  timestamp: string;
  streak: number;
  dare_id?: string;
  user_id?: string;
  profile_image_url?: string;
  username?: string;
}

interface StreakData {
  count: number;
  lastCompletedDate: string;
}

function App() {
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastCompletedDate: '' });
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [currentDare, setCurrentDare] = useState<Dare | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper to get current date in GMT (YYYY-MM-DD)
  const getTodayGMT = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  // Helper to get seconds until next GMT midnight
  const getSecondsUntilNextGMTMidnight = () => {
    const now = new Date();
    const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    return Math.floor((nextMidnight.getTime() - now.getTime()) / 1000);
  };

  useEffect(() => {
    sdk.actions.ready();
    setTimeLeft(getSecondsUntilNextGMTMidnight());
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeLeft(getSecondsUntilNextGMTMidnight());
          return getSecondsUntilNextGMTMidnight();
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      // Get user context
      const context = await sdk.context;
      setUserData(context.user);
      // Get daily dare
      const dareRes = await fetch('/api/get-daily-dare');
      const dare = await dareRes.json();
      setCurrentDare(dare);
      // Get submissions
      const subRes = await fetch(`/api/get-submissions?dareId=${dare.id}`);
      setSubmissions(await subRes.json());
      // Get streak
      if (context.user?.fid) {
        const streakRes = await fetch(`/api/user-streak?fid=${context.user.fid}`);
        if (streakRes.ok) {
          const data = await streakRes.json();
          setStreak({ count: data.streak, lastCompletedDate: data.last_completed_date });
        }
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Only one handleDareComplete
  const handleDareComplete = async (imageUrl: string) => {
    if (!userData || !currentDare) return;
    // 1. Upsert user
    await fetch('/api/upsert-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fid: userData.fid,
        username: userData.username,
        profileImageUrl: userData.pfpUrl || userData.pfp,
      }),
    });
    // 2. Submit dare
    await fetch('/api/submit-dare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fid: userData.fid,
        dareId: currentDare.id,
        imageUrl,
        streak: streak.count + 1,
        timestamp: new Date().toISOString(),
      }),
    });
    // 3. Update streak
    await fetch(`/api/user-streak?fid=${userData.fid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streak: streak.count + 1,
        lastCompletedDate: getTodayGMT(),
      }),
    });
    // 4. Refresh submissions and streak
    const subRes = await fetch(`/api/get-submissions?dareId=${currentDare.id}`);
    setSubmissions(await subRes.json());
    setStreak({ count: streak.count + 1, lastCompletedDate: getTodayGMT() });
    setShowStreakAnimation(true);
    setTimeLeft(getSecondsUntilNextGMTMidnight());
  };

  const handleShare = async (submission: Submission) => {
    try {
      setIsSharing(true);
      const message = `I completed today's dare on Fuse: "${currentDare?.text}"! 🔥\nI'm on a ${streak.count} days streak!\n\nCheck out my proof:`;
      await sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodeURIComponent(message)}&embeds[]=${encodeURIComponent(submission.imageUrl)}`);
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  async function uploadToS3(file: File) {
    // 1. Get presigned URL
    const res = await fetch('/api/s3-presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileType: file.type }),
    });
    const { url } = await res.json();

    // 2. Upload file to S3
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    // 3. The public URL will be:
    const s3Url = url.split('?')[0];
    return s3Url;
  }

  if (loading || !currentDare) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-black text-white">
        <span className="text-2xl">Loading...</span>
      </div>
    );
  }

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
          {streak.lastCompletedDate === getTodayGMT() ? (
            <div className="flex flex-col items-center justify-center py-8">
              <span className="text-3xl font-bold text-green-400 mb-2">Wohoo! Dare completed for today 🎉</span>
              <span className="text-lg text-gray-200">Next dare starts in:</span>
              <span className="text-2xl font-mono mt-2">{formatTime(timeLeft)}</span>
            </div>
          ) : (
            <>
              <p className="text-xl">{currentDare.text}</p>
              <DareSubmission onComplete={handleDareComplete} uploadToS3={uploadToS3} />
            </>
          )}
        </div>
        {/* Submissions Feed */}
        <div className="bg-black/30 p-6 rounded-xl backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4">Recent Submissions</h2>
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-black/20 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={submission.profile_image_url}
                    alt={`${submission.username}'s profile`}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                  <span className="font-semibold">{submission.username}</span>
                </div>
                <img
                  src={submission.imageUrl}
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
