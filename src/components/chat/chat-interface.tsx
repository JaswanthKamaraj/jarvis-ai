"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Paperclip, Send, BrainCircuit, Sparkles, BookOpen, Layers, Crosshair, User, Download, CreditCard, CheckSquare, Loader2, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { marked } from "marked";
import { Flashcard } from "@/components/ui/flashcard";
import { InteractiveQuiz } from "@/components/ui/quiz";
import { extractPDFText } from "@/app/actions/pdf";

export function ChatInterface() {
  const [activeMode, setActiveMode] = useState("full");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isFlashcardOpen, setIsFlashcardOpen] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [flashcards, setFlashcards] = useState<{question: string, answer: string}[]>([]);
  
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizData, setQuizData] = useState<any>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat({
    api: "/api/chat",
    body: {
      studyMode: activeMode,
    }
  });

  const studyModes = [
    { id: "full", label: "Full Notes", icon: <Layers className="w-4 h-4" /> },
    { id: "revision", label: "Quick Revision", icon: <Sparkles className="w-4 h-4" /> },
    { id: "eli5", label: "Explain Like I'm 5", icon: <BrainCircuit className="w-4 h-4" /> },
    { id: "exam", label: "Exam Prep", icon: <BookOpen className="w-4 h-4" /> },
    { id: "flashcards", label: "Flashcards", icon: <CreditCard className="w-4 h-4" /> },
    { id: "quiz", label: "Quiz Me", icon: <CheckSquare className="w-4 h-4" /> },
  ];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    let extractedText = "";

    try {
      if (file.type === "application/pdf") {
        const formData = new FormData();
        formData.append("file", file);
        extractedText = await extractPDFText(formData);
      } else {
        extractedText = await file.text();
      }
      
      // Inject the text directly into the chat input
      setInput(input + `\n[Uploaded Document: ${file.name}]\n` + extractedText.substring(0, 15000));
    } catch (err) {
      console.error("File upload failed", err);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!input || !input.trim()) {
      e.preventDefault();
      return;
    }

    if (activeMode === "flashcards") {
      e.preventDefault();
      setIsFlashcardOpen(true);
      setIsGeneratingCards(true);
      setFlashcards([]);
      
      try {
        const res = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: input })
        });
        const data = await res.json();
        setFlashcards(data.flashcards);
      } catch (err) {
        console.error(err);
      } finally {
        setIsGeneratingCards(false);
        setInput(""); // clear input
      }
    } else if (activeMode === "quiz") {
      e.preventDefault();
      setIsQuizOpen(true);
      setIsGeneratingQuiz(true);
      setQuizData(null);
      
      try {
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: input })
        });
        const data = await res.json();
        setQuizData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsGeneratingQuiz(false);
        setInput(""); // clear input
      }
    } else {
      // Normal chat submission handled strictly by Vercel AI SDK
      handleSubmit(e);
    }
  };

  const exportToMarkdown = (content: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rog-ai-study-notes-${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSpeech = (text: string, id: string) => {
    if (isSpeaking === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
    } else {
      window.speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, "")); // Strip markdown
      utterance.onend = () => setIsSpeaking(null);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(id);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-card/50 relative">
      {/* Top Bar Area */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-border/50 bg-background/50 backdrop-blur-md z-10">
        <h1 className="font-semibold text-lg flex items-center gap-2">
          <span className="text-primary"><Crosshair className="w-5 h-5"/></span>
          ROG AI Session
        </h1>
        <div className="flex gap-2 text-sm text-muted-foreground">
          {messages.length > 0 && `${messages.length} messages`}
        </div>
      </header>

      {/* Main Chat Area */}
      <ScrollArea className="flex-1 p-4 md:p-8" ref={scrollRef}>
        <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-32 pt-4">
          
          {messages.length === 0 ? (
            /* Empty State Hero */
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center text-center mt-10 md:mt-20 space-y-6"
            >
              <div className="h-20 w-20 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                <Crosshair className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">What are we learning today?</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Paste a syllabus, upload notes, or enter a topic. ROG AI will instantly generate comprehensive, exam-ready study material.
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 w-full max-w-3xl">
                {studyModes.map(mode => (
                  <Button 
                    key={mode.id}
                    variant={activeMode === mode.id ? "default" : "outline"}
                    className={`h-auto py-3 flex flex-col gap-2 items-center justify-center transition-all ${activeMode === mode.id ? 'shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'hover:border-primary/50 hover:bg-primary/5'}`}
                    onClick={() => setActiveMode(mode.id)}
                  >
                    {mode.icon}
                    <span className="text-xs">{mode.label}</span>
                  </Button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Chat Messages */
            <div className="flex flex-col gap-6">
              {messages.map((m) => (
                <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role !== 'user' && (
                    <Avatar className="h-8 w-8 border border-primary/20 bg-primary/10">
                      <AvatarFallback className="bg-transparent text-primary"><Crosshair className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`px-4 py-3 rounded-2xl max-w-[85%] relative group ${
                    m.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-[0_4px_15px_rgba(168,85,247,0.2)]' 
                      : 'bg-muted/50 border border-border/50 rounded-tl-sm'
                  }`}>
                    {/* Render raw text for user, render markdown for AI */}
                    {m.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <>
                        <div className="absolute -right-20 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-primary h-8 w-8"
                            onClick={() => exportToMarkdown(m.content)}
                            title="Download as Markdown"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-primary h-8 w-8"
                            onClick={() => toggleSpeech(m.content, m.id)}
                            title="Read Aloud"
                          >
                            {isSpeaking === m.id ? <VolumeX className="w-4 h-4 text-primary animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                          </Button>
                        </div>
                        <div 
                          className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-border/50" 
                          dangerouslySetInnerHTML={{ __html: marked.parse(m.content) as string }} 
                        />
                      </>
                    )}
                  </div>
                  
                  {m.role === 'user' && (
                    <Avatar className="h-8 w-8 bg-secondary">
                      <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <Avatar className="h-8 w-8 border border-primary/20 bg-primary/10">
                    <AvatarFallback className="bg-transparent text-primary"><Crosshair className="w-4 h-4 animate-spin" /></AvatarFallback>
                  </Avatar>
                  <div className="px-4 py-3 rounded-2xl bg-muted/50 border border-border/50 rounded-tl-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-75"></span>
                    <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 px-4 md:px-8">
        <form onSubmit={handleCustomSubmit} className="max-w-4xl mx-auto relative group">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".pdf,.txt,.md,.csv" 
            onChange={handleFileUpload}
          />
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded-xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-end gap-2 bg-background border border-border/60 rounded-xl shadow-lg p-2 focus-within:border-primary/50 transition-colors">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 shrink-0 text-muted-foreground hover:text-primary mb-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </Button>
            
            <Textarea 
              placeholder={isUploading ? "Reading document..." : "Ask ROG AI to explain a topic..."}
              disabled={isUploading}
              className="min-h-[52px] max-h-72 w-full resize-none border-0 shadow-none focus-visible:ring-0 text-base py-3 bg-transparent"
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
            
            <Button 
              type="submit"
              disabled={!input || !input.trim() || isLoading}
              size="icon" 
              className={`h-10 w-10 shrink-0 mb-1 rounded-lg transition-all ${(input && input.trim()) && !isLoading ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-muted text-muted-foreground'}`}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center mt-2 text-xs text-muted-foreground">
            ROG AI can make mistakes. Consider verifying important information.
          </div>
        </form>
      </div>

      <Dialog open={isFlashcardOpen} onOpenChange={setIsFlashcardOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-primary" /> Flashcards
            </DialogTitle>
            <DialogDescription>
              Test your knowledge. Click on any card to flip it and reveal the answer.
            </DialogDescription>
          </DialogHeader>

          {isGeneratingCards ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">ROG AI is generating your flashcards...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
              {flashcards.map((fc, i) => (
                <Flashcard key={i} question={fc.question} answer={fc.answer} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isQuizOpen} onOpenChange={setIsQuizOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-primary" /> {quizData ? quizData.quizTitle : "Generating Quiz..."}
            </DialogTitle>
          </DialogHeader>

          {isGeneratingQuiz ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">ROG AI is analyzing the topic and crafting questions...</p>
            </div>
          ) : quizData ? (
            <InteractiveQuiz quiz={quizData} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
