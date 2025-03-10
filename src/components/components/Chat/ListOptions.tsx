interface ListOptionsProps {
  options: string[];
  onOptionSelected: (option: string) => void;
}

export const ListOptions = ({ options, onOptionSelected }: ListOptionsProps) => {
  return (
    <div className="flex flex-col space-y-2">
      {options.map((option) => (
        <button
          key={option}
          className="bg-blue-800 text-gray-200 py-2 px-4 rounded-full"
          onClick={() => onOptionSelected(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
};