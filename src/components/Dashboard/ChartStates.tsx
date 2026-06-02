import * as React from 'react';

interface ChartStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ChartLoader = ({ text = "Carregando dados..." }: { text?: string }) => (
  <div className="flex justify-center items-center w-full h-[250px] text-center text-white/70">
    <div className="flex flex-col items-center">
      <div className="mb-3 w-10 h-10 rounded-full animate-pulse bg-indigo-600/30" />
      <p>{text}</p>
    </div>
  </div>
);

export const ChartError = ({ message, onRetry }: ChartStateProps) => (
  <div className="flex justify-center items-center w-full h-[250px] text-center text-white/70">
    <div className="flex flex-col items-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p>{message || "Erro ao carregar dados."}</p>
      {onRetry && <button onClick={onRetry} className="mt-3 text-xs text-indigo-400 transition-colors hover:text-indigo-300">Tentar novamente</button>}
    </div>
  </div>
);

export const NoData = ({ onRetry, children }: ChartStateProps & { children?: React.ReactNode }) => (
  <div className="flex justify-center items-center w-full h-[250px] text-center text-white/70">
    <div className="flex flex-col items-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>

      {children ? children : <p>Nenhum dado disponível para a seleção atual.</p>}
      {onRetry && <button onClick={onRetry} className="mt-3 text-xs text-indigo-400 transition-colors hover:text-indigo-300">Tentar novamente</button>}
    </div>
  </div>
);