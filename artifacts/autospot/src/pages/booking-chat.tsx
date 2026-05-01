import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Send } from "lucide-react";

interface Message {
  id: number;
  bookingId: number;
  senderUserId: string;
  recipientUserId: string;
  body: string;
  readAt: string | null;
  system: boolean;
  createdAt: string;
}

export default function BookingChat() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId ?? "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const data = await apiFetch<{ messages: Message[] }>(`/bookings/${bookingId}/messages`);
      setMessages(data.messages ?? []);
    } catch {
      setMessages([]);
    }
  }

  useEffect(() => { load(); }, [bookingId]);
  useEffect(() => {
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [bookingId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const msg = await apiFetch<Message>(`/bookings/${bookingId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: body.trim() }),
      });
      setMessages([...messages, msg]);
      setBody("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
        <button onClick={() => setLocation("/profile")} aria-label="Volver" className="rounded-full p-2 hover:bg-muted">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-semibold">Mensajes · Reserva #{bookingId}</h1>
          <p className="text-xs text-muted-foreground">Mantén la conversación en Rivones para tu protección</p>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Aún no hay mensajes. Saluda a tu {user?.id ? "contraparte" : "anfitrión"}.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderUserId === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {new Date(m.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 flex items-center gap-2 border-t border-border/60 bg-background/95 px-3 py-2 backdrop-blur">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Escribe un mensaje…"
          maxLength={2000}
          disabled={sending}
        />
        <Button onClick={send} disabled={sending || !body.trim()} size="icon" aria-label="Enviar">
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}
