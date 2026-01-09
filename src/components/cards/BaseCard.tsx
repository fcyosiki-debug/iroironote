'use client';

import { useRef, useState, useCallback, type ReactNode } from 'react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import type { Card, CardColor } from '@/types';
import { Trash2, Link2, Check, Send } from 'lucide-react';

// カード色の選択コンポーネント
interface CardColorPickerProps {
    value: CardColor;
    onChange: (color: CardColor) => void;
}

const colorOptions: { color: CardColor; bg: string; name: string }[] = [
    { color: 'yellow', bg: 'bg-yellow-300', name: '黄色' },
    { color: 'pink', bg: 'bg-pink-300', name: 'ピンク' },
    { color: 'green', bg: 'bg-green-300', name: '緑' },
    { color: 'blue', bg: 'bg-blue-300', name: '青' },
    { color: 'purple', bg: 'bg-purple-300', name: '紫' },
    { color: 'orange', bg: 'bg-orange-300', name: 'オレンジ' },
];

export function CardColorPicker({ value, onChange }: CardColorPickerProps) {
    return (
        <div className="flex gap-2">
            {colorOptions.map((option) => (
                <button
                    key={option.color}
                    type="button"
                    onClick={() => onChange(option.color)}
                    className={`w-8 h-8 rounded-full ${option.bg} flex items-center justify-center transition-transform hover:scale-110 ${value === option.color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                        }`}
                    title={option.name}
                >
                    {value === option.color && (
                        <Check size={16} className="text-white drop-shadow" />
                    )}
                </button>
            ))}
        </div>
    );
}

interface BaseCardProps {
    card: Card;
    isOwner: boolean;
    isSelected?: boolean;
    zoom?: number;
    onPositionChange?: (id: string, x: number, y: number) => void;
    onSelect?: (id: string) => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    onStartConnect?: (id: string) => void;
    onSubmit?: (id: string) => void;
    children: ReactNode;
}

// カード色のマッピング
const colorClasses: Record<CardColor, { bg: string; border: string; header: string }> = {
    yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        header: 'bg-yellow-100',
    },
    pink: {
        bg: 'bg-pink-50',
        border: 'border-pink-200',
        header: 'bg-pink-100',
    },
    green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        header: 'bg-green-100',
    },
    blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        header: 'bg-blue-100',
    },
    purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        header: 'bg-purple-100',
    },
    orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        header: 'bg-orange-100',
    },
};

export default function BaseCard({
    card,
    isOwner,
    isSelected,
    zoom = 1,
    onPositionChange,
    onSelect,
    onDelete,
    onEdit,
    onStartConnect,
    onSubmit,
    children,
}: BaseCardProps) {
    const nodeRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const colors = colorClasses[card.color] || colorClasses.yellow;

    const handleDragStart = useCallback(() => {
        setIsDragging(true);
    }, []);

    const handleDragStop = useCallback(
        (_e: DraggableEvent, data: DraggableData) => {
            setIsDragging(false);
            onPositionChange?.(card.id, data.x, data.y);
        },
        [card.id, onPositionChange]
    );

    const handleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!isDragging) {
                onSelect?.(card.id);
            }
        },
        [card.id, isDragging, onSelect]
    );

    const handleDoubleClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            if (isOwner) {
                onEdit?.(card.id);
            }
        },
        [card.id, isOwner, onEdit]
    );

    const handleDelete = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete?.(card.id);
        },
        [card.id, onDelete]
    );

    const handleStartConnect = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onStartConnect?.(card.id);
        },
        [card.id, onStartConnect]
    );

    const handleSubmit = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onSubmit?.(card.id);
        },
        [card.id, onSubmit]
    );

    return (
        <Draggable
            nodeRef={nodeRef}
            position={{ x: card.positionX, y: card.positionY }}
            onStart={handleDragStart}
            onStop={handleDragStop}
            scale={zoom}
            handle=".drag-handle"
        >
            <div
                ref={nodeRef}
                className={`absolute rounded-xl shadow-lg transition-shadow cursor-pointer ${colors.bg} ${colors.border} border-2 ${isSelected
                    ? 'ring-2 ring-primary-500 ring-offset-2 shadow-xl'
                    : 'hover:shadow-xl'
                    }`}
                style={{
                    width: card.width,
                    minHeight: card.height,
                }}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
            >
                {/* ヘッダー（ドラッグハンドル） */}
                <div
                    className={`drag-handle flex items-center justify-between px-3 py-2 rounded-t-lg cursor-move ${colors.header}`}
                >
                    <span className="text-xs font-medium text-gray-600 truncate">
                        {card.creatorNickname}
                    </span>
                    {isOwner && isSelected && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleSubmit}
                                className="p-1 hover:bg-blue-100 rounded transition-colors"
                                title="提出"
                            >
                                <Send size={14} className="text-blue-500" />
                            </button>
                            <button
                                onClick={handleStartConnect}
                                className="p-1 hover:bg-white/50 rounded transition-colors"
                                title="接続"
                            >
                                <Link2 size={14} className="text-gray-500" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                title="削除"
                            >
                                <Trash2 size={14} className="text-red-500" />
                            </button>
                        </div>
                    )}
                </div>

                {/* コンテンツ */}
                <div className="p-3">{children}</div>
            </div>
        </Draggable>
    );
}
