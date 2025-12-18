import React, { useState, useEffect } from 'react';
import { X, Play, Pause } from 'lucide-react';

interface FocusModalProps {
  taskText: string;
  onClose: () => void;
  onMarkComplete: () => void;
}

export const FocusModal: React.FC<FocusModalProps> = ({ taskText, onClose, onMarkComplete }) => {
  const FOCUS_TIME = 25 * 60; // 25 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerStarted) {
      // Timer completed - play sound and show completion message
      playCompletionSound();
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, timerStarted]);

  const playCompletionSound = () => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const toggleTimer = () => {
    setTimerStarted(true);
    setIsActive(!isActive);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100;
  const isComplete = timeLeft === 0 && timerStarted;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#102542] p-8 max-w-md w-full border-l-4 border-cyan-400 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest">
            Focus <span className="text-cyan-400">Protocol</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 transition-colors text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Task Name */}
        <div className="mb-6 p-4 bg-slate-800 border-l-2 border-[#F87060]">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Current Task</p>
          <p className="text-white font-medium truncate">{taskText}</p>
        </div>

        {/* Timer Display */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Progress Circle */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#1e3a63"
                  strokeWidth="8"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke={isComplete ? '#22c55e' : isActive ? '#06b6d4' : '#8884d8'}
                  strokeWidth="8"
                  strokeDasharray={`${(progress / 100) * 565} 565`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>

              {/* Time Display */}
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-5xl font-bold text-white tabular-nums font-mono">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-widest mt-2">
                  {isComplete ? 'COMPLETE' : isActive ? 'FOCUSING' : 'READY'}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isComplete ? 'bg-green-500' : isActive ? 'bg-cyan-400' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {!isComplete ? (
          <button
            onClick={toggleTimer}
            className={`w-full py-4 px-6 font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2 ${
              isActive
                ? 'bg-amber-500 hover:bg-amber-600 text-[#102542]'
                : 'bg-cyan-400 hover:bg-cyan-500 text-[#102542]'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>{timerStarted ? 'Resume' : 'Start'}</span>
              </>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={onMarkComplete}
              className="w-full py-4 px-6 bg-green-500 hover:bg-green-600 text-white font-bold uppercase tracking-widest transition-all"
            >
              Mark as Done
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 px-6 bg-slate-700 hover:bg-slate-600 text-white font-bold uppercase tracking-widest transition-all"
            >
              Close
            </button>
          </div>
        )}

        {/* Info Text */}
        <p className="text-xs text-gray-400 uppercase tracking-wider text-center mt-6">
          Stay focused. Eliminate distractions.
        </p>
      </div>
    </div>
  );
};
