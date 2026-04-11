import { cn } from "@/lib/utils";

interface JoystickHubProps {
  onTap: () => void;
  isOpen: boolean;
}

export function JoystickHub({ onTap, isOpen }: JoystickHubProps) {
  return (
    <button
      onClick={onTap}
      className="relative -top-5 flex items-center justify-center w-16 h-16 focus:outline-none active:scale-95 transition-transform duration-200"
      aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
    >
      <div className="relative w-[60px] h-[60px] rounded-full">
        <div className="absolute inset-0 rounded-full" style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.18) 70%, rgba(255,255,255,0.05) 100%)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          boxShadow: "0 8px 32px -6px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.2), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 1px rgba(0,0,0,0.1)",
        }} />

        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{
            background: "conic-gradient(from 220deg at 50% 50%, rgba(244,63,94,0.15) 0deg, rgba(251,191,36,0.1) 60deg, rgba(56,189,248,0.12) 120deg, rgba(139,92,246,0.1) 180deg, rgba(52,211,153,0.12) 240deg, rgba(244,63,94,0.08) 300deg, rgba(244,63,94,0.15) 360deg)",
          }} />
        </div>

        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-[50%]" style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
            borderRadius: "999px 999px 60% 60%",
          }} />
        </div>

        <div className="absolute inset-0 rounded-full pointer-events-none" style={{
          background: "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.2) 0%, transparent 45%)",
        }} />

        <div className="absolute inset-[0.5px] rounded-full pointer-events-none" style={{
          border: "0.5px solid rgba(255,255,255,0.25)",
        }} />

        <div className="absolute top-[2px] left-[18%] right-[18%] h-[1px] rounded-full pointer-events-none" style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
        }} />

        <div className="absolute inset-0 flex items-center justify-center z-10">
          <svg
            width="26" height="26" viewBox="0 0 24 24" fill="none"
            className={cn(
              "drop-shadow-lg transition-transform duration-300 ease-out",
              isOpen && "rotate-45"
            )}
          >
            <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none" style={{
          background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
          backgroundSize: "200% 200%",
          animation: "crystalShine 4s ease-in-out infinite",
        }} />
      </div>

      <style>{`
        @keyframes crystalShine {
          0%, 100% { background-position: 200% 200%; }
          50% { background-position: -100% -100%; }
        }
      `}</style>
    </button>
  );
}
