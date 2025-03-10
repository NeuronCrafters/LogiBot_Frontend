interface GenerateQuestionsProps {
  questions: string[];
}

export const GenerateQuestions = ({ questions }: GenerateQuestionsProps) => {
  return (
    <div className="flex flex-col space-y-2">
      {questions.map((question, index) => (
        <div key={index} className="text-white">
          {question}
        </div>
      ))}
    </div>
  );
};