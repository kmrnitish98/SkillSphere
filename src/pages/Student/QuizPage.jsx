import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const QuizPage = () => {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  // Mock quiz data (in production, fetch from API)
  const quiz = {
    title: 'Module 1 Quiz',
    type: 'quiz',
    passingScore: 2,
    content: [
      { question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], correctAnswer: 'Hyper Text Markup Language' },
      { question: 'Which CSS property is used to change text color?', options: ['font-color', 'text-color', 'color', 'foreground-color'], correctAnswer: 'color' },
      { question: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Creative Style System', 'Computer Style Sheets', 'Colorful Style Sheets'], correctAnswer: 'Cascading Style Sheets' },
    ]
  };

  const handleSelect = (qIdx, option) => {
    setAnswers({ ...answers, [qIdx]: option });
  };

  const handleSubmit = () => {
    let score = 0;
    quiz.content.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) score++;
    });
    const passed = score >= quiz.passingScore;
    setResult({ score, total: quiz.content.length, passed });
    toast(passed ? '🎉 You passed!' : '❌ Try again!');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-green-50 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{quiz.title}</h1>
        <p className="text-sm text-slate-500">Answer all questions. You need {quiz.passingScore}/{quiz.content.length} to pass.</p>
      </div>

      {quiz.content.map((q, idx) => (
        <div key={idx} className="bg-white rounded-2xl p-6 border border-green-50 shadow-sm">
          <p className="font-semibold text-slate-800 mb-4">
            <span className="text-green-600 mr-2">Q{idx + 1}.</span>
            {q.question}
          </p>
          <div className="space-y-2">
            {q.options.map((option, oi) => (
              <button
                key={oi}
                onClick={() => handleSelect(idx, option)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border-2 ${
                  answers[idx] === option
                    ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                    : 'border-slate-100 text-slate-600 hover:border-green-200 hover:bg-green-50/30'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!result && (
        <button onClick={handleSubmit} className="w-full gradient-primary text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all">
          Submit Quiz
        </button>
      )}

      {result && (
        <div className={`rounded-2xl p-6 text-center border-2 ${result.passed ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <div className="text-4xl mb-3">{result.passed ? <FaCheckCircle className="text-green-500 mx-auto" /> : <FaTimesCircle className="text-red-500 mx-auto" />}</div>
          <h3 className="text-xl font-bold text-slate-900">Score: {result.score}/{result.total}</h3>
          <p className="text-sm text-slate-600 mt-1">{result.passed ? 'Congratulations! You passed!' : 'Keep trying, you can do it!'}</p>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
