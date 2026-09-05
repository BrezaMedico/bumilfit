import { useState, useEffect, useRef } from 'react';

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  isExpired: boolean;
  totalSeconds: number;
}

export const useCountdown = (
  targetDate: string | Date | null | undefined,
  onExpire?: () => void
): CountdownResult => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const onExpireCalledRef = useRef(false);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(0);
      return;
    }

    const targetTime = new Date(targetDate).getTime();
    onExpireCalledRef.current = false;

    const calculateTime = () => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft(0);
        if (!onExpireCalledRef.current && onExpire) {
          onExpireCalledRef.current = true;
          onExpire();
        }
      } else {
        setTimeLeft(Math.floor(difference / 1000));
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  const days = Math.floor(timeLeft / (3600 * 24));
  const hours = Math.floor((timeLeft % (3600 * 24)) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  let formatted = '';
  if (days > 0) {
    formatted = `${days} hari ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else if (hours > 0) {
    formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    formatted = `${pad(minutes)}:${pad(seconds)}`;
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    formatted,
    isExpired: timeLeft <= 0 && Boolean(targetDate),
    totalSeconds: timeLeft,
  };
};
