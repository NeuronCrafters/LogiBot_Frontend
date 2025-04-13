interface ButtonQuestionsProps {
  buttons: {
    title: string;
    onClick: () => void;
  }[];
}

function ButtonQuestions({ buttons }: ButtonQuestionsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {buttons.map((btn, index) => (
        <button
          key={index}
          onClick={btn.onClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {btn.title}
        </button>
      ))}
    </div>
  );
}

export { ButtonQuestions }