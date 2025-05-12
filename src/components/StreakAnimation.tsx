import { useEffect, useState } from 'react';

interface StreakAnimationProps {
  streak: number;
  onAnimationComplete: () => void;
}

export function StreakAnimation({ streak, onAnimationComplete }: StreakAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(false);
      onAnimationComplete();
    }, 3000); // Animation lasts 3 seconds

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  const handleClose = () => {
    setShowAnimation(false);
    onAnimationComplete();
  };

  if (!showAnimation) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="relative text-center animate-bounce">
        <button
          onClick={handleClose}
          className="absolute -top-4 -right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
          aria-label="Close celebration"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="text-6xl mb-4">🎉</div>
        <div className="text-4xl font-bold text-white mb-2">
          {streak} Day Streak!
        </div>
        <div className="text-xl text-purple-300">
          Keep up the amazing work!
        </div>
      </div>
    </div>
  );
} 