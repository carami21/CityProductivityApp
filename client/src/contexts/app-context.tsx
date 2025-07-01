import { createContext, useContext, useReducer, ReactNode } from "react";
import { GridCell, BuildingType } from "@shared/schema";

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  timeLeft: number; // in seconds
  totalTime: number; // in seconds
  sessionType: 'focus' | 'break' | 'deep' | 'long';
}

interface AppState {
  timer: TimerState;
  selectedBuilding: BuildingType | null;
  showAchievement: boolean;
  achievementMessage: string;
}

type AppAction =
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'STOP_TIMER' }
  | { type: 'TICK_TIMER' }
  | { type: 'SET_SESSION_TYPE'; payload: { type: 'focus' | 'break' | 'deep' | 'long'; duration: number } }
  | { type: 'SELECT_BUILDING'; payload: BuildingType | null }
  | { type: 'SHOW_ACHIEVEMENT'; payload: string }
  | { type: 'HIDE_ACHIEVEMENT' };

const initialState: AppState = {
  timer: {
    isRunning: false,
    isPaused: false,
    timeLeft: 25 * 60, // 25 minutes
    totalTime: 25 * 60,
    sessionType: 'focus',
  },
  selectedBuilding: null,
  showAchievement: false,
  achievementMessage: '',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'START_TIMER':
      return {
        ...state,
        timer: {
          ...state.timer,
          isRunning: true,
          isPaused: false,
        },
      };
    case 'PAUSE_TIMER':
      return {
        ...state,
        timer: {
          ...state.timer,
          isRunning: false,
          isPaused: true,
        },
      };
    case 'STOP_TIMER':
      return {
        ...state,
        timer: {
          ...state.timer,
          isRunning: false,
          isPaused: false,
          timeLeft: state.timer.totalTime,
        },
      };
    case 'TICK_TIMER':
      const newTimeLeft = Math.max(0, state.timer.timeLeft - 1);
      return {
        ...state,
        timer: {
          ...state.timer,
          timeLeft: newTimeLeft,
          isRunning: newTimeLeft > 0 ? state.timer.isRunning : false,
        },
      };
    case 'SET_SESSION_TYPE':
      return {
        ...state,
        timer: {
          ...state.timer,
          sessionType: action.payload.type,
          totalTime: action.payload.duration,
          timeLeft: action.payload.duration,
          isRunning: false,
          isPaused: false,
        },
      };
    case 'SELECT_BUILDING':
      return {
        ...state,
        selectedBuilding: action.payload,
      };
    case 'SHOW_ACHIEVEMENT':
      return {
        ...state,
        showAchievement: true,
        achievementMessage: action.payload,
      };
    case 'HIDE_ACHIEVEMENT':
      return {
        ...state,
        showAchievement: false,
        achievementMessage: '',
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
