import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MessageSquare, Circle } from 'lucide-react';
import { chatAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { Avatar, EmptyState, Spinner } from '../../components/ui';
import { formatRelativeDate, cn } from '../../lib/utils';
import toast from 'react-hot-toast';

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    <div className="flex gap-0.5">
      {[0, 1, 2].map(i => (
        <span key={i} style={{ animationDelay: `${i * 0.15}s` }} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
      ))}
    </div>
  </div>
);

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    chatAPI.getRooms().then(({ data }) => setRooms(data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeRoom || !socket) return;
    socket.emit('joinRoom', activeRoom.id);
    setMsgLoading(true);
    chatAPI.getMessages(activeRoom.id).then(({ data }) => setMessages(data)).finally(() => setMsgLoading(false));

    const msgHandler = (msg) => setMessages(prev => [...prev, msg]);
    const typingHandler = ({ userId, isTyping: t }) => { if (userId !== user.id) setIsTyping(t); };
    socket.on('message', msgHandler);
    socket.on('typing', typingHandler);
    return () => {
      socket.emit('leaveRoom', activeRoom.id);
      socket.off('message', msgHandler);
      socket.off('typing', typingHandler);
    };
  }, [activeRoom, socket, user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTyping = (val) => {
    setText(val);
    if (!socket || !activeRoom) return;
    if (!typing) { setTyping(true); socket.emit('typing', { roomId: activeRoom.id, isTyping: true }); }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(false);
      socket.emit('typing', { roomId: activeRoom.id, isTyping: false });
    }, 1500);
  };

  const sendMessage = async () => {
    if (!text.trim() || !activeRoom) return;
    const content = text;
    setText('');
    try {
      const fd = new FormData();
      fd.append('content', content);
      await chatAPI.sendMessage(activeRoom.id, fd);
    } catch { toast.error('Failed to send message'); }
  };

  const getRoomName = (room) => {
    if (user.role === 'CANDIDATE') return room.company?.name || 'Company';
    return `${room.candidate?.firstName || ''} ${room.candidate?.lastName || ''}`.trim() || 'Candidate';
  };

  const getRoomAvatar = (room) => user.role === 'CANDIDATE' ? room.company?.logo : room.candidate?.avatar;

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex card overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
          ) : rooms.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">No conversations yet</div>
          ) : (
            rooms.map(room => {
              const name = getRoomName(room);
              const avatar = getRoomAvatar(room);
              const lastMsg = room.messages?.[0];
              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left',
                    activeRoom?.id === room.id && 'bg-primary-50 dark:bg-primary-900/20'
                  )}
                >
                  <Avatar src={avatar} name={name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{name}</p>
                    <p className="text-xs text-gray-400 truncate">{room.application?.job?.title}</p>
                    {lastMsg && <p className="text-xs text-gray-400 truncate mt-0.5">{lastMsg.content || '📎 File'}</p>}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
            <Avatar src={getRoomAvatar(activeRoom)} name={getRoomName(activeRoom)} size="sm" />
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">{getRoomName(activeRoom)}</p>
              <p className="text-xs text-gray-400">{activeRoom.application?.job?.title}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgLoading ? (
              <div className="flex justify-center"><Spinner /></div>
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-gray-400 mt-8">No messages yet. Say hello!</div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={cn('flex gap-2', isMe ? 'justify-end' : 'justify-start')}>
                    {!isMe && <Avatar src={getRoomAvatar(activeRoom)} name={getRoomName(activeRoom)} size="sm" />}
                    <div className={cn(
                      'max-w-xs px-3 py-2 rounded-2xl text-sm',
                      isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
                    )}>
                      {msg.fileUrl && (
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline mb-1 text-xs">
                          <Paperclip size={12} /> Attachment
                        </a>
                      )}
                      {msg.content && <p>{msg.content}</p>}
                      <p className={cn('text-xs mt-1', isMe ? 'text-primary-200' : 'text-gray-400')}>{formatRelativeDate(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <input
              className="flex-1 input py-2"
              placeholder="Type a message..."
              value={text}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim()}
              className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose a conversation from the left to start messaging" />
        </div>
      )}
    </div>
  );
}
