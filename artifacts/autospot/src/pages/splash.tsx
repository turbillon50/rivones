import { motion } from "framer-motion";

export default function Splash() {
  return (
    <div className="min-h-[100dvh] bg-[#0f1629] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,212,255,0.08)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,_rgba(100,140,200,0.06)_0%,_transparent_50%)]" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <img
            src="/rivones-logo-nobg.png"
            alt="Rivones"
            className="h-28 w-auto drop-shadow-[0_0_40px_rgba(0,212,255,0.15)]"
          />
        </motion.div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="w-32 h-[2px] mb-5 rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, #00d4ff, transparent)",
          }}
        />

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-[#7a8ba8] mt-1 font-medium tracking-[0.35em] uppercase text-[11px]"
        >
          Renta autos en todo México
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 2, delay: 1, repeat: Infinity }}
          className="mt-8 w-6 h-6 rounded-full border border-[#00d4ff]/30"
        />
      </motion.div>
    </div>
  );
}
