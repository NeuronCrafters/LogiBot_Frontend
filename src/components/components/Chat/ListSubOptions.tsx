interface ListSubOptionsProps {
  subOptions: string[];
  onSubOptionSelected: (subOption: string) => void;
}

export const ListSubOptions = ({ subOptions, onSubOptionSelected }: ListSubOptionsProps) => {
  return (
    <div className="flex flex-col space-y-2">
      {subOptions.map((subOption) => (
        <button
          key={subOption}
          className="bg-blue-800 text-gray-200 py-2 px-4 rounded-full"
          onClick={() => onSubOptionSelected(subOption)}
        >
          {subOption}
        </button>
      ))}
    </div>
  );
};