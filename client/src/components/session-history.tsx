import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export default function SessionHistory() {
  // Get recent sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/sessions'],
  });

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSessionIcon = (sessionType: string) => {
    switch (sessionType) {
      case 'focus':
        return 'fa-brain';
      case 'deep':
        return 'fa-mountain';
      case 'break':
        return 'fa-coffee';
      case 'long':
        return 'fa-clock';
      default:
        return 'fa-circle';
    }
  };

  const getStatusColor = (sessionType: string) => {
    switch (sessionType) {
      case 'focus':
        return 'bg-blue-500';
      case 'deep':
        return 'bg-purple-500';
      case 'break':
        return 'bg-green-500';
      case 'long':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-md border-white/20">
      <CardContent className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Sessions</h2>
        
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-clock text-4xl mb-4 opacity-50" />
            <p>No sessions yet. Start your first focus session!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session: any) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${getStatusColor(session.sessionType)} rounded-full`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                      <i className={`fas ${getSessionIcon(session.sessionType)} text-gray-600`} />
                      <span>{session.duration} min</span>
                      <span className="text-gray-500 capitalize">({session.sessionType})</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDistanceToNow(new Date(session.completedAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <i className="fas fa-cube text-red-500" />
                  <span className="font-semibold text-green-600">+{session.bricksEarned}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {sessions.length > 5 && (
          <Button variant="ghost" className="w-full mt-4 text-sm text-primary hover:text-primary/80">
            View All Sessions
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
