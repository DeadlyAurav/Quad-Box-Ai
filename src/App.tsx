import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, 
  ArrowUp, 
  ChevronDown, 
  LayoutGrid, 
  Sparkles,
  Terminal,
  Zap,
  Globe,
  Code2,
  BrainCircuit,
  CloudLightning,
  MessageSquare,
  Trash2,
  X,
  Menu,
  Pin,
  Edit2,
  Check,
  Copy,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Model definitions - Using stable Groq IDs
const MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Obo Pro', icon: BrainCircuit, description: 'Advanced reasoning and complex logic' },
  { id: 'llama-3.3-70b-versatile', name: 'Heavenly !', icon: CloudLightning, description: 'Powerful and versatile' },
  { id: 'llama-3.1-8b-instant', name: 'Box Fire', icon: Zap, description: 'Fast and efficient for daily tasks' },
];

type Message = {
  role: 'user' | 'assistant';
  content: string;
  id: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  timestamp: number;
  pinned?: boolean;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      id: Date.now().toString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    const initialBotMessage: Message = {
      role: 'assistant',
      content: '',
      id: botMessageId,
    };
    setMessages(prev => [...prev, initialBotMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          model: selectedModel.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          
          const dataStr = trimmedLine.slice(6).trim();
          if (dataStr === '[DONE]') break;
          
          try {
            const data = JSON.parse(dataStr);
            if (data.text) {
              fullContent += data.text;
              setMessages(prev => {
                const updated = prev.map(m => 
                  m.id === botMessageId ? { ...m, content: fullContent } : m
                );
                return updated;
              });
            }
          } catch (e) {
            console.error('Error parsing JSON chunk:', e);
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(m => 
        m.id === botMessageId ? { ...m, content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.` } : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex h-screen bg-[#0e0e0e] font-sans selection:bg-white/20 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            <h1 className="text-xl font-bold tracking-tighter text-white/90">Quad Box</h1>
          </div>

          <button 
            onClick={handleNewChat}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all pointer-events-auto backdrop-blur-md"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New chat</span>
          </button>
        </header>

        {/* Main Chat Area */}
        <main className="flex-1 overflow-y-auto px-6 pt-32 pb-48">
          <div className="max-w-3xl mx-auto space-y-12">
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4 pt-20"
              >
                <h1 className="text-4xl font-semibold tracking-tight text-white">Quad Box</h1>
                <p className="text-white/40 text-lg">Create your Dream</p>
              </motion.div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col",
                    message.role === 'user' ? "items-end" : "items-start"
                  )}
                >
                  {message.role === 'user' ? (
                    <div className="max-w-[80%] px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/90">
                      {message.content}
                    </div>
                  ) : (
                    <div className="w-full group/msg relative">
                      {message.content === '' && isLoading ? (
                        <div className="flex gap-1.5 p-2">
                          <motion.div 
                            animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.1 }}
                            className="w-2 h-2 bg-white rounded-full"
                          />
                          <motion.div 
                            animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.1, delay: 0.15 }}
                            className="w-2 h-2 bg-white rounded-full"
                          />
                          <motion.div 
                            animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.1, delay: 0.3 }}
                            className="w-2 h-2 bg-white rounded-full"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="markdown-body text-white/90">
                            <Markdown>{message.content}</Markdown>
                          </div>
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className="absolute top-0 right-0 p-2 opacity-0 group-hover/msg:opacity-100 transition-all text-white/40 hover:text-white"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e] to-transparent">
          <div className="max-w-3xl mx-auto relative">
            <div className="relative bg-[#1e1e1e] border border-white/10 rounded-2xl p-4 shadow-2xl transition-all focus-within:border-white/20">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Create your Dream"
                className="w-full bg-transparent border-none outline-none text-white text-lg placeholder:text-white/20 resize-none min-h-[60px] max-h-[200px]"
                rows={1}
              />
              <div className="flex items-center justify-between mt-2">
                {/* Model Selection Tool */}
                <div className="relative">
                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 w-64 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
                      >
                        <div className="p-2 space-y-1">
                          {MODELS.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => {
                                setSelectedModel(model);
                                setIsMenuOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group",
                                selectedModel.id === model.id ? "bg-white/10 text-white" : "hover:bg-white/5 text-white/60"
                              )}
                            >
                              <model.icon className={cn("w-5 h-5", selectedModel.id === model.id ? "text-white" : "text-white/40 group-hover:text-white/60")} />
                              <div>
                                <p className="text-sm font-medium">{model.name}</p>
                                <p className="text-[10px] opacity-50">{model.description}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-white/60 hover:text-white/80"
                  >
                    <selectedModel.icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{selectedModel.name}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isMenuOpen && "rotate-180")} />
                  </button>
                </div>

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    input.trim() && !isLoading 
                      ? "bg-white text-black hover:scale-105 active:scale-95" 
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  )}
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
