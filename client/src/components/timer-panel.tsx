import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAppContext } from "@/contexts/app-context";
import { formatTime, SESSION_TYPES, calculateBricks } from "@/lib/timer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Square } from "lucide-react";

export default function TimerPanel() {
  const { state, dispatch } = useAppContext();
  const { timer } = state;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [customTimeDigits, setCustomTimeDigits] = useState(['0', '0', '0', '0']); // MM:SS format
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [currentDigitIndex, setCurrentDigitIndex] = useState(0);

  // Get today's sessions for stats
  const { data: todaysSessions = [] } = useQuery({
    queryKey: ['/api/sessions/today'],
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async (sessionData: {
      duration: number;
      sessionType: string;
      bricksEarned: number;
    }) => {
      const response = await apiRequest('POST', '/api/sessions', sessionData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/today'] });
      queryClient.invalidateQueries({ queryKey: ['/api/city'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      const bricks = data.bricksEarned;
      dispatch({
        type: 'SHOW_ACHIEVEMENT',
        payload: `Session Complete! 🎉 You earned ${bricks} bricks. Keep building!`,
      });
      
      setTimeout(() => {
        dispatch({ type: 'HIDE_ACHIEVEMENT' });
      }, 5000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save session",
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timer.isRunning && timer.timeLeft > 0) {
      interval = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
    } else if (timer.timeLeft === 0 && timer.isRunning) {
      // Session completed
      const durationMinutes = Math.floor(timer.totalTime / 60);
      const bricksEarned = calculateBricks(durationMinutes);
      
      completeSessionMutation.mutate({
        duration: durationMinutes,
        sessionType: timer.sessionType,
        bricksEarned,
      });
      
      dispatch({ type: 'STOP_TIMER' });
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, timer.timeLeft, timer.totalTime, timer.sessionType, dispatch]);

  const handleStart = () => {
    dispatch({ type: 'START_TIMER' });
  };

  const handlePause = () => {
    dispatch({ type: 'PAUSE_TIMER' });
  };

  const handleStop = () => {
    dispatch({ type: 'STOP_TIMER' });
  };

  const handleSessionTypeChange = (type: keyof typeof SESSION_TYPES) => {
    const sessionConfig = SESSION_TYPES[type];
    dispatch({
      type: 'SET_SESSION_TYPE',
      payload: {
        type,
        duration: sessionConfig.duration,
      },
    });
  };

  const handleDigitInput = (digit: string) => {
    if (!/^\d$/.test(digit)) return;
    
    const newDigits = [...customTimeDigits];
    newDigits[currentDigitIndex] = digit;
    setCustomTimeDigits(newDigits);
    
    // Move to next digit, wrap to start if at end
    setCurrentDigitIndex((prev) => (prev + 1) % 4);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleDigitInput(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      const newDigits = [...customTimeDigits];
      const prevIndex = currentDigitIndex === 0 ? 3 : currentDigitIndex - 1;
      newDigits[prevIndex] = '0';
      setCustomTimeDigits(newDigits);
      setCurrentDigitIndex(prevIndex);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setCurrentDigitIndex((prev) => prev === 0 ? 3 : prev - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setCurrentDigitIndex((prev) => (prev + 1) % 4);
    }
  };

  const resetCustomTimer = () => {
    setCustomTimeDigits(['0', '0', '0', '0']);
    setCurrentDigitIndex(0);
  };

  const handleCustomTimeSubmit = () => {
    const minutes = parseInt(customTimeDigits[0] + customTimeDigits[1]);
    const seconds = parseInt(customTimeDigits[2] + customTimeDigits[3]);
    const totalSeconds = minutes * 60 + seconds;
    
    if (totalSeconds <= 0) {
      toast({
        title: "Invalid Time",
        description: "Please enter a time greater than 0",
        variant: "destructive",
      });
      return;
    }

    dispatch({
      type: 'SET_SESSION_TYPE',
      payload: {
        type: 'focus', // Default to focus type for custom sessions
        duration: totalSeconds,
      },
    });
    
    setShowCustomDialog(false);
  };

  const getCustomTimeDisplay = () => {
    return `${customTimeDigits[0]}${customTimeDigits[1]}:${customTimeDigits[2]}${customTimeDigits[3]}`;
  };

  const isCustomTimeSet = () => {
    return !Object.values(SESSION_TYPES).some(config => config.duration === timer.totalTime);
  };

  const progress = ((timer.totalTime - timer.timeLeft) / timer.totalTime) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Calculate today's stats
  const todaysStats = {
    sessions: Array.isArray(todaysSessions) ? todaysSessions.length : 0,
    focusTime: Array.isArray(todaysSessions) ? todaysSessions.reduce((total: number, session: any) => total + (session.duration || 0), 0) : 0,
    bricksEarned: Array.isArray(todaysSessions) ? todaysSessions.reduce((total: number, session: any) => total + (session.bricksEarned || 0), 0) : 0,
  };

  const formatFocusTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20 sticky top-24">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Focus Timer</h2>
        
        {/* Timer Display */}
        <div className="relative flex items-center justify-center mb-8">
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="hsl(20, 5.9%, 90%)" strokeWidth="8" fill="none"/>
            <circle 
              cx="50" 
              cy="50" 
              r="45" 
              stroke="url(#timerGradient)" 
              strokeWidth="8" 
              fill="none" 
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(207, 90%, 54%)" />
                <stop offset="100%" stopColor="hsl(159, 64%, 52%)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-gray-900">{formatTime(timer.timeLeft)}</div>
            <div className="text-sm text-gray-600 mt-1 capitalize">{timer.sessionType} Session</div>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center space-x-3 mb-6">
          {!timer.isRunning ? (
            <Button
              onClick={handleStart}
              className="bg-gradient-to-r from-primary hover:from-primary/90 px-6 py-3 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Play className="w-4 h-4 mr-2" />
              {timer.isPaused ? 'Resume' : 'Start'}
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              variant="secondary"
              className="bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 text-white px-6 py-3 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          
          <Button
            onClick={handleStop}
            variant="outline"
            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop
          </Button>
        </div>

        {/* Session Types */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.entries(SESSION_TYPES).map(([key, config]) => (
            <Button
              key={key}
              variant="outline"
              onClick={() => handleSessionTypeChange(key as keyof typeof SESSION_TYPES)}
              disabled={timer.isRunning}
              className={`text-sm font-medium transition-all duration-200 ${
                timer.sessionType === key && timer.totalTime === config.duration
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300'
              }`}
            >
              {config.label}
            </Button>
          ))}
        </div>

        {/* Custom Timer Button */}
        <div className="mb-6">
          <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={timer.isRunning}
                className={`w-full text-sm font-medium transition-all duration-200 ${
                  isCustomTimeSet()
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300'
                }`}
              >
                Custom
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Set Custom Timer</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Google-style timer display */}
                <div className="text-center">
                  <div 
                    className="text-6xl font-mono font-light text-gray-700 cursor-text select-none"
                    onClick={() => setCurrentDigitIndex(0)}
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                    style={{ outline: 'none' }}
                  >
                    <span className={`${currentDigitIndex === 0 ? 'bg-blue-200 rounded px-1' : ''}`}>
                      {customTimeDigits[0]}
                    </span>
                    <span className={`${currentDigitIndex === 1 ? 'bg-blue-200 rounded px-1' : ''}`}>
                      {customTimeDigits[1]}
                    </span>
                    <span className="mx-2">:</span>
                    <span className={`${currentDigitIndex === 2 ? 'bg-blue-200 rounded px-1' : ''}`}>
                      {customTimeDigits[2]}
                    </span>
                    <span className={`${currentDigitIndex === 3 ? 'bg-blue-200 rounded px-1' : ''}`}>
                      {customTimeDigits[3]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Click and type to set time (MM:SS)
                  </p>
                </div>

                {/* Quick time buttons */}
                <div className="flex justify-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomTimeDigits(['0', '0', '3', '0']);
                      setCurrentDigitIndex(0);
                    }}
                  >
                    +0:30
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomTimeDigits(['0', '1', '0', '0']);
                      setCurrentDigitIndex(0);
                    }}
                  >
                    +1:00
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomTimeDigits(['0', '5', '0', '0']);
                      setCurrentDigitIndex(0);
                    }}
                  >
                    +5:00
                  </Button>
                </div>

                <div className="flex space-x-3">
                  <Button onClick={handleCustomTimeSubmit} className="flex-1">
                    Start Timer
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resetCustomTimer();
                      setShowCustomDialog(false);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Today's Stats */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Today's Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sessions Completed</span>
              <span className="font-semibold text-gray-900">{todaysStats.sessions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Focus Time</span>
              <span className="font-semibold text-gray-900">{formatFocusTime(todaysStats.focusTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Bricks Earned</span>
              <span className="font-semibold text-emerald-600">+{todaysStats.bricksEarned}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
