'use client';

import { useState, useRef, useEffect } from 'react';
import Script from 'next/script';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  vehicles?: any[];
  suggestedAction?: string;
}

interface ProtectedAIChatWidgetProps {
  captchaSiteKey?: string;
  captchaProvider?: 'recaptcha' | 'cloudflare' | 'hcaptcha';
}

export default function ProtectedAIChatWidget({ 
  captchaSiteKey,
  captchaProvider = 'cloudflare' 
}: ProtectedAIChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI car shopping assistant. I can help you find the perfect vehicle from our inventory. What type of car are you looking for?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [pageLoadTime] = useState(() => Date.now());
  const [mouseMovements, setMouseMovements] = useState(0);
  const [interactionAllowed, setInteractionAllowed] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  // Track mouse movements for bot detection
  useEffect(() => {
    const handleMouseMove = () => {
      setMouseMovements(prev => {
        const newCount = prev + 1;
        // Allow interaction after 3 mouse movements and 2 seconds
        if (newCount >= 3 && Date.now() - pageLoadTime > 2000) {
          setInteractionAllowed(true);
        }
        return newCount;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Also allow interaction after 5 seconds regardless
    const timer = setTimeout(() => {
      setInteractionAllowed(true);
    }, 5000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, [pageLoadTime]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize CAPTCHA when chat opens
  useEffect(() => {
    if (isOpen && captchaSiteKey) {
      if (captchaProvider === 'cloudflare' && window.turnstile) {
        window.turnstile.render('#captcha-container', {
          sitekey: captchaSiteKey,
          callback: (token: string) => setCaptchaToken(token),
        });
      } else if (captchaProvider === 'recaptcha' && window.grecaptcha) {
        window.grecaptcha.ready(() => {
          window.grecaptcha.execute(captchaSiteKey, { action: 'chat' })
            .then((token: string) => setCaptchaToken(token));
        });
      }
    }
  }, [isOpen, captchaSiteKey, captchaProvider]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Check if interaction is allowed (bot protection)
    if (!interactionAllowed) {
      alert('Please wait a moment before sending messages.');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);

    try {
      // Send to protected API with bot protection data
      const response = await fetch('/api/chat/protected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: newMessages.slice(0, -1).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          captchaToken,
          sessionId,
          pageLoadTime,
          honeypot: honeypotRef.current?.value, // Honeypot field value
          mouseMovements
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = data.retryAfter ? new Date(data.retryAfter).toLocaleTimeString() : 'later';
          throw new Error(`Too many requests. Please try again after ${retryAfter}.`);
        }
        
        // Handle bot detection
        if (response.status === 403) {
          throw new Error(data.response || 'Access denied. Please verify you are human.');
        }

        throw new Error(data.response || 'Chat service unavailable');
      }

      // Add AI response
      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        vehicles: data.vehicles,
        suggestedAction: data.suggestedAction
      };

      setMessages([...newMessages, aiMessage]);

      // Update rate limit display if needed
      if (data.rateLimit) {
        console.log(`Requests remaining: ${data.rateLimit.remaining}`);
      }

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection error';
      setMessages([...newMessages, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
      
      // Request new CAPTCHA token for next message
      if (captchaProvider === 'recaptcha' && window.grecaptcha) {
        window.grecaptcha.execute(captchaSiteKey!, { action: 'chat' })
          .then((token: string) => setCaptchaToken(token));
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <>
        {/* Load CAPTCHA scripts */}
        {captchaSiteKey && captchaProvider === 'cloudflare' && (
          <Script 
            src="https://challenges.cloudflare.com/turnstile/v0/api.js" 
            strategy="lazyOnload"
          />
        )}
        {captchaSiteKey && captchaProvider === 'recaptcha' && (
          <Script 
            src={`https://www.google.com/recaptcha/api.js?render=${captchaSiteKey}`}
            strategy="lazyOnload"
          />
        )}

        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors group"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {!interactionAllowed && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
            )}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h3 className="font-semibold">AI Car Assistant</h3>
            <p className="text-sm opacity-90">
              {interactionAllowed ? 'Ready to help' : 'Initializing...'}
            </p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-blue-700 rounded-full p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Security indicator */}
        {!interactionAllowed && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
            Please move your mouse to activate chat...
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                <p className="whitespace-pre-wrap">{message.content}</p>

                {/* Show vehicles if available */}
                {message.vehicles && message.vehicles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="font-semibold text-sm">Recommended Vehicles:</p>
                    {message.vehicles.slice(0, 3).map((vehicle: any) => (
                      <div key={vehicle.id} className="bg-white bg-opacity-20 rounded p-2 text-sm">
                        <div className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</div>
                        <div>${vehicle.price.toLocaleString()} • {vehicle.odometer.toLocaleString()} miles</div>
                        <div className="text-xs opacity-75">{vehicle.bodyType} • {vehicle.color}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          {/* Honeypot field (hidden from users, visible to bots) */}
          <input
            ref={honeypotRef}
            type="text"
            name="website"
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={interactionAllowed ? "Ask about vehicles..." : "Please wait..."}
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || !interactionAllowed}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !interactionAllowed}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Send
            </button>
          </div>

          {/* CAPTCHA container (invisible) */}
          <div id="captcha-container" style={{ display: 'none' }}></div>
        </div>
      </div>
    </div>
  );
}

// Extend window object for CAPTCHA libraries
declare global {
  interface Window {
    turnstile: any;
    grecaptcha: any;
    hcaptcha: any;
  }
}
