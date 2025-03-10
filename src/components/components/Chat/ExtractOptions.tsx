interface ExtractOptionsProps {
  text: string;
  onOptionSelected: (option: string) => void;
}

export const ExtractOptions = ({ text, onOptionSelected }: ExtractOptionsProps) => {
  const options = text.match(/\(([a-e])\)([^\(\)]+)/g) || [];

  return (
    <div className="flex flex-col space-y-2">
      {options.map((option) => {
        const [_, key, value] = option.match(/\(([a-e])\)([^\(\)]+)/) || [];
        return (
          <button
            key={key}
            className="bg-blue-800 text-gray-200 py-2 px-4 rounded-full"
            onClick={() => onOptionSelected(key)}
          >
            {key.toUpperCase()}: {value.trim()}
          </button>
        );
      })}
    </div>
  );
};