import { useGetNotifications, useMarkNotificationRead, getGetNotificationsQueryKey } from "@workspace/api-client-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { timeAgo } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const TYPE_CONFIG: Record<string, { gradient: string; letter: string }> = {
  booking_request:   { gradient: "from-blue-500 to-indigo-500",   letter: "S" },
  booking_confirmed: { gradient: "from-emerald-500 to-teal-500",  letter: "C" },
  price_alert:       { gradient: "from-green-500 to-lime-500",     letter: "P" },
  review_received:   { gradient: "from-amber-500 to-orange-400",   letter: "R" },
  system:            { gradient: "from-slate-400 to-slate-600",    letter: "A" },
  new_car:           { gradient: "from-primary to-rose-400",       letter: "N" },
};

function NotifAvatar({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] ?? { gradient: "from-slate-400 to-slate-600", letter: "A" };
  return (
    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
      <span className="text-white font-bold text-base">{cfg.letter}</span>
    </div>
  );
}

export default function Notifications() {
  const { data: notifications, isLoading } = useGetNotifications();
  const queryClient = useQueryClient();
  const markRead = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      }
    }
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border pt-safe">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            Avisos
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-primary font-semibold">
              Marcar leídos
            </Button>
          )}
        </div>
      </header>

      <main className="p-4 space-y-3">
        {isLoading ? (
          <>
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </>
        ) : notifications?.length ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.read && markRead.mutate({ id: notif.id })}
              className={`p-4 rounded-2xl border transition-colors cursor-pointer ${
                notif.read
                  ? "bg-card border-card-border/50"
                  : "bg-secondary/30 border-primary/20 shadow-sm"
              }`}
            >
              <div className="flex gap-4">
                <NotifAvatar type={notif.type} />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-bold ${notif.read ? "text-foreground/80" : "text-foreground"}`}>
                      {notif.title}
                    </h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />
                    )}
                  </div>
                  <p className={`text-sm mb-2 leading-snug ${notif.read ? "text-muted-foreground" : "text-foreground/90"}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-bold text-primary/50">0</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Todo al día</h2>
            <p className="text-muted-foreground text-sm">No tienes notificaciones nuevas por ahora.</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-card border border-card-border flex gap-4">
      <Skeleton className="w-12 h-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/4 mt-2" />
      </div>
    </div>
  );
}
