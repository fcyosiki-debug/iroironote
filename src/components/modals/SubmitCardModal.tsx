'use client';

import { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { SubmissionBox } from '@/types';
import { Send, Box, Loader2 } from 'lucide-react';

interface SubmitCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string;
    userId: string;
    onSubmitSuccess?: () => void;
}

export default function SubmitCardModal({
    isOpen,
    onClose,
    cardId,
    userId,
    onSubmitSuccess,
}: SubmitCardModalProps) {
    const supabase = createClient();
    const [boxes, setBoxes] = useState<SubmissionBox[]>([]);
    const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 提出ボックス一覧を取得
    useEffect(() => {
        if (!isOpen) return;

        const loadBoxes = async () => {
            setIsLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('submission_boxes')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) {
                console.error('提出ボックス取得エラー:', fetchError);
                setError('提出ボックスの読み込みに失敗しました');
            } else {
                const transformedBoxes: SubmissionBox[] = (data || []).map((b) => ({
                    id: b.id,
                    name: b.name,
                    teacherId: b.teacher_id,
                    isPublicView: b.is_public_view,
                    createdAt: b.created_at,
                }));
                setBoxes(transformedBoxes);
            }

            setIsLoading(false);
        };

        loadBoxes();
    }, [isOpen, supabase]);

    // 提出処理
    const handleSubmit = async () => {
        if (!selectedBoxId) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // 同じユーザーの既存提出をすべて削除（ユーザーごとに1カードのみ）
            const { error: deleteError } = await supabase
                .from('submissions')
                .delete()
                .eq('box_id', selectedBoxId)
                .eq('student_id', userId);

            if (deleteError) {
                console.error('既存提出の削除エラー:', deleteError);
            }

            // 新しい提出を作成
            const { error: submitError } = await supabase.from('submissions').insert({
                box_id: selectedBoxId,
                card_id: cardId,
                student_id: userId,
            });

            if (submitError) {
                console.error('提出エラー:', submitError);
                setError('提出に失敗しました');
            } else {
                onSubmitSuccess?.();
                onClose();
            }
        } catch (err) {
            console.error('提出エラー:', err);
            setError('提出に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedBoxId(null);
        setError(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="カードを提出" size="md">
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : boxes.length === 0 ? (
                    <div className="text-center py-8">
                        <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">提出ボックスがありません</p>
                        <p className="text-sm text-gray-400 mt-1">
                            先生が提出ボックスを作成するまでお待ちください
                        </p>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                提出先を選択
                            </label>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {boxes.map((box) => (
                                    <button
                                        key={box.id}
                                        onClick={() => setSelectedBoxId(box.id)}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${selectedBoxId === box.id
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Box className="w-5 h-5 text-pink-600" />
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-700">
                                                {box.name}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <Button
                            className="w-full"
                            disabled={!selectedBoxId || isSubmitting}
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                        >
                            <Send size={16} className="mr-2" />
                            提出する
                        </Button>
                    </>
                )}
            </div>
        </Modal>
    );
}
