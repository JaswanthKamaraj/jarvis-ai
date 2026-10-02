"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuizProps {
  quiz: {
    quizTitle: string;
    questions: {
      questionText: string;
      options: string[];
      correctAnswerIndex: number;
      explanation: string;
    }[];
  };
}

export function InteractiveQuiz({ quiz }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    if (index === currentQuestion.correctAnswerIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-primary shadow-[0_0_30px_rgba(168,85,247,0.3)]">
          <span className="text-4xl font-bold text-primary">{Math.round((score / quiz.questions.length) * 100)}%</span>
        </div>
        <h2 className="text-2xl font-bold">Quiz Completed!</h2>
        <p className="text-muted-foreground">You scored {score} out of {quiz.questions.length}.</p>
        <Button onClick={() => {
          setCurrentQuestionIndex(0);
          setScore(0);
          setIsFinished(false);
          setIsAnswered(false);
          setSelectedOption(null);
        }}>Retry Quiz</Button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 p-2">
      <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
        <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
        <span>Score: {score}</span>
      </div>
      
      <h3 className="text-xl font-semibold leading-tight">{currentQuestion.questionText}</h3>
      
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = isAnswered && index === currentQuestion.correctAnswerIndex;
            const isWrong = isAnswered && isSelected && index !== currentQuestion.correctAnswerIndex;
            
            return (
              <motion.div
                key={index}
                whileHover={!isAnswered ? { scale: 1.01 } : {}}
                whileTap={!isAnswered ? { scale: 0.99 } : {}}
              >
                <Card 
                  onClick={() => handleSelectOption(index)}
                  className={`p-4 cursor-pointer border transition-all duration-300 flex justify-between items-center ${
                    !isAnswered ? 'hover:border-primary hover:bg-primary/5' : 
                    isCorrect ? 'bg-green-500/20 border-green-500/50' : 
                    isWrong ? 'bg-red-500/20 border-red-500/50' : 
                    'opacity-50 border-border/50'
                  }`}
                >
                  <span>{option}</span>
                  {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {isWrong && <XCircle className="w-5 h-5 text-red-500" />}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {isAnswered && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 rounded-lg bg-muted border border-border/50 flex flex-col gap-4"
        >
          <div className="text-sm">
            <span className="font-semibold text-primary">Explanation:</span> {currentQuestion.explanation}
          </div>
          <Button className="self-end" onClick={handleNext}>
            {currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
