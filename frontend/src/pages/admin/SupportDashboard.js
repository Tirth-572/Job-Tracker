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

 if (loading) return <div>Loading...</div>;

 return (
 <div className="h-[calc(100vh-6rem)] flex gap-4 overflow-hidden">
 {/* Sidebar */}
 <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden shrink-0">
 <div className="p-4 border-b border-gray-200 space-y-3 shrink-0">
 <h2 className="font-bold text-lg">Support Tickets</h2>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
 <input 
 type="text" 
 placeholder="Search subjects or emails..." 
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 className="w-full bg-gray-100 border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary-500"
 />
 </div>
 <div className="flex gap-2 text-xs">
 <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-gray-100 rounded p-1 border-none focus:ring-0 cursor-pointer flex-1">
 <option value="">All Statuses</option>
 <option value="OPEN">Open</option>
 <option value="PENDING">Pending</option>
 <option value="RESOLVED">Resolved</option>
 </select>
 <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="bg-gray-100 rounded p-1 border-none focus:ring-0 cursor-pointer flex-1">
 <option value="">All Types</option>
 <option value="CANDIDATE">Candidates</option>
 <option value="COMPANY">Companies</option>
 </select>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-2 space-y-1">
 {filteredTickets.length === 0 ? (
 <p className="text-center text-sm text-gray-500 py-8">No tickets found</p>
 ) : (
 filteredTickets.map(ticket => (
 <button
 key={ticket.id}
 onClick={() => setActiveTicket(ticket)}
 className={cn(
 "w-full text-left p-3 rounded-lg transition-colors border",
 activeTicket?.id === ticket.id 
 ? "bg-primary-50 border-primary-200 " 
 : "bg-transparent border-transparent hover:bg-gray-50 :bg-gray-700"
 )}
 >
 <div className="flex items-center justify-between mb-1">
 <span className="font-medium text-sm text-gray-900 truncate pr-2">{ticket.subject}</span>
 <span className={cn(
 "text-[10px] px-1.5 py-0.5 rounded-full shrink-0",
 ticket.status === 'OPEN' ? "bg-red-100 text-red-700" :
 ticket.status === 'PENDING' ? "bg-blue-100 text-blue-700" :
 ticket.status === 'RESOLVED' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
 )}>{ticket.status}</span>
 </div>
 <div className="flex justify-between items-end">
 <div className="min-w-0 flex-1">
 <p className="text-xs text-gray-500 truncate">{ticket.user?.email}</p>
 <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{ticket.user?.role.toLowerCase()}</p>
 </div>
 <p className="text-[10px] text-gray-400 ml-2 shrink-0">{formatRelativeDate(ticket.updatedAt)}</p>
 </div>
 </button>
 ))
 )}
 </div>
 </div>

 {/* Main Chat Area */}
 <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
 {activeTicket ? (
 <>
 <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 ">
 <div>
 <h3 className="font-bold text-gray-900 ">{activeTicket.subject}</h3>
 <p className="text-xs text-gray-500">
 {activeTicket.user?.email} • <span className="capitalize">{activeTicket.user?.role.toLowerCase()}</span>
 </p>
 </div>
 <div className="flex items-center gap-2">
 {activeTicket.status !== 'RESOLVED' && (
 <Button variant="secondary" size="sm" onClick={() => handleStatusChange('RESOLVED')} className="text-green-600 hover:text-green-700 hover:bg-green-50">
 Mark Resolved
 </Button>
 )}
 {activeTicket.status === 'RESOLVED' && (
 <Button variant="secondary" size="sm" onClick={() => handleStatusChange('OPEN')}>
 Reopen
 </Button>
 )}
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 ">
 {messages.map((m, i) => {
 const isAdmin = m.sender?.role === 'ADMIN';
 return (
 <div key={m.id || i} className={cn("flex max-w-[70%]", isAdmin ? "ml-auto flex-row-reverse" : "")}>
 <div className={cn("shrink-0", isAdmin ? "ml-2" : "mr-2")}>
 <Avatar size="sm" name={m.sender?.email} className={!isAdmin && "bg-gray-200 text-gray-700"} />
 </div>
 <div className={cn("rounded-2xl px-4 py-2 text-sm shadow-sm", isAdmin ? "bg-primary-600 text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-100 ")}>
 {m.message && <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>}
 {m.attachment && (
 <a href={getFileUrl(m.attachment)} target="_blank" rel="noreferrer" className="block mt-2 flex items-center gap-1 text-xs underline opacity-80 hover:opacity-100">
 <Paperclip size={12} /> View Attachment
 </a>
 )}
 <p className={cn("text-[10px] mt-1 text-right", isAdmin ? "text-primary-100" : "text-gray-400")}>
 {formatRelativeDate(m.createdAt)}
 </p>
 </div>
 </div>
 );
 })}
 <div ref={messagesEndRef} />
 </div>

 <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 shrink-0">
 {file && (
 <div className="flex items-center justify-between bg-gray-100 rounded-lg p-2 mb-3 text-sm">
 <div className="flex items-center gap-2 overflow-hidden">
 <Paperclip size={16} className="text-gray-400 shrink-0" />
 <span className="truncate">{file.name}</span>
 </div>
 <button type="button" onClick={() => setFile(null)} className="p-1 hover:bg-gray-200 :bg-gray-600 rounded">
 <X size={16} className="text-red-500" />
 </button>
 </div>
 )}
 <div className="flex items-end gap-2">
 <label className="p-3 text-gray-400 hover:text-primary-600 cursor-pointer transition-colors rounded-xl hover:bg-gray-100 :bg-gray-700 shrink-0">
 <Paperclip size={20} />
 <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
 </label>
 <div className="flex-1 relative">
 <Textarea
 placeholder="Type a reply to the user..."
 value={replyMessage}
 onChange={e => setReplyMessage(e.target.value)}
 rows={2}
 className="pr-12 resize-none"
 />
 <button 
 type="submit" 
 disabled={(!replyMessage && !file)} 
 className="absolute right-2 bottom-2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 <Send size={18} className="ml-0.5" />
 </button>
 </div>
 </div>
 </form>
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
 <MessageCircle size={64} className="mb-4 opacity-50" />
 <p className="text-lg font-medium text-gray-500">No ticket selected</p>
 <p className="text-sm">Select a ticket from the sidebar to view messages.</p>
 </div>
 )}
 </div>
 </div>
 );
}
