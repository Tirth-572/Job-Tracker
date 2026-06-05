import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, MessageSquare, Search, Smile, Check, CheckCheck, X, FileText } from 'lucide-react';
import { chatAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { Avatar, EmptyState, Spinner, Badge } from '../../components/ui';
import { formatRelativeDate, cn, getFileUrl } from '../../lib/utils';
import toast from 'react-hot-toast';

const POPULAR_EMOJIS = ['👍', '❤️', '😊', '😂', '🔥', '🎉', '🙌', '👏', '🤔', '👀', '💼', '🤝'];

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
 const [search, setSearch] = useState('');
 
 const [loading, setLoading] = useState(true);
 const [msgLoading, setMsgLoading] = useState(false);
 const [isTyping, setIsTyping] = useState(false);
 
 const [file, setFile] = useState(null);
 const [showEmojiPicker, setShowEmojiPicker] = useState(false);
 
 // Real-time statuses
 const [onlineUsers, setOnlineUsers] = useState(new Set());
 
 const bottomRef = useRef(null);
 const fileInputRef = useRef(null);
 const typingTimer = useRef(null);
 const [amITyping, setAmITyping] = useState(false);
 const socket = getSocket();

 useEffect(() => {
 chatAPI.getRooms().then(({ data }) => setRooms(data)).finally(() => setLoading(false));
 }, []);

 useEffect(() => {
 if (!socket) return;
 
 const handleUserOnline = (userId) => setOnlineUsers(prev => new Set([...prev, userId]));
 const handleUserOffline = (userId) => {
 setOnlineUsers(prev => {
 const next = new Set(prev);
 next.delete(userId);
 return next;
 });
 };
 const handleOnlineStatus = ({ userId, isOnline }) => {
 if (isOnline) handleUserOnline(userId);
 else handleUserOffline(userId);
 };

 socket.on('userOnline', handleUserOnline);
 socket.on('userOffline', handleUserOffline);
 socket.on('userOnlineStatus', handleOnlineStatus);

 return () => {
 socket.off('userOnline', handleUserOnline);
 socket.off('userOffline', handleUserOffline);
 socket.off('userOnlineStatus', handleOnlineStatus);
 };
 }, [socket]);

 useEffect(() => {
 if (!activeRoom || !socket) return;
 socket.emit('joinRoom', activeRoom.id);
 
 // Check if the other person is online
 const targetUserId = user.role === 'CANDIDATE' ? activeRoom.company?.userId : activeRoom.candidate?.userId;
 if (targetUserId) {
 socket.emit('checkOnline', targetUserId);
 }

 setMsgLoading(true);
 chatAPI.getMessages(activeRoom.id).then(({ data }) => {
 setMessages(data);
 // clear unread count locally
 setRooms(prev => prev.map(r => r.id === activeRoom.id ? { ...r, _count: { ...r._count, messages: 0 } } : r));
 }).finally(() => setMsgLoading(false));

 const msgHandler = (msg) => {
 setMessages(prev => [...prev, msg]);
 // If the message is from the other person, we mark it as read immediately
 if (msg.senderId !== user.id) {
 socket.emit('messagesRead', { roomId: activeRoom.id, userId: user.id });
 }
 };
 
 const typingHandler = ({ userId, isTyping: t }) => { if (userId !== user.id) setIsTyping(t); };
 
 const readReceiptHandler = ({ userId, roomId }) => {
 if (userId !== user.id && roomId === activeRoom.id) {
 setMessages(prev => prev.map(m => m.senderId === user.id ? { ...m, isRead: true } : m));
 }
 };

 socket.on('message', msgHandler);
 socket.on('typing', typingHandler);
 socket.on('messagesRead', readReceiptHandler);

 return () => {
 socket.emit('leaveRoom', activeRoom.id);
 socket.off('message', msgHandler);
 socket.off('typing', typingHandler);
 socket.off('messagesRead', readReceiptHandler);
 };
 }, [activeRoom, socket, user.id, user.role]);

 // Handle incoming messages for rooms we aren't currently viewing (to update unread count & last message)
 useEffect(() => {
 if (!socket) return;
 const globalMsgHandler = (msg) => {
 setRooms(prev => prev.map(r => {
 if (r.id === msg.roomId) {
 const isViewing = activeRoom?.id === r.id;
 return {
 ...r,
 messages: [msg],
 _count: {
 ...r._count,
 messages: (r._count?.messages || 0) + (!isViewing && msg.receiverId === user.id ? 1 : 0)
 }
 };
 }
 return r;
 }).sort((a, b) => {
 const aTime = a.messages?.[0]?.createdAt || a.createdAt;
 const bTime = b.messages?.[0]?.createdAt || b.createdAt;
 return new Date(bTime) - new Date(aTime);
 }));
 };
 socket.on('message', globalMsgHandler);
 return () => socket.off('message', globalMsgHandler);
 }, [socket, activeRoom, user.id]);

 useEffect(() => {
 bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [messages, isTyping]);

 const handleTyping = (val) => {
 setText(val);
 if (!socket || !activeRoom) return;
 if (!amITyping) { setAmITyping(true); socket.emit('typing', { roomId: activeRoom.id, isTyping: true }); }
 clearTimeout(typingTimer.current);
 typingTimer.current = setTimeout(() => {
 setAmITyping(false);
 socket.emit('typing', { roomId: activeRoom.id, isTyping: false });
 }, 1500);
 };

 const insertEmoji = (emoji) => {
 setText(prev => prev + emoji);
 setShowEmojiPicker(false);
 };

 const handleFileSelect = (e) => {
 if (e.target.files && e.target.files[0]) {
 setFile(e.target.files[0]);
 }
 };

 const sendMessage = async () => {
 if ((!text.trim() && !file) || !activeRoom) return;
 const content = text;
 setText('');
 const attachment = file;
 setFile(null);
 setShowEmojiPicker(false);
 
 try {
 const fd = new FormData();
 if (content) fd.append('content', content);
 if (attachment) fd.append('file', attachment);
 await chatAPI.sendMessage(activeRoom.id, fd);
 } catch { toast.error('Failed to send message'); }
 };

 const getRoomName = (room) => {
 if (user.role === 'CANDIDATE') return room.company?.name || 'Company';
 return `${room.candidate?.firstName || ''} ${room.candidate?.lastName || ''}`.trim() || 'Candidate';
 };

 const getRoomAvatar = (room) => getFileUrl(user.role === 'CANDIDATE' ? room.company?.logo : room.candidate?.avatar);

 const filteredRooms = rooms.filter(room => {
 const term = search.toLowerCase();
 const name = getRoomName(room).toLowerCase();
 const jobTitle = room.application?.job?.title?.toLowerCase() || '';
 return name.includes(term) || jobTitle.includes(term);
 });

 const targetUserId = activeRoom ? (user.role === 'CANDIDATE' ? activeRoom.company?.userId : activeRoom.candidate?.userId) : null;
 const isOnline = targetUserId ? onlineUsers.has(targetUserId) : false;

 return (
 <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex card overflow-hidden p-0 border border-gray-200 shadow-xl rounded-2xl">
 {/* Sidebar */}
 <div className="w-80 border-r border-gray-200 flex flex-col shrink-0 bg-gray-50/50 ">
 <div className="p-4 border-b border-gray-200 ">
 <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
 <input
 type="text"
 placeholder="Search chats..."
 className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
 value={search}
 onChange={e => setSearch(e.target.value)}
 />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto">
 {loading ? (
 <div className="p-3 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
 ) : filteredRooms.length === 0 ? (
 <div className="p-8 text-center text-sm text-gray-400">No conversations found</div>
 ) : (
 filteredRooms.map(room => {
 const name = getRoomName(room);
 const avatar = getRoomAvatar(room);
 const lastMsg = room.messages?.[0];
 const unreadCount = room._count?.messages || 0;
 const isActive = activeRoom?.id === room.id;
 
 return (
 <button
 key={room.id}
 onClick={() => setActiveRoom(room)}
 className={cn(
 'w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-white :bg-gray-800 transition-colors text-left relative',
 isActive && 'bg-white shadow-sm border-l-4 border-l-primary-500 border-b-transparent'
 )}
 >
 <div className="relative shrink-0">
 <Avatar src={avatar} name={name} size="md" />
 {onlineUsers.has(user.role === 'CANDIDATE' ? room.company?.userId : room.candidate?.userId) && (
 <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
 )}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start mb-0.5">
 <p className={cn("text-sm font-semibold truncate", isActive ? "text-primary-600 " : "text-gray-900 ")}>{name}</p>
 {lastMsg && (
 <p className="text-[10px] text-gray-400 shrink-0 mt-0.5">{formatRelativeDate(lastMsg.createdAt)}</p>
 )}
 </div>
 <p className="text-[11px] font-medium text-primary-600/80 truncate mb-1">
 {room.application?.job?.title}
 </p>
 <div className="flex items-center justify-between gap-2">
 <p className={cn("text-xs truncate", unreadCount > 0 ? "font-medium text-gray-900 " : "text-gray-500")}>
 {lastMsg ? (lastMsg.content || '📎 Attachment') : 'Start the conversation'}
 </p>
 {unreadCount > 0 && (
 <span className="bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
 {unreadCount}
 </span>
 )}
 </div>
 </div>
 </button>
 );
 })
 )}
 </div>
 </div>

 {/* Chat Area */}
 {activeRoom ? (
 <div className="flex-1 flex flex-col relative bg-[#EFEAE2] [#0B141A]">
 {/* Header */}
 <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center justify-between z-10 shadow-sm">
 <div className="flex items-center gap-4">
 <Avatar src={getRoomAvatar(activeRoom)} name={getRoomName(activeRoom)} size="md" />
 <div>
 <p className="font-bold text-gray-900 flex items-center gap-2">
 {getRoomName(activeRoom)}
 <Badge className="text-[10px] py-0 px-2 bg-gray-100 text-gray-600 border-none">
 {activeRoom.application?.stage?.name || 'Applied'}
 </Badge>
 </p>
 <div className="flex items-center gap-2 text-xs">
 <span className="text-gray-500 truncate max-w-[200px]">{activeRoom.application?.job?.title}</span>
 <span className="text-gray-300 ">•</span>
 <span className={cn(isOnline ? "text-green-500 font-medium" : "text-gray-400")}>
 {isOnline ? 'Online' : 'Offline'}
 </span>
 </div>
 </div>
 </div>
 {user.role === 'COMPANY' && activeRoom.candidate?.resumeUrl && (
 <a href={getFileUrl(activeRoom.candidate.resumeUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-900/30 px-3 py-1.5 rounded-lg transition-colors font-medium">
 <FileText size={16} /> View Resume
 </a>
 )}
 </div>

 {/* Messages */}
 <div className="flex-1 overflow-y-auto p-6 space-y-4">
 {msgLoading ? (
 <div className="flex justify-center mt-10"><Spinner /></div>
 ) : messages.length === 0 ? (
 <div className="flex justify-center mt-10">
 <div className="bg-yellow-100/80 text-yellow-800 text-xs px-4 py-2 rounded-xl max-w-sm text-center shadow-sm border border-yellow-200 ">
 Messages are end-to-end encrypted and related to this job application. Start by saying hello!
 </div>
 </div>
 ) : (
 messages.map((msg, i) => {
 const isMe = msg.senderId === user.id;
 const showAvatar = !isMe && (i === 0 || messages[i-1].senderId === user.id);
 
 return (
 <div key={msg.id} className={cn('flex gap-2 group', isMe ? 'justify-end' : 'justify-start')}>
 {!isMe && (
 <div className="w-8 shrink-0 flex items-end">
 {showAvatar && <Avatar src={getRoomAvatar(activeRoom)} name={getRoomName(activeRoom)} size="sm" />}
 </div>
 )}
 <div className={cn(
 'max-w-[70%] px-4 py-2 rounded-2xl text-[15px] leading-relaxed shadow-sm relative',
 isMe 
 ? 'bg-[#D9FDD3] [#005C4B] text-gray-900 rounded-br-sm' 
 : 'bg-white [#202C33] text-gray-900 rounded-bl-sm'
 )}>
 {msg.fileUrl && (
 <a href={getFileUrl(msg.fileUrl)} target="_blank" rel="noopener noreferrer" className={cn(
 "flex items-center gap-2 p-2.5 rounded-xl mb-2 text-sm font-medium border transition-colors",
 isMe 
 ? "bg-white/40 border-black/5 hover:bg-white/60 text-gray-900" 
 : "bg-gray-50/50 border-gray-200 hover:bg-gray-100 :bg-gray-800"
 )}>
 <div className="p-2 bg-black/5 rounded-lg">
 <FileText size={18} />
 </div>
 Attachment
 </a>
 )}
 {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
 
 <div className="flex items-center justify-end gap-1 mt-1">
 <span className={cn('text-[10px]', isMe ? 'text-gray-500/80 ' : 'text-gray-400')}>
 {formatRelativeDate(msg.createdAt)}
 </span>
 {isMe && (
 <span className={msg.isRead ? 'text-[#53bdeb]' : 'text-gray-400'}>
 {msg.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
 </span>
 )}
 </div>
 </div>
 </div>
 );
 })
 )}
 {isTyping && (
 <div className="flex gap-2 justify-start">
 <div className="w-8 shrink-0"></div>
 <div className="bg-white [#202C33] rounded-2xl rounded-bl-sm shadow-sm inline-block"><TypingIndicator /></div>
 </div>
 )}
 <div ref={bottomRef} className="h-2" />
 </div>

 {/* Input Area */}
 <div className="p-4 bg-[#F0F2F5] [#202C33] z-10 flex flex-col gap-2 relative">
 {file && (
 <div className="absolute bottom-full left-4 mb-2 bg-white rounded-xl p-3 shadow-lg border border-gray-200 flex items-center gap-3 animate-in slide-in-from-bottom-2">
 <div className="p-2 bg-primary-50 text-primary-600 rounded-lg"><FileText size={20} /></div>
 <div className="text-sm">
 <p className="font-medium text-gray-900 truncate max-w-[200px]">{file.name}</p>
 <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
 </div>
 <button onClick={() => setFile(null)} className="ml-2 p-1.5 hover:bg-gray-100 :bg-gray-700 rounded-full text-gray-500">
 <X size={16} />
 </button>
 </div>
 )}
 
 {showEmojiPicker && (
 <div className="absolute bottom-full left-4 mb-2 bg-white rounded-2xl p-4 shadow-xl border border-gray-200 animate-in slide-in-from-bottom-2 z-50 w-64">
 <div className="grid grid-cols-6 gap-2">
 {POPULAR_EMOJIS.map(emoji => (
 <button key={emoji} onClick={() => insertEmoji(emoji)} className="text-xl hover:bg-gray-100 :bg-gray-700 p-2 rounded-lg transition-colors">
 {emoji}
 </button>
 ))}
 </div>
 </div>
 )}

 <div className="flex items-end gap-2">
 <div className="flex gap-1 pb-1.5">
 <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-gray-500 hover:text-gray-700 :text-gray-300 transition-colors">
 <Smile size={24} />
 </button>
 <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-gray-700 :text-gray-300 transition-colors">
 <Paperclip size={24} />
 </button>
 <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
 </div>
 
 <div className="flex-1 bg-white [#2A3942] rounded-xl flex items-center shadow-sm">
 <textarea
 className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-4 max-h-32 text-gray-900 "
 placeholder="Type a message"
 rows={1}
 value={text}
 onChange={e => {
 handleTyping(e.target.value);
 e.target.style.height = 'auto';
 e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
 }}
 onKeyDown={e => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 sendMessage();
 e.target.style.height = 'auto';
 }
 }}
 />
 </div>

 <button
 onClick={() => {
 sendMessage();
 if(document.querySelector('textarea')) document.querySelector('textarea').style.height = 'auto';
 }}
 disabled={!text.trim() && !file}
 className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl disabled:opacity-50 transition-colors shadow-sm pb-3 shrink-0"
 >
 <Send size={20} className="ml-1" />
 </button>
 </div>
 </div>
 </div>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center bg-[#F0F2F5] [#202C33] border-l border-gray-200 ">
 <EmptyState 
 icon={MessageSquare} 
 title="HireBridge Messaging" 
 description="Select a conversation from the left to start chatting. Messages are end-to-end encrypted and linked to specific job applications." 
 />
 </div>
 )}
 </div>
 );
}
