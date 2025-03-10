interface AskUserLevelProps {
  onLevelSelected: (level: string) => void;
}

export const LevelUser = ({ onLevelSelected }: AskUserLevelProps) => {
  const levels = ["Básico", "Intermediário", "Avançado"];

  return (
    <div className="flex flex-col space-y-2">
      <p className="text-white">Por favor, escolha seu nível de conhecimento:</p>
      {levels.map((level) => (
        <button
          key={level}
          className="bg-blue-800 text-gray-200 py-2 px-4 rounded-full"
          onClick={() => onLevelSelected(level.toLowerCase())}
        >
          {level}
        </button>
      ))}
    </div>
  );
};