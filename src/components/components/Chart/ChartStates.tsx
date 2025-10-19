import * as React from 'react';

// Define as props base para componentes que podem ter uma função de retry
interface ChartStateProps {
  message?: string;
  onRetry?: () => void;
}

// 1. Loader: Adiciona a prop 'text'
export const ChartLoader = ({ text = "Carregando dados..." }: { text?: string }) => (
  <div className="flex justify-center items-center w-full h-[250px] text-center text-white/70">
    <div className="flex flex-col items-center">
      <div className="mb-3 w-10 h-10 rounded-full animate-pulse bg-indigo-600/30" />
      <p>{text}</p>
    </div>
  </div>
);

// 2. Error: Mantém a prop 'message' e 'onRetry'
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

// 3. NoData: Adiciona a prop 'children'
export const NoData = ({ onRetry, children }: ChartStateProps & { children?: React.ReactNode }) => (
  <div className="flex justify-center items-center w-full h-[250px] text-center text-white/70">
    <div className="flex flex-col items-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-indigo-400/60">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {/* Se children for passado, renderize, senão use o default */}
      {children ? children : <p>Nenhum dado disponível para a seleção atual.</p>}
      {onRetry && <button onClick={onRetry} className="mt-3 text-xs text-indigo-400 transition-colors hover:text-indigo-300">Tentar novamente</button>}
    </div>
  </div>
);