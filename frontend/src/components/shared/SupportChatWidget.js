import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Paperclip, ChevronLeft, Plus, MessageCircle } from 'lucide-react';
import { supportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeDate, cn, getFileUrl } from '../../lib/utils';
import { Avatar, Button, Input, Textarea } from '../ui';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

export default function SupportChatWidget() {
 const { user } = useAuth();
 const [isOpen, setIsOpen] = useState(false);
 const [tickets, setTickets] = useState([]);
 const [activeTicket, setActiveTicket] = useState(null);
 const [messages, setMessages] = useState([]);
 const [view, setView] = useState('list'); // 'list', 'chat', 'new'
 
 const [newSubject, setNewSubject] = useState('');
 const [newMessage, setNewMessage] = useState('');
 const [replyMessage, setReplyMessage] = useState('');
 const [file, setFile] = useState(null);
 const [loading, setLoading] = useState(false);

 const messagesEndRef = useRef(null);
 const socketRef = useRef(null);

 useEffect(() => {
 if (isOpen) {
 loadTickets();
 }
 }, [isOpen]);

 useEffect(() => {
 if (activeTicket) {
 loadMessages(activeTicket.id);
 
 const token = localStorage.getItem('token');
 const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
 socketRef.current = io(socketUrl, { auth: { token } });
 
 socketRef.current.emit('joinSupport', activeTicket.id);
 
 socketRef.current.on('supportMessage', (msg) => {
 setMessages(prev => {
 if (prev.find(m => m.id === msg.id)) return prev;
 return [...prev, msg];
 });
 scrollToBottom();
 });

 return () => {
 socketRef.current?.emit('leaveSupport', activeTicket.id);
 socketRef.current?.disconnect();
 };
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [activeTicket]);

 const scrollToBottom = () => {
 setTimeout(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, 100);
 };

 const loadTickets = async () => {
 try {
 const { data } = await supportAPI.getMyTickets();
 setTickets(data);
 } catch (err) {
 console.error('Failed to load tickets', err);
 }
 };

 const loadMessages = async (id) => {
 try {
 const { data } = await supportAPI.getTicket(id);
 setMessages(data.messages);
 scrollToBottom();
 } catch (err) {
 toast.error('Failed to load messages');
 }
 };

 const handleCreateTicket = async (e) => {
 e.preventDefault();
 if (!newSubject || !newMessage) return;
 setLoading(true);
 try {
 const { data } = await supportAPI.createTicket({ subject: newSubject, message: newMessage });
 toast.success('Ticket created');
 setTickets([data, ...tickets]);
 setActiveTicket(data);
 setView('chat');
 setNewSubject('');
 setNewMessage('');
 } catch (err) {
 toast.error('Failed to start chat');
 } finally {
 setLoading(false);
 }
 };

 const handleSendMessage = async (e) => {
 e.preventDefault();
 if (!replyMessage && !file) return;
 setLoading(true);
 try {
 const formData = new FormData();
 if (replyMessage) formData.append('message', replyMessage);
 if (file) formData.append('attachment', file);
 
 await supportAPI.sendMessage(activeTicket.id, formData);
 setReplyMessage('');
 setFile(null);
 } catch (err) {
 toast.error('Failed to send message');
 } finally {
 setLoading(false);
 }
 };

 return (
 <>
 <button
 onClick={() => setIsOpen(true)}
 className={cn(
 "fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-40 group",
 isOpen && "hidden"
 )}
 >
 <MessageSquare size={26} />
 <span className="absolute right-16 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Support Chat</span>
 </button>

 <AnimatePresence>
 {isOpen && (
 <motion.div
 initial={{ opacity: 0, y: 20, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: 20, scale: 0.95 }}
 className="fixed bottom-6 right-6 w-[360px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden"
 >
 {/* Header */}
 <div className="bg-primary-600 text-white p-4 flex items-center justify-between shrink-0">
 <div className="flex items-center gap-3">
 {view !== 'list' && (
 <button onClick={() => setView('list')} className="p-1 hover:bg-primary-700 rounded-full transition-colors">
 <ChevronLeft size={20} />
 </button>
 )}
 <div>
 <h3 className="font-semibold text-lg leading-none">HireBridge Support</h3>
 <p className="text-primary-100 text-xs mt-1">We typically reply in a few minutes</p>
 </div>
 </div>
 <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-primary-700 rounded-full transition-colors">
 <X size={20} />
 </button>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col relative">
 {view === 'list' && (
 <div className="p-4 space-y-4">
 <Button onClick={() => setView('new')} className="w-full flex items-center justify-center gap-2">
 <Plus size={18} /> New Conversation
 </Button>
 
 {tickets.length === 0 ? (
 <div className="text-center text-gray-500 py-10 text-sm">
 <MessageCircle size={40} className="mx-auto mb-3 text-gray-300 " />
 <p>No past conversations.</p>
 <p>How can we help you today?</p>
 </div>
 ) : (
 <div className="space-y-2">
 <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Past Conversations</h4>
 {tickets.map(t => (
 <button
 key={t.id}
 onClick={() => { setActiveTicket(t); setView('chat'); }}
 className="w-full text-left bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:border-primary-300 transition-colors"
 >
 <div className="flex items-center justify-between mb-1">
 <span className="font-medium text-sm text-gray-900 truncate pr-2">{t.subject}</span>
 <span className={cn(
 "text-[10px] px-1.5 py-0.5 rounded-full",
 t.status === 'OPEN' ? "bg-blue-100 text-blue-700" :
 t.status === 'RESOLVED' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
 )}>{t.status}</span>
 </div>
 <p className="text-xs text-gray-500 truncate">{t.messages[0]?.message}</p>
 <p className="text-[10px] text-gray-400 mt-1">{formatRelativeDate(t.updatedAt)}</p>
 </button>
 ))}
 </div>
 )}
 </div>
 )}

 {view === 'new' && (
 <form onSubmit={handleCreateTicket} className="p-4 space-y-4 flex-1 flex flex-col">
 <Input label="Subject" placeholder="Briefly describe the issue" value={newSubject} onChange={e => setNewSubject(e.target.value)} required />
 <Textarea label="Message" placeholder="How can we help?" rows={5} value={newMessage} onChange={e => setNewMessage(e.target.value)} required />
 <div className="mt-auto pt-4">
 <Button type="submit" loading={loading} className="w-full">Start Chat</Button>
 </div>
 </form>
 )}

 {view === 'chat' && (
 <>
 <div className="flex-1 p-4 space-y-4 overflow-y-auto">
 {messages.map((m, i) => {
 const isMe = m.senderId === user.id;
 return (
 <div key={m.id || i} className={cn("flex max-w-[85%]", isMe ? "ml-auto flex-row-reverse" : "")}>
 <div className={cn("shrink-0", isMe ? "ml-2" : "mr-2")}>
 <Avatar size="sm" src={getFileUrl(m.sender?.avatar)} name={m.sender?.email} className={!isMe && "bg-primary-100 text-primary-700"} />
 </div>
 <div className={cn("rounded-2xl px-3 py-2 text-sm shadow-sm", isMe ? "bg-primary-600 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-100 ")}>
 {m.message && <p className="whitespace-pre-wrap">{m.message}</p>}
 {m.attachment && (
 <a href={getFileUrl(m.attachment)} target="_blank" rel="noreferrer" className="block mt-2 flex items-center gap-1 text-xs underline opacity-80 hover:opacity-100">
 <Paperclip size={12} /> View Attachment
 </a>
 )}
 <p className={cn("text-[10px] mt-1 text-right", isMe ? "text-primary-100" : "text-gray-400")}>
 {formatRelativeDate(m.createdAt)}
 </p>
 </div>
 </div>
 );
 })}
 <div ref={messagesEndRef} />
 </div>
 
 {/* Chat Input */}
 <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 shrink-0">
 {file && (
 <div className="flex items-center justify-between bg-gray-100 rounded p-2 mb-2 text-xs">
 <span className="truncate max-w-[200px]">{file.name}</span>
 <button type="button" onClick={() => setFile(null)}><X size={14} className="text-red-500" /></button>
 </div>
 )}
 <div className="flex items-center gap-2">
 <label className="p-2 text-gray-400 hover:text-primary-600 cursor-pointer transition-colors rounded-full hover:bg-gray-100 :bg-gray-700 shrink-0">
 <Paperclip size={20} />
 <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
 </label>
 <input
 type="text"
 className="flex-1 bg-gray-100 border-transparent focus:bg-white :bg-gray-900 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
 placeholder="Type a message..."
 value={replyMessage}
 onChange={e => setReplyMessage(e.target.value)}
 />
 <button type="submit" disabled={(!replyMessage && !file) || loading} className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-colors">
 <Send size={18} className="ml-0.5" />
 </button>
 </div>
 </form>
 </>
 )}
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </>
 );
}
