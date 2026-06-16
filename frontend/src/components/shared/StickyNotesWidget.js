import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Plus, X, Trash2, Check } from 'lucide-react';
import { stickyNotesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../lib/utils';

const COLORS = [
    { name: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-900', handle: 'bg-yellow-200' },
    { name: 'Green', bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-900', handle: 'bg-green-200' },
    { name: 'Blue', bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-900', handle: 'bg-blue-200' },
    { name: 'Pink', bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-900', handle: 'bg-pink-200' },
];

const Note = ({ note, onUpdate, onDelete, constraintsRef }) => {
    const [content, setContent] = useState(note.content);
    const [colorObj, setColorObj] = useState(COLORS.find(c => c.bg === note.color) || COLORS[0]);
    const [isEditing, setIsEditing] = useState(false);
    const timeoutRef = useRef(null);

    const debouncedUpdate = (id, data) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            try {
                await stickyNotesAPI.updateNote(id, data);
            } catch (error) {
                console.error('Failed to update note:', error);
            }
        }, 1000);
    };

    const handleContentChange = (e) => {
        setContent(e.target.value);
        onUpdate(note.id, { content: e.target.value });
        debouncedUpdate(note.id, { content: e.target.value });
    };

    const handleColorChange = (c) => {
        setColorObj(c);
        onUpdate(note.id, { color: c.bg });
        debouncedUpdate(note.id, { color: c.bg });
    };

    const handleDragEnd = (event, info) => {
        // Just send simple position updates, even if relative, for basic persistence.
        // For simplicity, we just save the final x,y if we needed to, but we'll let framer-motion handle local dragging.
    };

    return (
        <motion.div
            drag
            dragConstraints={constraintsRef}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileDrag={{ scale: 1.05, zIndex: 50 }}
            className={cn('absolute w-56 shadow-lg rounded-xl overflow-hidden flex flex-col', colorObj.bg, colorObj.border, 'border')}
            style={{ x: note.positionX || Math.random() * 50, y: note.positionY || Math.random() * 50 }}
        >
            <div className={cn('h-8 w-full cursor-grab active:cursor-grabbing flex items-center justify-between px-2', colorObj.handle)}>
                <div className="flex gap-1">
                    {COLORS.map(c => (
                        <button
                            key={c.name}
                            onClick={() => handleColorChange(c)}
                            className={cn('w-4 h-4 rounded-full border border-black/10 transition-transform hover:scale-110', c.bg)}
                            title={c.name}
                        />
                    ))}
                </div>
                <button
                    onClick={() => onDelete(note.id)}
                    className="p-1 hover:bg-black/10 rounded-md text-black/50 hover:text-black/70 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="p-3 flex-1 min-h-[140px]">
                <textarea
                    value={content}
                    onChange={handleContentChange}
                    onFocus={() => setIsEditing(true)}
                    onBlur={() => setIsEditing(false)}
                    placeholder="Type a note..."
                    className={cn(
                        'w-full h-full min-h-[120px] bg-transparent border-none outline-none resize-none placeholder-black/30',
                        colorObj.text,
                        'text-sm font-medium'
                    )}
                />
            </div>
        </motion.div>
    );
};

export default function StickyNotesWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState([]);
    const constraintsRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchNotes();
        }
    }, [isOpen]);

    const fetchNotes = async () => {
        try {
            const { data } = await stickyNotesAPI.getNotes();
            setNotes(data);
        } catch (error) {
            toast.error('Failed to load sticky notes');
        }
    };

    const handleAddNote = async () => {
        try {
            const { data } = await stickyNotesAPI.createNote({
                content: '',
                color: 'bg-yellow-100',
                positionX: Math.floor(Math.random() * 100),
                positionY: Math.floor(Math.random() * 100)
            });
            setNotes(prev => [data, ...prev]);
        } catch (error) {
            toast.error('Failed to create note');
        }
    };

    const handleUpdateNote = (id, updates) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    };

    const handleDeleteNote = async (id) => {
        try {
            await stickyNotesAPI.deleteNote(id);
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            toast.error('Failed to delete note');
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-[88px] right-6 p-4 rounded-full bg-brand-primary text-white shadow-brand hover:scale-105 active:scale-95 transition-all z-50 flex items-center justify-center group"
                title="Sticky Notes"
            >
                {isOpen ? <X size={24} /> : <StickyNote size={24} />}
                {!isOpen && (
                    <span className="absolute right-full mr-3 whitespace-nowrap bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Sticky Notes
                    </span>
                )}
            </button>

            {/* Notes Container */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={constraintsRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 pointer-events-none"
                    >
                        {/* Overlay to catch clicks outside notes? No, we want them to float over the dashboard. */}
                        {/* We set pointer-events-none on the container and pointer-events-auto on the children. */}
                        
                        <div className="absolute inset-4 pointer-events-none">
                            <AnimatePresence>
                                {notes.map(note => (
                                    <div key={note.id} className="absolute pointer-events-auto" style={{ left: '50%', top: '50%' }}>
                                        <Note
                                            note={note}
                                            onUpdate={handleUpdateNote}
                                            onDelete={handleDeleteNote}
                                            constraintsRef={constraintsRef}
                                        />
                                    </div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Floating Add Button when Open */}
                        <div className="fixed bottom-[130px] right-8 z-50 pointer-events-auto">
                            <button
                                onClick={handleAddNote}
                                className="p-3 bg-white text-brand-primary rounded-full shadow-lg border border-brand-primary/20 hover:scale-110 active:scale-95 transition-all flex items-center gap-2"
                                title="Add New Note"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
