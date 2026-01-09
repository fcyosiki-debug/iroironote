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
    const prevEditingRef = useRef(isEditing);
    const textRef = useRef(text);

    // textの変更を追跡
    useEffect(() => {
        textRef.current = text;
    }, [text]);

    // 外部からのコンテンツ更新を同期
    useEffect(() => {
        setText(content.text);
    }, [content.text]);

    // 編集モード終了時に保存（アンマウント前に確実に保存）
    useEffect(() => {
        if (prevEditingRef.current === true && isEditing === false) {
            // 編集モードが終了した
            if (textRef.current !== content.text) {
                console.log('編集終了により保存:', card.id, textRef.current);
                onContentChange?.(card.id, { type: 'text', text: textRef.current });
            }
        }
        prevEditingRef.current = isEditing;
    }, [isEditing, card.id, content.text, onContentChange]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    const handleBlur = () => {
        // 注意：キャンバスクリック時はこのblurが呼ばれない可能性があるため、
        // 上記のuseEffectでも保存を行っている
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
