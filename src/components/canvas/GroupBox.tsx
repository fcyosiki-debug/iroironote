'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Trash2, Move } from 'lucide-react';

export interface GroupBox {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    label?: string;
}

interface GroupBoxProps {
    group: GroupBox;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<GroupBox>) => void;
    onDelete: (id: string) => void;
}

const GROUP_COLORS = [
    { name: 'blue', bg: 'bg-blue-200/40', border: 'border-blue-400' },
    { name: 'green', bg: 'bg-green-200/40', border: 'border-green-400' },
    { name: 'purple', bg: 'bg-purple-200/40', border: 'border-purple-400' },
    { name: 'pink', bg: 'bg-pink-200/40', border: 'border-pink-400' },
    { name: 'orange', bg: 'bg-orange-200/40', border: 'border-orange-400' },
    { name: 'yellow', bg: 'bg-yellow-200/40', border: 'border-yellow-400' },
];

export function getGroupColorClasses(colorName: string) {
    return GROUP_COLORS.find(c => c.name === colorName) || GROUP_COLORS[0];
}

export default function GroupBoxComponent({
    group,
    isSelected,
    onSelect,
    onUpdate,
    onDelete,
}: GroupBoxProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });
    const boxRef = useRef<HTMLDivElement>(null);

    const colorClasses = getGroupColorClasses(group.color);

    // ドラッグ開始
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.resize-handle')) return;
        if ((e.target as HTMLElement).closest('button')) return;

        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - group.x,
            y: e.clientY - group.y,
        });
        onSelect(group.id);
    };

    // リサイズ開始
    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            w: group.width,
            h: group.height,
        });
        onSelect(group.id);
    };

    // ドラッグ/リサイズ中
    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newX = Math.max(0, e.clientX - dragOffset.x);
                const newY = Math.max(0, e.clientY - dragOffset.y);
                onUpdate(group.id, { x: newX, y: newY });
            } else if (isResizing) {
                const deltaX = e.clientX - resizeStart.x;
                const deltaY = e.clientY - resizeStart.y;
                const newWidth = Math.max(100, resizeStart.w + deltaX);
                const newHeight = Math.max(100, resizeStart.h + deltaY);
                onUpdate(group.id, { width: newWidth, height: newHeight });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, dragOffset, resizeStart, group.id, onUpdate]);

    return (
        <div
            ref={boxRef}
            className={cn(
                'absolute rounded-xl border-2 border-dashed transition-shadow',
                colorClasses.bg,
                colorClasses.border,
                isSelected && 'ring-2 ring-primary-500 ring-offset-2',
                isDragging && 'opacity-80'
            )}
            style={{
                left: group.x,
                top: group.y,
                width: group.width,
                height: group.height,
                cursor: isDragging ? 'grabbing' : 'grab',
                zIndex: 0,
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(group.id);
            }}
        >
            {/* ラベル */}
            {group.label && (
                <div className="absolute -top-6 left-2 text-sm font-medium text-gray-600 bg-white/80 px-2 py-0.5 rounded">
                    {group.label}
                </div>
            )}

            {/* ツールバー（選択時のみ） */}
            {isSelected && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 bg-white rounded-lg shadow-lg p-1">
                    {GROUP_COLORS.map((color) => (
                        <button
                            key={color.name}
                            onClick={(e) => {
                                e.stopPropagation();
                                onUpdate(group.id, { color: color.name });
                            }}
                            className={cn(
                                'w-6 h-6 rounded-full border-2 transition-transform',
                                color.bg.replace('/40', ''),
                                color.border,
                                group.color === color.name && 'scale-110 ring-2 ring-primary-500'
                            )}
                        />
                    ))}
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(group.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500"
                        title="削除"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )}

            {/* リサイズハンドル（右下） */}
            <div
                className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center"
                onMouseDown={handleResizeStart}
            >
                <div className="w-3 h-3 border-r-2 border-b-2 border-gray-400/50" />
            </div>
        </div>
    );
}
