import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">HireMind AI</span>
          <span>•</span>
          <span>Multi-Domain Career Platform</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Deterministic Matching V4.1</span>
          <span>•</span>
          <span>Hybrid Multi-Agent</span>
        </div>
      </div>
    </footer>
  );
}
