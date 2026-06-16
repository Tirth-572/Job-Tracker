import React, { useState, useEffect, useRef } from 'react';
import { StickyNote as NoteIcon } from 'lucide-react';
import { stickyNotesAPI } from '../../services/api';
import { cn } from '../../lib/utils';
import { Card } from '../ui';

const COLORS = [
    { name: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-900', handle: 'bg-yellow-200' },
    { name: 'Green', bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-900', handle: 'bg-green-200' },
    { name: 'Blue', bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-900', handle: 'bg-blue-200' },
    { name: 'Pink', bg: 'bg-pink-100', border: 'border-pink-200', text: 'text-pink-900', handle: 'bg-pink-200' },
];

export default function StickyNotesBoard() {
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState('');
    const [colorObj, setColorObj] = useState(COLORS[0]);
    
    const timeoutRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        fetchOrCreateNote();
    }, []);

    const fetchOrCreateNote = async () => {
        try {
            const { data } = await stickyNotesAPI.getNotes();
            if (data && data.length > 0) {
                const existing = data[0];
                setNote(existing);
                setContent(existing.content);
                setColorObj(COLORS.find(c => c.bg === existing.color) || COLORS[0]);
            } else {
                // Create a default single note
                const { data: newNote } = await stickyNotesAPI.createNote({
                    content: '',
                    color: COLORS[0].bg,
                });
                setNote(newNote);
                setContent(newNote.content);
                setColorObj(COLORS[0]);
            }
        } catch (error) {
            console.error('Failed to load sticky notes', error);
        } finally {
            setLoading(false);
        }
    };

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
        if (note) {
            debouncedUpdate(note.id, { content: e.target.value });
        }
        
        // Auto resize
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    // Initialize auto-resize on load
    useEffect(() => {
        if (!loading && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [loading, content]);

    const handleColorChange = (c) => {
        setColorObj(c);
        if (note) {
            debouncedUpdate(note.id, { color: c.bg });
        }
    };

    return (
        <Card className="p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="section-title flex items-center gap-2">
                    <NoteIcon size={18} className="text-brand-primary" /> My Scratchpad
                </h2>
            </div>

            {loading ? (
                <div className="h-32 skeleton rounded-xl" />
            ) : (
                <div className={cn('relative shadow-sm rounded-xl overflow-hidden flex flex-col transition-all border', colorObj.bg, colorObj.border)}>
                    <div className={cn('h-8 w-full flex items-center px-2', colorObj.handle)}>
                        <div className="flex gap-1.5">
                            {COLORS.map(c => (
                                <button
                                    key={c.name}
                                    onClick={() => handleColorChange(c)}
                                    className={cn('w-3.5 h-3.5 rounded-full border border-black/10 transition-transform hover:scale-110', c.bg)}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="p-4 flex-1">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleContentChange}
                            placeholder="Type your notes here..."
                            className={cn(
                                'w-full bg-transparent border-none outline-none resize-none placeholder-black/30',
                                colorObj.text,
                                'text-sm font-medium min-h-[120px] overflow-hidden'
                            )}
                        />
                    </div>
                </div>
            )}
        </Card>
    );
}
