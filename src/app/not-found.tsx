"use client";

import { motion } from "framer-motion";

export default function NotFound() {
   return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0b1220] text-slate-200">
      <h1 className="text-7xl font-bold tracking-widest mb-2">404</h1>
      <p className="opacity-70 mb-10">
        Você perdeu o ônibus... e essa página também.
      </p>

      <div className="relative w-120 h-85">

        {/* chão */}
        <div className="absolute bottom-8 w-full h-0.5 bg-slate-700" />

        {/* aluno estilizado (SVG mais rico) */}
        <motion.svg
          viewBox="0 0 200 200"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 w-40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* corpo */}
          <ellipse cx="100" cy="140" rx="30" ry="40" fill="#1e293b" />

          {/* cabeça */}
          <circle cx="100" cy="90" r="26" fill="#e2e8f0" />

          {/* braço segurando */}
          <path
            d="M120 130 Q160 120 150 160"
            stroke="#e2e8f0"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />

          {/* braço coçando animado */}
          <motion.path
            d="M80 120 Q50 90 80 80"
            stroke="#e2e8f0"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            animate={{ rotate: [0, 12, 0] }}
            style={{ transformOrigin: "80px 120px" }}
            transition={{ repeat: Infinity, duration: 1 }}
          />

          {/* pernas */}
          <path d="M100 180 L80 200" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
          <path d="M100 180 L120 200" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />

          {/* carteirinha */}
          <rect x="145" y="150" width="30" height="20" rx="5" fill="#38bdf8" />
          <text x="150" y="165" fontSize="12" fill="#0b1220" fontWeight="bold">42</text>

          {/* interrogação */}
          <motion.text
            x="95"
            y="40"
            fontSize="24"
            fill="#facc15"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            ?
          </motion.text>
        </motion.svg>

        {/* ônibus estilo ilustrado */}
        <motion.svg
          viewBox="0 0 200 120"
          className="absolute left-1/2 -translate-x-1/2 w-55"
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: -220, opacity: 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: 20 }}
        >
          {/* corpo ônibus */}
          <rect x="10" y="20" width="160" height="60" rx="16" fill="#0ea5e9" />

          {/* janelas */}
          <rect x="20" y="30" width="30" height="20" rx="6" fill="#0b1220" />
          <rect x="60" y="30" width="30" height="20" rx="6" fill="#0b1220" />
          <rect x="100" y="30" width="30" height="20" rx="6" fill="#0b1220" />

          {/* frente */}
          <rect x="130" y="30" width="25" height="20" rx="6" fill="#0b1220" />

          {/* rodas */}
          <circle cx="50" cy="85" r="10" fill="#0b1220" />
          <circle cx="120" cy="85" r="10" fill="#0b1220" />

          {/* número */}
          <text x="70" y="70" fontSize="20" fill="#e2e8f0" fontWeight="bold">42</text>

          {/* fumaça orgânica */}
          <motion.path
            d="M170 50 C190 40, 200 60, 180 70"
            fill="#94a3b8"
            animate={{ y: [0, -30], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <motion.path
            d="M180 60 C210 50, 210 80, 190 90"
            fill="#94a3b8"
            animate={{ y: [0, -40], opacity: [0.5, 0] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          />
        </motion.svg>
      </div>
    </div>
  );
}