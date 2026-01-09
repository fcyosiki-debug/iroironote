'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import BaseCard from './BaseCard';
import type { Card, DrawingContent, DrawingPath } from '@/types';
import { Eraser, Pencil } from 'lucide-react';

interface DrawingCardProps {
    card: Card;
    isOwner: boolean;
    isSelected?: boolean;
    isEditing?: boolean;
    zoom?: number;
    onPositionChange?: (id: string, x: number, y: number) => void;
    onSelect?: (id: string) => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    onContentChange?: (id: string, content: DrawingContent) => void;
    onStartConnect?: (id: string) => void;
    onSubmit?: (id: string) => void;
}

const COLORS = ['#1f2937', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
const BRUSH_SIZES = [2, 4, 8];

export default function DrawingCard({
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
}: DrawingCardProps) {
    const content = card.content as DrawingContent;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
    const [paths, setPaths] = useState<DrawingPath[]>(content.paths || []);
    const [color, setColor] = useState(COLORS[0]);
    const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

    // キャンバスを再描画
    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // クリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 保存されたパスを描画
        paths.forEach((path) => {
            if (path.points.length < 2) return;

            ctx.beginPath();
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.moveTo(path.points[0].x, path.points[0].y);
            path.points.slice(1).forEach((point) => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        });

        // 現在描画中のパス
        if (currentPath.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
            ctx.lineWidth = tool === 'eraser' ? brushSize * 3 : brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.moveTo(currentPath[0].x, currentPath[0].y);
            currentPath.slice(1).forEach((point) => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        }
    }, [paths, currentPath, color, brushSize, tool]);

    useEffect(() => {
        redrawCanvas();
    }, [redrawCanvas]);

    // マウスイベント
    const getPosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isEditing || !isOwner) return;
        e.stopPropagation();

        setIsDrawing(true);
        const pos = getPosition(e);
        setCurrentPath([pos]);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !isEditing || !isOwner) return;

        const pos = getPosition(e);
        setCurrentPath((prev) => [...prev, pos]);
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;

        setIsDrawing(false);

        if (currentPath.length > 1) {
            const newPath: DrawingPath = {
                points: currentPath,
                color: tool === 'eraser' ? '#ffffff' : color,
                width: tool === 'eraser' ? brushSize * 3 : brushSize,
            };

            const newPaths = [...paths, newPath];
            setPaths(newPaths);
            onContentChange?.(card.id, { type: 'drawing', paths: newPaths });
        }

        setCurrentPath([]);
    };

    const handleClear = () => {
        setPaths([]);
        onContentChange?.(card.id, { type: 'drawing', paths: [] });

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
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
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={card.width - 24}
                    height={card.height - 60}
                    className="bg-white rounded-lg border border-gray-100 cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />

                {/* ツールバー（編集モードのみ） */}
                {isEditing && isOwner && (
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-md">
                        {/* ツール選択 */}
                        <div className="flex gap-1">
                            <button
                                onClick={() => setTool('pen')}
                                className={`p-1.5 rounded ${tool === 'pen' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={() => setTool('eraser')}
                                className={`p-1.5 rounded ${tool === 'eraser' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            >
                                <Eraser size={14} />
                            </button>
                        </div>

                        {/* 色選択 */}
                        {tool === 'pen' && (
                            <div className="flex gap-1">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-5 h-5 rounded-full border-2 ${color === c ? 'border-primary-500 scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* ブラシサイズ */}
                        <div className="flex gap-1">
                            {BRUSH_SIZES.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setBrushSize(size)}
                                    className={`w-6 h-6 flex items-center justify-center rounded ${brushSize === size ? 'bg-primary-100' : 'hover:bg-gray-100'}`}
                                >
                                    <div
                                        className="rounded-full bg-gray-600"
                                        style={{ width: size + 2, height: size + 2 }}
                                    />
                                </button>
                            ))}
                        </div>

                        {/* クリア */}
                        <button
                            onClick={handleClear}
                            className="text-xs text-red-500 hover:text-red-600 px-2 py-1"
                        >
                            クリア
                        </button>
                    </div>
                )}
            </div>
        </BaseCard>
    );
}
