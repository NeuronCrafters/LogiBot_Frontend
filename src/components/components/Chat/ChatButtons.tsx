interface ChatButtonsProps {
  buttons: { title: string; payload: string }[];
  onButtonClick: (payload: string) => void;
}

export const ChatButtons = ({ buttons, onButtonClick }: ChatButtonsProps) => {
  return (
    <div className="flex flex-col space-y-2">
      {buttons.map((button) => (
        <button
          key={button.title}
          className="bg-blue-800 text-gray-200 py-2 px-4 rounded-full"
          onClick={() => onButtonClick(button.payload)}
        >
          {button.title}
        </button>
      ))}
    </div>
  );
};