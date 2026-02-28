'use client';

import { useState } from 'react';

interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface Config {
  theme?: 'day' | 'night';
  difficulty?: number;
  triviaQuestions?: TriviaQuestion[];
}

const DEFAULT_QUESTIONS: TriviaQuestion[] = [
  { question: 'What is the capital of France?', options: ['London', 'Paris', 'Berlin', 'Madrid'], correctIndex: 1 },
  { question: 'Which planet is closest to the Sun?', options: ['Venus', 'Mercury', 'Mars', 'Earth'], correctIndex: 1 },
  { question: 'How many continents are there?', options: ['5', '6', '7', '8'], correctIndex: 2 },
];

export function Trivia({ config, ready = true }: { config: Config; ready?: boolean }) {
  const questions = (config.triviaQuestions ?? DEFAULT_QUESTIONS).filter(
    (q) => q.question && q.options?.length >= 2 && typeof q.correctIndex === 'number'
  );
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  const isDay = config.theme !== 'night';
  const q = questions[index % Math.max(1, questions.length)];
  const isLast = index >= questions.length - 1;

  const handleSelect = (i: number) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    if (i === q.correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (isLast) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const handleReset = () => {
    setIndex(0);
    setScore(0);
    setSelected(null);
    setRevealed(false);
    setFinished(false);
  };

  const bg = isDay ? '#87CEEB' : '#0a0a1a';
  const fg = isDay ? '#1a1a1a' : '#e5e5e5';

  if (!q) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-zinc-400">Trivia — No questions available</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-zinc-400">Trivia — Final score</p>
        <div
          className="w-[400px] min-h-[300px] rounded-lg p-6 flex flex-col items-center justify-center gap-4"
          style={{ background: bg, color: fg }}
        >
          <p className="text-3xl font-bold text-emerald-400">{score} / {questions.length}</p>
          <button onClick={handleReset} className="py-2 px-4 text-sm font-bold uppercase">
            Play again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-zinc-400">
        Trivia — Question {index + 1} of {questions.length} · Score: {score}
      </p>
      <div
        className="w-[400px] min-h-[300px] rounded-lg p-6 flex flex-col gap-4"
        style={{ background: bg, color: fg }}
      >
        <p className="text-lg font-bold">{q.question}</p>
        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correctIndex;
            const isWrong = selected === i && !isCorrect;
            let btnStyle = 'border-white/30 hover:bg-white/10';
            if (revealed) {
              if (isCorrect) btnStyle = 'bg-emerald-500/30 border-emerald-400';
              else if (isWrong) btnStyle = 'bg-red-500/20 border-red-400/30';
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={revealed}
                className={`px-4 py-3 rounded-lg border text-left transition-colors ${btnStyle}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {revealed && (
          <button
            onClick={handleNext}
            className="mt-2 py-2 text-sm font-bold uppercase hover:underline"
          >
            {isLast ? 'See score' : 'Next →'}
          </button>
        )}
      </div>
      <p className="text-sm text-zinc-500">Select the correct answer</p>
    </div>
  );
}
