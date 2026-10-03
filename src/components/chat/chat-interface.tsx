"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Paperclip, Send, BrainCircuit, Sparkles, BookOpen, Layers, Crosshair, User, Download, CreditCard, CheckSquare, Loader2, Volume2, VolumeX, Copy, ThumbsUp, ThumbsDown, StopCircle, Pencil, Mic, MicOff, Headphones } from "lucide-react";
import { motion } from "framer-motion";
import { marked } from "marked";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css"; // Ensure math renders correctly
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
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
  
  const [messages, setMessages] = useState<{ id: string, role: string, content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const isVoiceModeRef = useRef(false);
  const inputRef = useRef("");
  const submitMessageRef = useRef<(() => void) | null>(null);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        
        if (voices.length > 0 && !selectedVoiceURI) {
          const savedURI = localStorage.getItem("jarvisVoiceURI");
          if (savedURI && voices.find(v => v.voiceURI === savedURI)) {
            setSelectedVoiceURI(savedURI);
            return;
          }
          
          const markVoice = voices.find(v => v.name.includes("Mark"));
          const jarvisVoice = markVoice || voices.find(v => 
            v.name.includes("UK English Male") || 
            (v.lang.includes("en-GB") && v.name.toLowerCase().includes("male"))
          ) || voices.find(v => v.lang.includes("en-GB")) || voices[0];
          
          if (jarvisVoice) {
            setSelectedVoiceURI(jarvisVoice.voiceURI);
          }
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceURI]);

  // Save selected voice to local storage
  useEffect(() => {
    if (selectedVoiceURI && typeof window !== "undefined") {
      localStorage.setItem("jarvisVoiceURI", selectedVoiceURI);
    }
  }, [selectedVoiceURI]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setInput(currentTranscript);
          inputRef.current = currentTranscript;
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          // Auto-restart if in voice mode and error is no-speech
          if (isVoiceModeRef.current && event.error === 'no-speech') {
            try { recognitionRef.current.start(); } catch(e) {}
          }
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
          
          if (isVoiceModeRef.current) {
            if (inputRef.current.trim()) {
              // Submit the message automatically
              if (submitMessageRef.current) submitMessageRef.current();
            } else {
              // Restart listening if they didn't say anything
              try {
                recognitionRef.current.start();
                setIsListening(true);
              } catch(e) {}
            }
          }
        };
      }
    }
  }, []);

  const toggleVoiceMode = () => {
    if (isVoiceMode) {
      setIsVoiceMode(false);
      isVoiceModeRef.current = false;
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        alert("Speech recognition is not supported in your browser. Try Chrome or Edge.");
        return;
      }
      setIsVoiceMode(true);
      isVoiceModeRef.current = true;
      setInput("");
      inputRef.current = "";
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {
        console.error(e);
      }
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Try using Chrome or Edge.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput(""); 
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {
        console.error(e);
      }
    }
  };

  const processChatSequence = async (messagesToSubmit: typeof messages) => {
    setIsLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    const assistantMessageId = String(Date.now() + 1);
    setMessages(prev => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesToSubmit, mode: activeMode }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(new Error(errorData.error || "Failed to fetch response"));
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      let finalResponseText = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          finalResponseText += chunk;
          
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: msg.content + chunk } 
              : msg
          ));
        }
      }
      
      // If voice mode is active, automatically speak the response
      if (isVoiceModeRef.current && finalResponseText.trim()) {
        toggleSpeech(finalResponseText, assistantMessageId);
      }
    } catch (err: any) {
      console.error("Chat API Error:", err);
      if (err.name === "AbortError") {
        return;
      }
      setError(err);
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (messageId: string) => {
    if (!editValue || !editValue.trim() || isLoading) return;
    const newContent = editValue;
    setEditingMessageId(null);
    
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;
    
    const newMessages = [
      ...messages.slice(0, msgIndex),
      { ...messages[msgIndex], content: newContent }
    ];
    setMessages(newMessages);
    
    if (activeMode === "flashcards") {
      setIsFlashcardOpen(true);
      setIsGeneratingCards(true);
      setFlashcards([]);
      try {
        const res = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: newContent })
        });
        const data = await res.json();
        setFlashcards(data.flashcards);
      } catch (err) {
        console.error(err);
      } finally {
        setIsGeneratingCards(false);
      }
    } else if (activeMode === "quiz") {
      setIsQuizOpen(true);
      setIsGeneratingQuiz(true);
      setQuizData(null);
      try {
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: newContent })
        });
        const data = await res.json();
        setQuizData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsGeneratingQuiz(false);
      }
    } else {
      await processChatSequence(newMessages);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    inputRef.current = e.target.value;
  };

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
  }, [messages, isLoading]);

  // Clear old localStorage keys
  useEffect(() => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().includes('rog')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      // Ignore errors if localStorage is not accessible
    }
  }, []);

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
      
      setInput(input + `\n[Uploaded Document: ${file.name}]\n` + extractedText.substring(0, 15000));
    } catch (err) {
      console.error("File upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const submitMessage = async () => {
    if (!input || !input.trim() || isLoading) return;
    const currentInput = input;
    setInput("");
    inputRef.current = "";
    setError(null);

    // Easter Egg: Hey JARVIS
    const normalizedInput = currentInput.toLowerCase().trim().replace(/[.,!?'"]/g, "");
    if (normalizedInput === "hey jarvis" || normalizedInput === "hi jarvis" || normalizedInput === "hello jarvis") {
      const userMessage = { id: String(Date.now()), role: "user", content: currentInput };
      const assistantMessageId = String(Date.now() + 1);
      const assistantMessage = { id: assistantMessageId, role: "assistant", content: "Hello boss, JARVIS is online. How can I assist you today?" };
      
      setMessages([...messages, userMessage, assistantMessage]);
      
      // Auto-speak the greeting
      setTimeout(() => {
        toggleSpeech("Hello boss, JARVIS is online.", assistantMessageId);
      }, 100);
      return;
    }

    if (activeMode === "flashcards") {
      setIsFlashcardOpen(true);
      setIsGeneratingCards(true);
      setFlashcards([]);
      try {
        const res = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: currentInput })
        });
        const data = await res.json();
        setFlashcards(data.flashcards);
      } catch (err) {
        console.error(err);
      } finally {
        setIsGeneratingCards(false);
      }
    } else if (activeMode === "quiz") {
      setIsQuizOpen(true);
      setIsGeneratingQuiz(true);
      setQuizData(null);
      try {
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: currentInput })
        });
        const data = await res.json();
        setQuizData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsGeneratingQuiz(false);
      }
    } else {
      // Normal chat submission manually implemented
      const userMessage = { id: String(Date.now()), role: "user", content: currentInput };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      await processChatSequence(newMessages);
    }
  };

  // Keep ref in sync for callbacks
  submitMessageRef.current = submitMessage;

  const handleCustomSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitMessage();
  };

  const exportToMarkdown = (content: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jarvis-ai-study-notes-${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async (messageId: string) => {
    const element = document.getElementById(`msg-content-${messageId}`);
    if (!element) return;
    
    // Create a temporary clone to isolate styling for print
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.width = '800px'; 
    clone.style.padding = '40px';
    clone.style.background = '#0a0a0a';
    clone.style.color = '#ffffff';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, { 
        scale: 2,
        backgroundColor: '#0a0a0a' 
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`jarvis-ai-notes-${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
    } finally {
      document.body.removeChild(clone);
    }
  };

  const toggleSpeech = (text: string, id: string) => {
    if (isSpeaking === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
    } else {
      window.speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, "")); // Strip markdown
      
      const voices = window.speechSynthesis.getVoices();
      const chosenVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
      
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }
      utterance.pitch = 0.9; // Slightly lower pitch for a sophisticated tone
      
      utterance.onend = () => {
        setIsSpeaking(null);
        if (isVoiceModeRef.current) {
          // Auto-restart listening after AI finishes speaking
          try {
            if (recognitionRef.current) {
              recognitionRef.current.start();
              setIsListening(true);
            }
          } catch (e) {}
        }
      };
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(id);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-card/50 relative">
      {/* Top Bar Area */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-border/50 bg-background/50 backdrop-blur-md z-10">
        <h1 className="font-semibold text-lg flex items-center gap-2">
          <span className="text-[#00D4FF] drop-shadow-[0_0_5px_rgba(0,212,255,0.8)]"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></span>
          JARVIS AI Session
        </h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {messages.length > 0 && <span>{messages.length} messages</span>}
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8" ref={scrollRef}>
        <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-32 pt-4">
          
          {messages.length === 0 ? (
            /* Empty State Hero */
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center text-center mt-10 md:mt-20 space-y-6"
            >
              <div className="relative h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-br from-[#0B6FD6]/20 to-transparent border border-[#1E90FF]/40 shadow-[0_0_30px_rgba(30,144,255,0.35)]">
                {isGeneratingCards || isGeneratingQuiz || isLoading ? (
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00D4FF] border-r-[#00D4FF] animate-spin opacity-80" style={{ animationDuration: '2s' }}></div>
                ) : null}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-[#00D4FF] drop-shadow-[0_0_10px_rgba(0,212,255,0.8)]"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight">Hello! I am JARVIS.</h2>
                <div className="text-muted-foreground max-w-2xl mx-auto space-y-2">
                  <p>I am your highly advanced AI study assistant and personal digital butler.</p>
                  <p>My primary objective is to help you learn, prepare for exams, and master complex topics with ease. I can generate comprehensive study materials, flashcards, interactive quizzes, and explain difficult concepts in a way that is easy to understand.</p>
                  <p className="text-foreground font-semibold pt-2">How can I help you on your learning journey today?</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 w-full max-w-3xl">
                {studyModes.map(mode => (
                  <Button 
                    key={mode.id}
                    variant={activeMode === mode.id ? "default" : "outline"}
                    className={`h-auto py-3 flex flex-col gap-2 items-center justify-center transition-all ${activeMode === mode.id ? 'bg-gradient-to-r from-[#0B6FD6] to-[#1E90FF] text-white shadow-[0_0_15px_rgba(30,144,255,0.35)] border-0' : 'hover:border-primary/50 hover:bg-primary/5'}`}
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
                      <AvatarFallback className="bg-transparent"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#00D4FF]"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`px-4 py-3 rounded-2xl max-w-[85%] relative group ${
                    m.role === 'user' 
                      ? 'bg-gradient-to-r from-[#0B6FD6] to-[#1E90FF] text-white rounded-tr-sm shadow-[0_4px_15px_rgba(30,144,255,0.2)]'  
                      : 'bg-muted/50 border border-border/50 rounded-tl-sm'
                  }`}>
                    {/* Render raw text for user, render markdown for AI */}
                    {m.role === 'user' ? (
                      editingMessageId === m.id ? (
                        <div className="flex flex-col gap-2 w-[300px] md:w-[450px]">
                          <Textarea 
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-background/20 text-white border-white/30 focus-visible:ring-white/50 min-h-[100px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => setEditingMessageId(null)}>Cancel</Button>
                            <Button size="sm" className="bg-white text-primary hover:bg-gray-100" onClick={() => handleEditSubmit(m.id)}>Save & Submit</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )
                    ) : (
                      <>
                        <div className="absolute -bottom-10 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-row gap-1 bg-card border border-border/50 rounded-md shadow-lg p-1 z-10">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-primary h-8 w-8"
                            onClick={() => {
                              navigator.clipboard.writeText(m.content);
                              // Could add a tiny toast here in the future
                            }}
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-primary h-8 w-8"
                            title="Helpful response"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-primary h-8 w-8"
                            title="Unhelpful response"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </Button>
                          <div className="w-px h-4 bg-border/50 my-auto mx-1" />
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
                            onClick={() => exportToPDF(m.id)}
                            title="Download as PDF"
                          >
                            <span className="font-bold text-xs">PDF</span>
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
                        <div id={`msg-content-${m.id}`} className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || "");
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={vscDarkPlus as any}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded-md border border-primary/20 my-4 shadow-md shadow-primary/10"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, "")}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className="bg-black/40 text-primary px-1 py-0.5 rounded-sm border border-primary/20 font-mono text-sm" {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {m.role === 'user' && (
                    <div className="flex flex-col items-center gap-1">
                      <Avatar className="h-8 w-8 bg-secondary">
                        <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                      </Avatar>
                      {editingMessageId !== m.id && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setEditingMessageId(m.id);
                            setEditValue(m.content);
                          }}
                          title="Edit message"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <Avatar className="h-8 w-8 border border-primary/20 bg-primary/10">
                    <AvatarFallback className="bg-transparent"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-[#00D4FF] animate-spin"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></AvatarFallback>
                  </Avatar>
                  <div className="px-4 py-3 rounded-2xl bg-muted/50 border border-border/50 rounded-tl-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-75"></span>
                    <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm max-w-[85%]">
                    <strong>Error:</strong> {error.message}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

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
          <div className="absolute -inset-1 bg-gradient-to-r from-[#1E90FF]/30 to-[#00D4FF]/30 rounded-xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-end gap-2 bg-background border border-border/60 rounded-xl shadow-lg p-2 focus-within:border-[#00D4FF]/50 focus-within:shadow-[0_0_15px_rgba(0,212,255,0.25)] transition-colors">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 shrink-0 text-muted-foreground hover:text-primary mb-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Attach File"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className={`h-10 w-10 shrink-0 mb-1 transition-all ${isListening && !isVoiceMode ? 'text-[#00D4FF] bg-[#00D4FF]/10 animate-pulse' : 'text-muted-foreground hover:text-primary'}`}
              onClick={toggleListening}
              title={isListening && !isVoiceMode ? "Stop dictation" : "Dictate (One-time)"}
            >
              <Mic className="w-5 h-5" />
            </Button>

            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              className={`h-10 w-10 shrink-0 mb-1 transition-all ${isVoiceMode ? 'text-white bg-gradient-to-r from-[#0B6FD6] to-[#1E90FF] shadow-[0_0_15px_rgba(30,144,255,0.4)] animate-pulse' : 'text-muted-foreground hover:text-primary border border-transparent hover:border-border/50'}`}
              onClick={toggleVoiceMode}
              title={isVoiceMode ? "End Voice Mode" : "Start Continuous Voice Mode"}
            >
              <Headphones className="w-5 h-5" />
            </Button>
            
            <Textarea 
              placeholder={isUploading ? "Reading document..." : "Ask JARVIS AI to explain a topic..."}
              disabled={isUploading}
              className="min-h-[52px] max-h-72 w-full resize-none border-0 shadow-none focus-visible:ring-0 text-base py-3 bg-transparent"
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitMessage();
                }
              }}
            />
            
            {isLoading ? (
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                  }
                  setIsLoading(false);
                }}
                size="icon" 
                className="h-10 w-10 shrink-0 mb-1 rounded-lg bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:bg-red-600 transition-all"
                title="Stop generating"
              >
                <StopCircle className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                type="button"
                disabled={!input || !input.trim()}
                onClick={(e) => {
                  e.preventDefault();
                  submitMessage();
                }}
                size="icon" 
                className={`h-10 w-10 shrink-0 mb-1 rounded-lg transition-all ${(input && input.trim()) ? 'bg-gradient-to-r from-[#0B6FD6] to-[#1E90FF] text-white shadow-[0_0_15px_rgba(30,144,255,0.4)] hover:from-[#1E90FF] hover:to-[#3AA0FF]' : 'bg-muted text-muted-foreground'}`}
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="text-center mt-2 text-xs text-muted-foreground">
            JARVIS AI can make mistakes. Consider verifying important information.
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
              <p className="text-muted-foreground animate-pulse">JARVIS AI is generating your flashcards...</p>
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
              <p className="text-muted-foreground animate-pulse">JARVIS AI is analyzing the topic and crafting questions...</p>
            </div>
          ) : quizData ? (
            <InteractiveQuiz quiz={quizData} />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Voice Mode Fullscreen Overlay */}
      {isVoiceMode && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className={`relative h-48 w-48 flex items-center justify-center rounded-full bg-gradient-to-br from-[#0B6FD6]/10 to-transparent border border-[#1E90FF]/30 transition-all duration-500 ease-out ${isSpeaking ? 'scale-[1.15] shadow-[0_0_120px_rgba(0,212,255,0.4)]' : isListening ? 'scale-105 shadow-[0_0_80px_rgba(30,144,255,0.3)] animate-pulse' : 'shadow-[0_0_50px_rgba(30,144,255,0.1)]'}`}>
              
              {/* Spinner rings */}
              {(isSpeaking || isLoading || isListening) && (
                <>
                  <div className={`absolute inset-0 rounded-full border-4 border-transparent ${isSpeaking ? 'border-t-[#00D4FF] border-r-[#00D4FF]' : 'border-b-[#1E90FF] border-l-[#1E90FF]'} opacity-80 animate-spin`} style={{ animationDuration: isSpeaking ? '1s' : '2s' }}></div>
                  <div className={`absolute inset-[-10px] rounded-full border-2 border-transparent ${isSpeaking ? 'border-b-[#1E90FF] border-l-[#1E90FF]' : 'border-t-[#00D4FF] border-r-[#00D4FF]'} opacity-40 animate-[spin_3s_linear_infinite_reverse]`}></div>
                </>
              )}
              
              {/* Core Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={`w-24 h-24 text-[#00D4FF] transition-all duration-300 ${isSpeaking ? 'drop-shadow-[0_0_25px_rgba(0,212,255,1)] scale-110' : 'drop-shadow-[0_0_10px_rgba(0,212,255,0.6)]'}`}>
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            
            <div className="mt-20 text-center space-y-4">
              <h2 className="text-2xl font-light text-white tracking-widest uppercase">
                {isSpeaking ? "JARVIS is speaking..." : isLoading ? "Processing..." : isListening ? "Listening..." : "Voice Mode"}
              </h2>
              {/* Live transcript preview */}
              <p className="text-[#8FA6C4] max-w-xl mx-auto h-16 overflow-hidden text-lg italic px-6">
                {!isSpeaking && !isLoading && (input || "...")}
              </p>
            </div>
          </div>
          
          <div className="pb-16 pt-4">
            <Button 
              size="icon"
              variant="outline"
              className="rounded-full h-16 w-16 p-0 bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
              onClick={toggleVoiceMode}
              title="End Voice Mode"
            >
              <MicOff className="w-7 h-7" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
