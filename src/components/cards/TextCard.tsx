'use client';

import { useState, useRef, useEffect } from 'react';
import BaseCard from './BaseCard';
import type { Card, TextContent } from '@/types';

interface TextCardProps {
    card: Card;
    isOwner: boolean;
    isSelected?: boolean;
    isEditing?: boolean;
    zoom?: number;
    onPositionChange?: (id: string, x: number, y: number) => void;
    onSelect?: (id: string) => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    onContentChange?: (id: string, content: TextContent) => void;
    onStartConnect?: (id: string) => void;
    onSubmit?: (id: string) => void;
}

export default function TextCard({
    card,
    isOwner,
    isSelected,
    isEditing,
    zoom = 1,
    onPositionChange,
    onSelect,
    onDelete,
    onEdit,
    onContentChange,
    onStartConnect,
    onSubmit,
}: TextCardProps) {
    const content = card.content as TextContent;
    const [text, setText] = useState(content.text);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        if (text !== content.text) {
            onContentChange?.(card.id, { type: 'text', text });
        }
    };

    return (
        <BaseCard
            card={card}
            isOwner={isOwner}
            isSelected={isSelected}
            zoom={zoom}
            onPositionChange={onPositionChange}
            onSelect={onSelect}
            onDelete={onDelete}
            onEdit={onEdit}
            onStartConnect={onStartConnect}
            onSubmit={onSubmit}
        >
            {isEditing && isOwner ? (
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={handleBlur}
                    className="w-full min-h-[60px] bg-transparent resize-none outline-none text-gray-800 placeholder:text-gray-400"
                    placeholder="テキストを入力..."
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <div
                    className="text-gray-800 whitespace-pre-wrap break-words min-h-[40px]"
                    onDoubleClick={() => isOwner && onEdit?.(card.id)}
                >
                    {content.text || (
                        <span className="text-gray-400 italic">テキストを入力...</span>
                    )}
                </div>
            )}
        </BaseCard>
    );
}
