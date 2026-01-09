'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import BaseCard from './BaseCard';
import { Modal } from '@/components/ui';
import type { Card, MediaContent } from '@/types';
import { Upload, FileText, Image as ImageIcon, X, Maximize2 } from 'lucide-react';

interface MediaCardProps {
    card: Card;
    isOwner: boolean;
    isSelected?: boolean;
    isEditing?: boolean;
    zoom?: number;
    onPositionChange?: (id: string, x: number, y: number) => void;
    onSelect?: (id: string) => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
    onContentChange?: (id: string, content: MediaContent) => void;
    onStartConnect?: (id: string) => void;
    onUpload?: (file: File) => Promise<string | null>;
    onSubmit?: (id: string) => void;
}

export default function MediaCard({
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
    onUpload,
    onSubmit,
}: MediaCardProps) {
    const content = card.content as MediaContent;
    const [isUploading, setIsUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        if (!onUpload) return;

        // ファイルタイプを確認
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';

        if (!isImage && !isPdf) {
            alert('画像またはPDFファイルのみアップロードできます');
            return;
        }

        setIsUploading(true);
        try {
            const url = await onUpload(file);
            if (url) {
                onContentChange?.(card.id, {
                    type: 'media',
                    url,
                    fileName: file.name,
                    fileType: isImage ? 'image' : 'pdf',
                });
            }
        } catch (error) {
            console.error('アップロードエラー:', error);
            alert('アップロードに失敗しました');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleClick = () => {
        if (isEditing && isOwner && !content.url) {
            fileInputRef.current?.click();
        } else if (content.url) {
            // メディアがある場合はプレビューを表示
            setShowPreview(true);
        }
    };

    const handleRemove = () => {
        onContentChange?.(card.id, {
            type: 'media',
            url: '',
            fileName: '',
            fileType: 'image',
        });
    };

    return (
        <>
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
                <div
                    className={`relative min-h-[100px] rounded-lg overflow-hidden ${!content.url && isEditing ? 'border-2 border-dashed border-gray-300' : ''
                        } ${dragOver ? 'border-primary-400 bg-primary-50' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    {content.url ? (
                        <>
                            {content.fileType === 'image' ? (
                                <div
                                    className="relative w-full h-full min-h-[100px] cursor-pointer group"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowPreview(true);
                                    }}
                                >
                                    <Image
                                        src={content.url}
                                        alt={content.fileName}
                                        fill
                                        className="object-contain"
                                    />
                                    {/* 拡大アイコン */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowPreview(true);
                                    }}
                                >
                                    <FileText className="w-8 h-8 text-red-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 truncate">
                                            {content.fileName}
                                        </p>
                                        <p className="text-xs text-gray-400">クリックして拡大</p>
                                    </div>
                                    <Maximize2 className="w-5 h-5 text-gray-400" />
                                </div>
                            )}

                            {/* 削除ボタン（オーナーのみ） */}
                            {isOwner && isEditing && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove();
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </>
                    ) : isEditing && isOwner ? (
                        <div
                            className="flex flex-col items-center justify-center py-6 cursor-pointer"
                            onClick={handleClick}
                        >
                            {isUploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-gray-500">アップロード中...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                        {dragOver ? (
                                            <Upload className="w-6 h-6 text-primary-500" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 text-gray-400" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 text-center">
                                        クリックまたはドラッグ＆ドロップ
                                        <br />
                                        <span className="text-xs">画像・PDFをアップロード</span>
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-6">
                            <p className="text-sm text-gray-400">メディアなし</p>
                        </div>
                    )}
                </div>

                {/* 非表示のファイル入力 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                    }}
                />
            </BaseCard>

            {/* 拡大プレビューモーダル */}
            <Modal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title={content.fileName || 'プレビュー'}
                size="lg"
            >
                <div className="flex flex-col items-center">
                    {content.fileType === 'image' ? (
                        <div className="relative w-full" style={{ height: '70vh' }}>
                            <Image
                                src={content.url}
                                alt={content.fileName}
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="w-full" style={{ height: '70vh' }}>
                            <iframe
                                src={content.url}
                                className="w-full h-full border-0 rounded-lg"
                                title={content.fileName}
                            />
                        </div>
                    )}
                    <p className="text-sm text-gray-500 mt-4">{content.fileName}</p>
                </div>
            </Modal>
        </>
    );
}
