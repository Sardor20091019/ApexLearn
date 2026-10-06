'use client';
import React, { useEffect, useState, useRef } from 'react';
import Pusher from 'pusher-js';

interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: string;
}

interface Conversation {
  userId: string;
  userEmail: string;
  userFullName: string;
  lastMessage: string;
  lastMessageAt: string;
}

export default function SupportChat({ userRole, currentUserId }: { userRole: string; currentUserId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [inboxError, setInboxError] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const isAdmin = userRole === 'ADMIN';


  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    const headers = { Authorization: `Bearer ${token}` };

    if (isAdmin) {
      fetch(`${API_URL}/support/admin/conversations`, { headers })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error((await res.text()) || 'Unable to load the support inbox.');
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setInboxError('');
            setConversations(data);
            if (data.length > 0 && !selectedUser) {
              setSelectedUser(data[0]);
            }
          }
        })
        .catch((error) => {
          console.error(error);
          setInboxError('Unable to load the support inbox. Refresh the page and try again.');
        });
    } else {
      fetch(`${API_URL}/support/messages`, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMessages(
              data.map((m: any) => ({
                id: m.id,
                sender: m.senderRole,
                text: m.message,
                timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }))
            );
          }
        })
        .catch(console.error);
    }
  }, [isAdmin, API_URL]);

  useEffect(() => {
    if (isAdmin && selectedUser) {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
      fetch(`${API_URL}/support/admin/messages/${selectedUser.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMessages(
              data.map((m: any) => ({
                id: m.id,
                sender: m.senderRole,
                text: m.message,
                timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }))
            );
          }
        })
        .catch(console.error);
    }
  }, [selectedUser, isAdmin, API_URL]);

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

    if (!pusherKey) return;

    const pusher = new Pusher(pusherKey, { cluster: pusherCluster });
    const targetChannelId = isAdmin && selectedUser ? selectedUser.userId : currentUserId;

    if (targetChannelId) {
      const channel = pusher.subscribe(`support-${targetChannelId}`);
      channel.bind('new-message', (data: ChatMessage) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          const tempIndex = prev.findIndex((m) => m.id.startsWith('temp-') && m.text === data.text && m.sender === data.sender);
          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = data;
            return updated;
          }
          return [...prev, data];
        });
      });
    }

    if (isAdmin) {
      const adminChannel = pusher.subscribe('support-admin');
      adminChannel.bind('inbox-update', (data: any) => {
        setConversations((prev) => {
          const exists = prev.some((c) => c.userId === data.userId);
          if (!exists) {
            return [
              {
                userId: data.userId,
                userEmail: data.userEmail || data.userId,
                userFullName: data.userFullName || 'User',
                lastMessage: data.text,
                lastMessageAt: new Date().toISOString(),
              },
              ...prev,
            ];
          }
          return prev.map((c) =>
            c.userId === data.userId ? { ...c, lastMessage: data.text, lastMessageAt: new Date().toISOString() } : c
          );
        });
      });
    }

    return () => {
      if (targetChannelId) pusher.unsubscribe(`support-${targetChannelId}`);
      if (isAdmin) pusher.unsubscribe('support-admin');
      pusher.disconnect();
    };
  }, [isAdmin, selectedUser, currentUserId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = inputMessage.trim();
    if (!textToSend) return;

    const tempId = `temp-${Date.now()}`;
    const senderType: 'user' | 'admin' = isAdmin ? 'admin' : 'user';
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender: senderType,
      text: textToSend,
      timestamp: nowTime,
    };

    // 1. Instant local UI update (0ms delay)
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputMessage('');

    if (isAdmin && selectedUser) {
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === selectedUser.userId ? { ...c, lastMessage: textToSend, lastMessageAt: new Date().toISOString() } : c
        )
      );
    }

    // 2. Background API request
    const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_URL}/support/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: textToSend,
          targetUserId: isAdmin && selectedUser ? selectedUser.userId : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();
      if (data?.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, id: data.id } : m))
        );
      }
    } catch (err) {
      console.error(err);
      // Remove optimistic message if request fails
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  return (
    <div className={`mx-auto w-full grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-4 h-[600px]`}>
      

      {isAdmin && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col md:col-span-1 shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-sm text-gray-800 flex items-center justify-between">
            <span>Support Inbox</span>
            <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full font-semibold">
              {conversations.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                {inboxError || 'No active chats found.'}
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => setSelectedUser(conv)}
                  className={`w-full text-left p-3.5 transition-colors cursor-pointer ${
                    selectedUser?.userId === conv.userId ? 'bg-violet-50 border-l-4 border-violet-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-xs text-gray-900 truncate">{conv.userFullName || conv.userEmail}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}


      <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col ${isAdmin ? 'md:col-span-2' : 'md:col-span-1'}`}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-lg font-bold">
              🎓
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {isAdmin && selectedUser ? `Chat with ${selectedUser.userFullName || selectedUser.userEmail}` : 'ApexLearn Support'}
              </h3>
              <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                Real-time active connection
              </p>
            </div>
          </div>
        </div>


        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
          {isAdmin && !selectedUser ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Select a conversation from the sidebar inbox to start replying.
            </div>
          ) : (
            messages.map((msg) => {
              const isOutgoing = isAdmin ? msg.sender === 'admin' : msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex flex-col ${isOutgoing ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isOutgoing
                        ? 'bg-violet-600 text-white rounded-br-sm shadow-sm'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>


        {(!isAdmin || selectedUser) && (
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex items-center gap-3 bg-white">
            <input
              type="text"
              placeholder={isAdmin ? 'Type your reply as Admin...' : 'Type your support question...'}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
            />
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors shadow-sm"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
