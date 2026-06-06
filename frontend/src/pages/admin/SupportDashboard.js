import React, { useState, useEffect, useRef } from 'react';
import { supportAPI } from '../../services/api';
import { formatRelativeDate, cn, getFileUrl } from '../../lib/utils';
import { Avatar, Button, Textarea } from '../../components/ui';
import { Search, Send, Paperclip, MessageCircle, X } from 'lucide-react';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

export default function SupportDashboard() {
 const [tickets, setTickets] = useState([]);
 const [activeTicket, setActiveTicket] = useState(null);
 const [messages, setMessages] = useState([]);
 const [replyMessage, setReplyMessage] = useState('');
 const [file, setFile] = useState(null);
 const [loading, setLoading] = useState(true);
 const [filterRole, setFilterRole] = useState(''); // '' | 'CANDIDATE' | 'COMPANY'
 const [filterStatus, setFilterStatus] = useState(''); // '' | 'OPEN' | 'PENDING' | 'RESOLVED'
 const [searchTerm, setSearchTerm] = useState('');

 const messagesEndRef = useRef(null);
 const socketRef = useRef(null);

 useEffect(() => {
 loadTickets();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [filterRole, filterStatus]);

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
 const { data } = await supportAPI.getAllTickets({ role: filterRole, status: filterStatus });
 setTickets(data);
 if (data.length > 0 && !activeTicket) {
 setActiveTicket(data[0]);
 }
 } catch (err) {
 toast.error('Failed to load tickets');
 } finally {
 setLoading(false);
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

 const handleSendMessage = async (e) => {
 e.preventDefault();
 if (!replyMessage && !file) return;
 try {
 const formData = new FormData();
 if (replyMessage) formData.append('message', replyMessage);
 if (file) formData.append('attachment', file);
 
 await supportAPI.sendMessage(activeTicket.id, formData);
 setReplyMessage('');
 setFile(null);
 
 // Update ticket status locally to PENDING since admin replied
 setTickets(tickets.map(t => t.id === activeTicket.id ? { ...t, status: 'PENDING' } : t));
 } catch (err) {
 toast.error('Failed to send message');
 }
 };

 const handleStatusChange = async (status) => {
 try {
 await supportAPI.updateStatus(activeTicket.id, status);
 toast.success(`Ticket marked as ${status}`);
 setTickets(tickets.map(t => t.id === activeTicket.id ? { ...t, status } : t));
 setActiveTicket({ ...activeTicket, status });
 } catch (err) {
 toast.error('Failed to update status');
 }
 };

 const filteredTickets = tickets.filter(t => 
 t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
 t.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
 );

 if (loading) return <div className="animate-pulse h-full w-full bg-brand-surface rounded-2xl" />;

 return (
 <div className="h-[calc(100vh-6rem)] flex gap-6 overflow-hidden">
 {/* Sidebar */}
 <div className="w-80 bg-white rounded-2xl shadow-sm border border-brand-primary/20 flex flex-col overflow-hidden shrink-0">
 <div className="p-5 border-b border-brand-primary/10 space-y-4 shrink-0 bg-brand-surface">
 <h2 className="font-bold text-xl text-gray-900">Support Tickets</h2>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary" size={16} />
 <input 
 type="text" 
 placeholder="Search subjects or emails..." 
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 className="w-full bg-white border border-brand-primary/20 rounded-xl pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-shadow"
 />
 </div>
 <div className="flex gap-2 text-sm font-medium">
 <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-brand-primary/20 rounded-lg p-1.5 focus:ring-brand-primary outline-none cursor-pointer flex-1">
 <option value="">All Statuses</option>
 <option value="OPEN">Open</option>
 <option value="PENDING">Pending</option>
 <option value="RESOLVED">Resolved</option>
 </select>
 <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-white border border-brand-primary/20 rounded-lg p-1.5 focus:ring-brand-primary outline-none cursor-pointer flex-1">
 <option value="">All Types</option>
 <option value="CANDIDATE">Candidates</option>
 <option value="COMPANY">Companies</option>
 </select>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
 {filteredTickets.length === 0 ? (
 <p className="text-center text-sm font-medium text-gray-400 py-10">No tickets found</p>
 ) : (
 filteredTickets.map(ticket => (
 <button
 key={ticket.id}
 onClick={() => setActiveTicket(ticket)}
 className={cn(
 "w-full text-left p-4 rounded-xl transition-all border",
 activeTicket?.id === ticket.id 
 ? "bg-brand-surface border-brand-primary/30 shadow-sm" 
 : "bg-transparent border-transparent hover:bg-brand-bg"
 )}
 >
 <div className="flex items-center justify-between mb-1">
 <span className="font-bold text-sm text-gray-900 truncate pr-2">{ticket.subject}</span>
 <span className={cn(
 "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider",
 ticket.status === 'OPEN' ? "bg-red-50 text-red-500" :
 ticket.status === 'PENDING' ? "bg-blue-50 text-blue-500" :
 ticket.status === 'RESOLVED' ? "bg-green-50 text-green-500" : "bg-gray-100 text-gray-500"
 )}>{ticket.status}</span>
 </div>
 <div className="flex justify-between items-end mt-2">
 <div className="min-w-0 flex-1">
 <p className="text-xs font-medium text-gray-500 truncate">{ticket.user?.email}</p>
 <p className="text-[10px] font-bold text-brand-primary mt-1 uppercase tracking-wider">{ticket.user?.role}</p>
 </div>
 <p className="text-[10px] font-medium text-gray-400 ml-2 shrink-0">{formatRelativeDate(ticket.updatedAt)}</p>
 </div>
 </button>
 ))
 )}
 </div>
 </div>

 {/* Main Chat Area */}
 <div className="flex-1 bg-white rounded-2xl shadow-sm border border-brand-primary/20 flex flex-col overflow-hidden">
 {activeTicket ? (
 <>
 <div className="p-5 border-b border-brand-primary/10 flex justify-between items-center bg-brand-surface">
 <div>
 <h3 className="font-bold text-lg text-gray-900">{activeTicket.subject}</h3>
 <p className="text-sm font-medium text-gray-500 mt-0.5">
 {activeTicket.user?.email} • <span className="uppercase text-[11px] font-bold text-brand-primary">{activeTicket.user?.role}</span>
 </p>
 </div>
 <div className="flex items-center gap-3">
 {activeTicket.status !== 'RESOLVED' && (
 <Button variant="secondary" size="sm" onClick={() => handleStatusChange('RESOLVED')} className="text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200">
 Mark Resolved
 </Button>
 )}
 {activeTicket.status === 'RESOLVED' && (
 <Button variant="secondary" size="sm" onClick={() => handleStatusChange('OPEN')} className="text-brand-primary hover:text-brand-secondary">
 Reopen Ticket
 </Button>
 )}
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-brand-bg scrollbar-hide">
 {messages.map((m, i) => {
 const isAdmin = m.sender?.role === 'ADMIN';
 return (
 <div key={m.id || i} className={cn("flex max-w-[75%]", isAdmin ? "ml-auto flex-row-reverse" : "")}>
 <div className={cn("shrink-0", isAdmin ? "ml-3" : "mr-3")}>
 <Avatar size="sm" name={m.sender?.email} className={!isAdmin ? "bg-white text-brand-primary border border-brand-primary/20" : "bg-brand-primary text-white"} />
 </div>
 <div className={cn("rounded-2xl px-5 py-3 text-sm shadow-sm", isAdmin ? "bg-brand-primary text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-brand-primary/10")}>
 {m.message && <p className="whitespace-pre-wrap leading-relaxed font-medium">{m.message}</p>}
 {m.attachment && (
 <a href={getFileUrl(m.attachment)} target="_blank" rel="noreferrer" className="block mt-3 flex items-center gap-1.5 text-xs font-bold underline opacity-90 hover:opacity-100">
 <Paperclip size={14} /> View Attachment
 </a>
 )}
 <p className={cn("text-[10px] mt-2 font-medium text-right uppercase tracking-wider", isAdmin ? "text-brand-surface opacity-80" : "text-gray-400")}>
 {formatRelativeDate(m.createdAt)}
 </p>
 </div>
 </div>
 );
 })}
 <div ref={messagesEndRef} />
 </div>

 <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-brand-primary/20 shrink-0">
 {file && (
 <div className="flex items-center justify-between bg-brand-surface rounded-xl p-3 mb-3 text-sm font-medium border border-brand-primary/20">
 <div className="flex items-center gap-2 overflow-hidden text-brand-primary">
 <Paperclip size={16} className="shrink-0" />
 <span className="truncate">{file.name}</span>
 </div>
 <button type="button" onClick={() => setFile(null)} className="p-1.5 hover:bg-white rounded-lg transition-colors">
 <X size={16} className="text-red-500" />
 </button>
 </div>
 )}
 <div className="flex items-end gap-3">
 <label className="p-3 text-brand-primary hover:text-brand-secondary cursor-pointer transition-colors rounded-xl hover:bg-brand-surface shrink-0">
 <Paperclip size={22} />
 <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
 </label>
 <div className="flex-1 relative">
 <Textarea
 placeholder="Type a reply..."
 value={replyMessage}
 onChange={e => setReplyMessage(e.target.value)}
 rows={2}
 className="pr-14 resize-none bg-brand-bg border-brand-primary/20 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary font-medium"
 />
 <button 
 type="submit" 
 disabled={(!replyMessage && !file)} 
 className="absolute right-3 bottom-3 p-2 bg-brand-primary text-white rounded-xl hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
 >
 <Send size={18} className="ml-0.5" />
 </button>
 </div>
 </div>
 </form>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-brand-primary/50 bg-brand-bg">
 <MessageCircle size={80} className="mb-6 opacity-30" />
 <p className="text-xl font-bold text-gray-900">No ticket selected</p>
 <p className="text-sm font-medium text-gray-500 mt-2">Select a ticket from the sidebar to view messages.</p>
 </div>
 )}
 </div>
 </div>
 );
}
