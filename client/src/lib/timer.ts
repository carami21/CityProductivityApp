export const SESSION_TYPES = {
  focus: { duration: 25 * 60, label: '25 min Focus', color: 'blue' },
  break: { duration: 5 * 60, label: '5 min Break', color: 'green' },
  deep: { duration: 50 * 60, label: '50 min Deep', color: 'purple' },
  long: { duration: 15 * 60, label: '15 min Long', color: 'orange' },
} as const;

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function calculateBricks(durationMinutes: number): number {
  // 1 brick per 3 minutes of focus time, minimum 1 brick
  return Math.max(1, Math.floor(durationMinutes / 3));
}

export function getSessionTypeFromDuration(durationMinutes: number): 'focus' | 'break' | 'deep' | 'long' {
  if (durationMinutes <= 8) return 'break';
  if (durationMinutes <= 20) return 'long';
  if (durationMinutes <= 30) return 'focus';
  return 'deep';
}
