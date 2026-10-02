"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface FlashcardProps {
  question: string;
  answer: string;
}

export function Flashcard({ question, answer }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="w-full h-48 cursor-pointer [perspective:1000px]" 
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative [transform-style:preserve-3d]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <Card className="absolute w-full h-full [backface-visibility:hidden] flex items-center justify-center p-6 text-center border-primary/20 bg-card hover:border-primary/50 transition-colors shadow-lg shadow-primary/5">
          <p className="font-semibold text-lg">{question}</p>
          <div className="absolute bottom-3 text-xs text-muted-foreground font-medium">Click to flip</div>
        </Card>
        
        {/* Back */}
        <Card 
          className="absolute w-full h-full [backface-visibility:hidden] flex items-center justify-center p-6 text-center bg-primary/10 border-primary/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
          style={{ transform: "rotateY(180deg)" }}
        >
          <p className="text-foreground">{answer}</p>
        </Card>
      </motion.div>
    </div>
  );
}
