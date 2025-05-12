'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus } from 'lucide-react';
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
  const router = useRouter();

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
    
    // Load chat history
    const loadHistory = async () => {
      try {
        const response = await fetch('/api/chat/history');
        const data = await response.json();
        // Ensure data is an array before setting messages
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          console.error('Expected array from chat history API, got:', data);
          setMessages([]);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        setMessages([]);
      }
    };
    loadHistory();
  }, [router]);

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
        }),
      });

      if (!response.ok) throw new Error('API request failed');
      
      const data = await response.json();
      setMessages([...newMessages, { content: data.message, role: 'assistant' }]);
    } catch (error) {
      console.error('Chat error:', error);
      alert('Failed to send message');
    } finally {
      setIsTyping(false);
      setIsLoading(false);
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
        });
        
        if (response.ok) {
          setMessages([]);
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
  };

  const openNewChatWindow = () => {
    window.open('/', '_blank');
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-pink-600">DeepSeek Chat</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={clearChat}
            disabled={isLoading || messages.length === 0}
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={openNewChatWindow}
            title="Open in new window"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center border-b mb-4">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                Chat {tab.replace('chat', '')}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={addNewChat}
            className="ml-2"
          >
            <Plus className="h-4 w-4 mr-1" /> New Chat
          </Button>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="m-0">
            <Card className="flex-1 mb-4 border border-pink-200">
              <ScrollArea className="h-[60vh] p-4">
                {!Array.isArray(messages) || messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <p className="text-center">
                      Hi there! I'm your AI companion. Start a conversation!<br/>
                      I'm here to chat with you. 💕
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div 
                        key={i}
                        className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.role === 'assistant' && (
                          <Avatar className="h-8 w-8 bg-pink-500">
                            <span className="text-xs font-bold">AI</span>
                          </Avatar>
                        )}
                        <div 
                          className={`p-3 rounded-lg max-w-[80%] ${
                            msg.role === 'user' 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-pink-100 text-gray-800 rounded-tl-none'
                          }`}
                        >
                          <div className="prose-sm max-w-none break-words markdown-content">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                        {msg.role === 'user' && (
                          <Avatar className="h-8 w-8 bg-gray-700">
                            <span className="text-xs font-bold">You</span>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex items-start gap-3 justify-start">
                        <Avatar className="h-8 w-8 bg-pink-500">
                          <span className="text-xs font-bold">AI</span>
                        </Avatar>
                        <div className="bg-pink-100 p-3 rounded-lg rounded-tl-none">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="h-2 w-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="h-2 w-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
      </Tabs>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border border-pink-200 rounded"
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <Button 
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-pink-500 hover:bg-pink-600"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
