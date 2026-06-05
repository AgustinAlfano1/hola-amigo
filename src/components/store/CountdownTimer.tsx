import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
  className?: string;
}

const CountdownTimer = ({ expiresAt, className = '' }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expirada'); return; }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      setUrgent(diff < 3600000); // less than 1 hour

      if (days > 0) setTimeLeft(`${days}d ${hours}h ${mins}m`);
      else if (hours > 0) setTimeLeft(`${hours}h ${mins}m ${secs}s`);
      else setTimeLeft(`${mins}m ${secs}s`);
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className={`flex items-center gap-1 ${urgent ? 'text-red-500' : 'text-amber-500'} ${className}`}>
      <Clock className={`h-3 w-3 ${urgent ? 'animate-pulse' : ''}`} />
      <span className="font-mono text-[10px] font-bold">{timeLeft}</span>
    </div>
  );
};

export default CountdownTimer;
