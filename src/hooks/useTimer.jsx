import { useState, useEffect, useCallback } from 'react';

export const useTimer = (initialSeconds, onTimeUp) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);

  // Update timeLeft when initialSeconds changes
  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, onTimeUp]);

  const stopTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
    stopTimer
  };
};