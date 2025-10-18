'use client';

import { useState, useRef, useEffect } from 'react';
import { Chat, Message, UserBalance } from '@/types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Sidebar from './Sidebar';
import BalanceDisplay from './BalanceDisplay';
import PaymentAuthModal from './PaymentAuthModal';

export default function ChatContainer() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<UserBalance>({ amount: 1000.00, currency: 'USD' });
  const [paymentAuthRequest, setPaymentAuthRequest] = useState<{
    amount: number;
    vendorId: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  useEffect(() => {
    if (chats.length === 0) {
      createNewChat();
    }
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!currentChatId) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };

    // Add user message to chat
    setChats(prev =>
      prev.map(chat =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, userMessage],
              title: chat.messages.length === 0 ? content.slice(0, 30) + (content.length > 30 ? '...' : '') : chat.title,
              updatedAt: new Date()
            }
          : chat
      )
    );

    setIsLoading(true);

    try {
      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: currentChatId,
          messages: [...(currentChat?.messages || []), userMessage]
        })
      });

      const data = await response.json();

      // Check if payment authorization is required
      if (data.requiresPaymentAuth) {
        setPaymentAuthRequest(data.paymentDetails);
      }

      // Add assistant message to chat
      setChats(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [...chat.messages, data.message],
                updatedAt: new Date()
              }
            : chat
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };

      setChats(prev =>
        prev.map(chat =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, errorMessage] }
            : chat
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentApprove = async () => {
    if (!paymentAuthRequest || !currentChatId) return;

    // Mock: Update balance
    setBalance(prev => ({
      ...prev,
      amount: prev.amount - paymentAuthRequest.amount
    }));

    // Add confirmation message
    const confirmMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: `Payment of $${paymentAuthRequest.amount} to ${paymentAuthRequest.vendorId} has been authorized and processed.`,
      timestamp: new Date()
    };

    setChats(prev =>
      prev.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, confirmMessage] }
          : chat
      )
    );

    setPaymentAuthRequest(null);
  };

  const handlePaymentReject = () => {
    if (!currentChatId) return;

    // Add rejection message
    const rejectMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'system',
      content: 'Payment authorization was rejected by the user.',
      timestamp: new Date()
    };

    setChats(prev =>
      prev.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, rejectMessage] }
          : chat
      )
    );

    setPaymentAuthRequest(null);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
      />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-gray-100">
                Purchasing Agent
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                AI-powered shopping assistant
              </p>
            </div>
          </div>
          <BalanceDisplay balance={balance} />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950">
          {currentChat && currentChat.messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Start a conversation
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ask me to search for products, check prices, or make purchases on your behalf!
                </p>
              </div>
            </div>
          )}

          {currentChat?.messages.map(message => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>

      {/* Payment Authorization Modal */}
      {paymentAuthRequest && (
        <PaymentAuthModal
          isOpen={true}
          amount={paymentAuthRequest.amount}
          vendorId={paymentAuthRequest.vendorId}
          onApprove={handlePaymentApprove}
          onReject={handlePaymentReject}
        />
      )}
    </div>
  );
}
