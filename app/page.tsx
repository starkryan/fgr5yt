'use client';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
}

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('chat1');
  const [tabs, setTabs] = useState(['chat1']);
  const [memoryPoints, setMemoryPoints] = useState<string[]>([]);
  const [showMemory, setShowMemory] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
    
    // Reset messages when changing tabs
    setMessages([]);
    
    // Load chat history
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/chat/history?chatId=${activeTab}`);
        const data = await response.json();
        // Ensure data is an array before setting messages
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
          if (data.memory && Array.isArray(data.memory)) {
            setMemoryPoints(data.memory);
          } else {
            // Set empty memory for new tabs
            setMemoryPoints([]);
          }
        } else {
          console.error('Expected array from chat history API, got:', data);
          setMessages([]);
          // Set empty memory for new conversations
          setMemoryPoints([]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setMessages([]);
        // Set empty memory when error occurs
        setMemoryPoints([]);
      }
    };
    loadHistory();
  }, [router, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const newMessages = [...messages, { content: input, role: 'user' } as const];
    setMessages(newMessages);
    setInput('');
    
    // Show typing indicator
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          chatId: activeTab // Pass the active tab ID to ensure chat history is tab-specific
        }),
      });

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      
      if (data.error) {
        // If there's an error in the response, show the error message or a fallback
        setMessages([...newMessages, { 
          content: data.message || "I'm sorry, I couldn't process that request. Please try again or modify your message.", 
          role: 'assistant' 
        }]);
      } else {
        setMessages([...newMessages, { content: data.message, role: 'assistant' }]);
        
        // Update memory points if available
        if (data.memory && Array.isArray(data.memory)) {
          setMemoryPoints(data.memory);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Keep the user's message in the conversation and add an error message
      setMessages([...newMessages, { 
        content: "I'm sorry, I couldn't process that request. Please try again or modify your message.", 
        role: 'assistant' 
      }]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
      // Refocus the input to prevent keyboard from hiding on mobile
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const clearChat = async () => {
    if (window.confirm('Are you sure you want to clear this chat?')) {
      try {
        setIsLoading(true);
        const response = await fetch('/api/chat/clear', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: activeTab
          }),
        });
        
        if (response.ok) {
          setMessages([]);
          setMemoryPoints([]);
        } else {
          console.error('Failed to clear chat');
        }
      } catch (error) {
        console.error('Error clearing chat:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const addNewChat = () => {
    const newTabId = `chat${tabs.length + 1}`;
    setTabs([...tabs, newTabId]);
    setActiveTab(newTabId);
    setMessages([]);
    // Reset memory completely for new chats
    setMemoryPoints([]);
  };

  const openNewChatWindow = () => {
    window.open('/', '_blank');
  };

  // This function is kept but will never actually show memory
  const toggleMemory = () => {
    // No-op: we never want to show memory
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto px-2 sm:px-4 relative">
      <header className="flex justify-between items-center py-4 px-2">
        <h1 className="text-xl sm:text-2xl font-bold text-pink-600">DeepSeek Chat <span className="text-sm">💕</span></h1>
        <div className="flex gap-1 sm:gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={clearChat}
            disabled={isLoading || messages.length === 0}
            title="Clear chat"
            className="w-8 h-8 sm:w-10 sm:h-10"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={openNewChatWindow}
            title="Open in new window"
            className="w-8 h-8 sm:w-10 sm:h-10"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={handleLogout}>Logout</Button>
        </div>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
        <div className="flex items-center border-b mb-2 sm:mb-4 overflow-x-auto">
          <TabsList className="h-8 sm:h-10">
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="text-xs sm:text-sm">
                Chat {tab.replace('chat', '')}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={addNewChat}
            className="ml-2 h-6 sm:h-8 text-xs sm:text-sm whitespace-nowrap"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          
          {tabs.map((tab) => (
            <TabsContent key={tab} value={tab} className="m-0 flex-1 flex flex-col h-full">
              <Card className="flex-1 border border-pink-200 overflow-hidden flex flex-col mb-16 sm:mb-20 rounded-2xl shadow-md">
                <ScrollArea className="flex-1 p-2 sm:p-4">
                  {!Array.isArray(messages) || messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <p className="text-center text-base sm:text-lg">
                        Hi there! I'm your AI companion. Start a conversation!<br/>
                        I'm here to chat with you. 💕
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, i) => (
                        <div 
                          key={i}
                          className={`flex items-start gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.role === 'assistant' && (
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 bg-pink-500 shadow-sm">
                               <span className="text-[10px] sm:text-xs font-bold">AI</span>
                            </Avatar>
                          )}
                          <div 
                            className={`p-2 sm:p-3 rounded-2xl max-w-[85%] sm:max-w-[80%] ${
                              msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                                : 'bg-pink-100 text-gray-800 rounded-tl-none shadow-sm'
                            }`}
                          >
                            <div className="prose-sm max-w-none break-words markdown-content text-sm sm:text-base">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          </div>
                          {msg.role === 'user' && (
                            <Avatar className="h-6 w-6 sm:h-8 sm:w-8 bg-gray-700 shadow-sm">
                               <span className="text-[10px] sm:text-xs font-bold">You</span>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      
                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex items-start gap-2 sm:gap-3 justify-start">
                          <Avatar className="h-6 w-6 sm:h-8 sm:w-8 bg-pink-500 shadow-sm">
                             <span className="text-[10px] sm:text-xs font-bold">AI</span>
                          </Avatar>
                          <div className="bg-pink-100 p-2 sm:p-3 rounded-2xl rounded-tl-none shadow-sm">
                            <div className="flex space-x-1">
                              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </TabsContent>
          ))}
        </div>
      </Tabs>
      
      <form onSubmit={handleSubmit} className="fixed bottom-0 left-0 right-0 flex gap-2 bg-white p-2 sm:p-4 border-t border-gray-200 max-w-4xl mx-auto">
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border border-pink-200 rounded-full text-sm sm:text-base shadow-sm focus:ring-2 focus:ring-pink-300"
          placeholder="Type your message... 💕"
          disabled={isLoading}
        />
        <Button 
          type="submit"
          disabled={isLoading}
          className="px-4 sm:px-6 py-2 bg-pink-500 hover:bg-pink-600 text-xs sm:text-sm whitespace-nowrap rounded-full shadow-sm transition-all"
        >
          {isLoading ? 'Sending...' : 'Send 💕'}
        </Button>
      </form>
    </div>
  );
}
