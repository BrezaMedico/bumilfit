import { useState, useEffect } from 'react';

export const useCountdownOTP = (initialSeconds: number = 60) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (seconds > 0) {
      const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [seconds]);

  const resetCountdown = () => {
    setSeconds(initialSeconds);
    setCanResend(false);
  };

  return { seconds, canResend, resetCountdown };
};
