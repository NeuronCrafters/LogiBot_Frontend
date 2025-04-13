interface ButtonQuestionsProps {
  buttons: { title: string; payload: string }[];
  onClick: (payload: string) => void;
}

export function ButtonQuestions({ buttons, onClick }: ButtonQuestionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((btn, idx) => (
        <button
          key={idx}
          onClick={() => onClick(btn.payload)}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          {btn.title}
        </button>
      ))}
    </div>
  );
}
