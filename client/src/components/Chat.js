import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Send, Bot, User, Loader } from 'lucide-react';

const Chat = () => {
  const { darkMode } = useTheme();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your trading assistant. I can help you with market analysis, trade execution, and portfolio management. What would you like to know?",
      sender: 'bot',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending user messages and fetching chatbot responses
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage }),
      });

      if (!response.ok) throw new Error('Failed to fetch chatbot response');
      const data = await response.json();

      // Format bot message with trade info if present
      let botText = data.response || "I'm processing your request.";
      if (data.trade_executed) {
        const trade = data.trade_executed.details;
        botText += `\n\nTrade Executed: ${trade.side.toUpperCase()} ${trade.quantity} ${trade.symbol} ${trade.price ? `at $${trade.price.toFixed(2)}` : '(market price)'}`;
      }

      const botMessage = {
        id: Date.now() + 1,
        text: botText,
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const botMessage = {
        id: Date.now() + 1,
        text: "Sorry, I couldn't process your request. Try again later.",
        sender: 'bot',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (text) =>
    text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));

  const suggestedQuestions = [
    "What's the current market sentiment?",
    "Show me ETH price analysis",
    "Help me set up a trading strategy",
    "What are the trending tokens today?"
  ];

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'dark' : ''}`}>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'bot' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
              msg.sender === 'user'
                ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white ml-auto'
                : darkMode
                  ? 'bg-gray-800 text-white border border-gray-700'
                  : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed">{formatMessage(msg.text)}</p>
              <span className="text-xs opacity-70 mt-2 block">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {msg.sender === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white animate-spin" />
            </div>
            <div className={`px-4 py-3 rounded-2xl ${darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200 shadow-sm'}`}>
              <div className="flex items-center space-x-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Try asking:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setInputMessage(q)}
                className={`text-left p-3 rounded-lg border text-sm ${
                  darkMode ? 'border-gray-700 hover:bg-gray-800 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about trading, market analysis, or execute trades..."
              className={`w-full px-4 py-3 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl hover:from-teal-600 hover:to-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
