import boneco from '@/assets/boneco.svg';
import parte from '@/assets/parte.svg';

export const AnimatedLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <img src={boneco} alt="Ícone SAEL" className="w-48 h-48 mt-14" />
      {/* Orelha esquerda */}
      <img
        src={parte}
        alt="Orelha animada esquerda"
        className="absolute top-4 left-6 w-20 h-16 animate-ear-left"
        style={{
          transformOrigin: 'bottom',
          animation: 'moveEarLeft 1.5s 30'
        }}
      />
      {/* Orelha direita */}
      <img
        src={parte}
        alt="Orelha direita"
        className="absolute top-4 right-6 w-20 h-16 scale-x-[-1]"
      />
      <style>{`
        @keyframes moveEarLeft {
          0% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-15deg);
          }
          75% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        .animate-ear-left {
          animation: moveEarLeft 1.5s ease-in-out 7;
        }
      `}</style>
    </div>
  );
}; 