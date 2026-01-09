'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Modal } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { SubmissionBox, Submission, Card, Workspace } from '@/types';
import {
    ArrowLeft,
    Box,
    Eye,
    EyeOff,
    Send,
    Loader2,
    User,
    Clock,
} from 'lucide-react';
import { formatDate, getCardColorClass } from '@/lib/utils';

export default function BoxPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const supabase = createClient();

    const boxId = params.id as string;
    const [box, setBox] = useState<SubmissionBox | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [myWorkspaces, setMyWorkspaces] = useState<Workspace[]>([]);
    const [myCards, setMyCards] = useState<Card[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 提出モーダル
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
    const [selectedCards, setSelectedCards] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 認証チェック
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    // データ取得
    useEffect(() => {
        if (!user || !boxId) return;
        loadData();

        // リアルタイム更新を購読
        const channel = supabase
            .channel(`box-page:${boxId}`)
            // 提出の変更を購読
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'submissions',
                    filter: `box_id=eq.${boxId}`,
                },
                () => {
                    loadSubmissions();
                }
            )
            // ボックス設定の変更を購読（公開設定など）
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'submission_boxes',
                    filter: `id=eq.${boxId}`,
                },
                (payload) => {
                    // ボックス設定を更新
                    if (payload.new) {
                        const updated = payload.new as { id: string; name: string; teacher_id: string; is_public_view: boolean; created_at: string };
                        setBox({
                            id: updated.id,
                            name: updated.name,
                            teacherId: updated.teacher_id,
                            isPublicView: updated.is_public_view,
                            createdAt: updated.created_at,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, boxId, supabase]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // ボックス情報を取得
            const { data: boxData, error: boxError } = await supabase
                .from('submission_boxes')
                .select('*')
                .eq('id', boxId)
                .single();

            if (boxError || !boxData) {
                setError('提出ボックスが見つかりません');
                return;
            }

            // 型変換（snake_case -> camelCase）
            const transformedBox: SubmissionBox = {
                id: boxData.id,
                name: boxData.name,
                teacherId: boxData.teacher_id,
                isPublicView: boxData.is_public_view,
                createdAt: boxData.created_at,
            };

            setBox(transformedBox);
            await loadSubmissions();

            // 自分のワークスペースを取得
            const { data: wsData } = await supabase
                .from('workspaces')
                .select('*')
                .eq('owner_id', user?.id)
                .eq('type', 'private');

            setMyWorkspaces(wsData || []);
        } catch (err) {
            console.error('エラー:', err);
            setError('データの読み込みに失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const loadSubmissions = async () => {
        // 外部キー制約がないため、リレーションクエリは使用せず個別に取得
        const { data: subsData, error: subsError } = await supabase
            .from('submissions')
            .select('*')
            .eq('box_id', boxId)
            .order('submitted_at', { ascending: false });

        if (subsError) {
            console.error('提出データ取得エラー:', subsError);
            return;
        }

        if (!subsData || subsData.length === 0) {
            setSubmissions([]);
            return;
        }

        // カードIDを取得
        const cardIds = subsData.map((s) => s.card_id);

        // カードデータを個別に取得
        const { data: cardsData, error: cardsError } = await supabase
            .from('cards')
            .select('*')
            .in('id', cardIds);

        if (cardsError) {
            console.error('カードデータ取得エラー:', cardsError);
        }

        // カードマップを作成
        const cardsMap = new Map<string, Card>();
        (cardsData || []).forEach((c) => {
            cardsMap.set(c.id, {
                id: c.id,
                workspaceId: c.workspace_id,
                creatorId: c.creator_id,
                creatorNickname: c.creator_nickname,
                cardType: c.card_type,
                content: c.content,
                positionX: c.position_x,
                positionY: c.position_y,
                width: c.width,
                height: c.height,
                color: c.color,
                createdAt: c.created_at,
                updatedAt: c.updated_at,
            });
        });

        const transformedSubs: Submission[] = subsData.map((s) => ({
            id: s.id,
            boxId: s.box_id,
            cardId: s.card_id,
            studentId: s.student_id,
            submittedAt: s.submitted_at,
            card: cardsMap.get(s.card_id),
        }));

        setSubmissions(transformedSubs);
    };

    // ワークスペース選択時にカードを取得
    const handleWorkspaceSelect = async (wsId: string) => {
        setSelectedWorkspace(wsId);
        setSelectedCards([]);

        const { data: cardsData } = await supabase
            .from('cards')
            .select('*')
            .eq('workspace_id', wsId)
            .eq('creator_id', user?.id);

        const transformedCards: Card[] = (cardsData || []).map((c) => ({
            id: c.id,
            workspaceId: c.workspace_id,
            creatorId: c.creator_id,
            creatorNickname: c.creator_nickname,
            cardType: c.card_type,
            content: c.content,
            positionX: c.position_x,
            positionY: c.position_y,
            width: c.width,
            height: c.height,
            color: c.color,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
        }));

        setMyCards(transformedCards);
    };

    // カード選択をトグル
    const toggleCardSelection = (cardId: string) => {
        setSelectedCards((prev) =>
            prev.includes(cardId)
                ? prev.filter((id) => id !== cardId)
                : [...prev, cardId]
        );
    };

    // 提出
    const handleSubmit = async () => {
        if (selectedCards.length === 0) return;

        setIsSubmitting(true);
        try {
            const newSubmissions = selectedCards.map((cardId) => ({
                box_id: boxId,
                card_id: cardId,
                student_id: user?.id,
            }));

            await supabase.from('submissions').insert(newSubmissions);

            setShowSubmitModal(false);
            setSelectedCards([]);
            setSelectedWorkspace(null);
            await loadSubmissions();
        } catch (err) {
            console.error('提出エラー:', err);
            alert('提出に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 公開表示トグル（教師のみ）
    const togglePublicView = async () => {
        if (!box) return;

        const { error: updateError } = await supabase
            .from('submission_boxes')
            .update({ is_public_view: !box.isPublicView })
            .eq('id', boxId);

        if (!updateError) {
            setBox({ ...box, isPublicView: !box.isPublicView });
        }
    };

    const isTeacher = user?.role === 'teacher';
    const canViewSubmissions = isTeacher || box?.isPublicView;

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
        );
    }

    if (error || !box) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error || 'エラーが発生しました'}</p>
                    <Button onClick={() => router.push('/dashboard')}>
                        ダッシュボードに戻る
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50/30">
            {/* ヘッダー */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                            >
                                <ArrowLeft size={18} className="mr-1" />
                                戻る
                            </Button>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-card-pink rounded-xl flex items-center justify-center">
                                    <Box className="w-5 h-5 text-pink-600" />
                                </div>
                                <div>
                                    <h1 className="font-semibold text-gray-900">{box.name}</h1>
                                    <p className="text-xs text-gray-500">
                                        {submissions.length}件の提出
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* 公開表示トグル（教師のみ） */}
                            {isTeacher && (
                                <Button
                                    variant={box.isPublicView ? 'primary' : 'secondary'}
                                    size="sm"
                                    onClick={togglePublicView}
                                >
                                    {box.isPublicView ? (
                                        <>
                                            <Eye size={16} className="mr-1" />
                                            公開中
                                        </>
                                    ) : (
                                        <>
                                            <EyeOff size={16} className="mr-1" />
                                            非公開
                                        </>
                                    )}
                                </Button>
                            )}

                            {/* 提出ボタン（生徒のみ） */}
                            {!isTeacher && (
                                <Button onClick={() => setShowSubmitModal(true)}>
                                    <Send size={16} className="mr-1" />
                                    カードを提出
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {!canViewSubmissions && !isTeacher ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <EyeOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            提出は非公開です
                        </h2>
                        <p className="text-gray-500">
                            先生が公開を許可するまで、他の人の提出を見ることはできません
                        </p>
                    </div>
                ) : submissions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                        <Box className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            まだ提出がありません
                        </h2>
                        <p className="text-gray-500">
                            {isTeacher
                                ? '生徒からの提出を待っています'
                                : 'カードを提出してみましょう！'}
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {submissions.map((sub) => (
                            <div
                                key={sub.id}
                                className={`rounded-2xl ${sub.card ? getCardColorClass(sub.card.color) : 'bg-white'
                                    } shadow-card overflow-hidden`}
                            >
                                {/* カードヘッダー */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">
                                            {sub.card?.creatorNickname || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <Clock size={12} />
                                        {formatDate(sub.submittedAt)}
                                    </div>
                                </div>

                                {/* カードコンテンツ */}
                                <div className="p-4 min-h-[100px]">
                                    {sub.card?.cardType === 'text' && (
                                        <p className="text-gray-800 whitespace-pre-wrap">
                                            {(sub.card.content as { text: string }).text || '(空のテキスト)'}
                                        </p>
                                    )}
                                    {sub.card?.cardType === 'drawing' && (
                                        <div className="text-gray-500 text-sm italic">
                                            [手描きカード]
                                        </div>
                                    )}
                                    {sub.card?.cardType === 'media' && (
                                        <div className="text-gray-500 text-sm italic">
                                            [メディアカード]
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 提出モーダル */}
            <Modal
                isOpen={showSubmitModal}
                onClose={() => {
                    setShowSubmitModal(false);
                    setSelectedWorkspace(null);
                    setSelectedCards([]);
                }}
                title="カードを提出"
                size="lg"
            >
                <div className="space-y-6">
                    {/* ワークスペース選択 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ワークスペースを選択
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {myWorkspaces.map((ws) => (
                                <button
                                    key={ws.id}
                                    onClick={() => handleWorkspaceSelect(ws.id)}
                                    className={`p-3 rounded-xl border-2 text-left transition-all ${selectedWorkspace === ws.id
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="font-medium text-gray-700">{ws.name}</span>
                                </button>
                            ))}
                            {myWorkspaces.length === 0 && (
                                <p className="col-span-2 text-gray-500 text-center py-4">
                                    ワークスペースがありません
                                </p>
                            )}
                        </div>
                    </div>

                    {/* カード選択 */}
                    {selectedWorkspace && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                提出するカードを選択（複数可）
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                                {myCards.map((card) => (
                                    <button
                                        key={card.id}
                                        onClick={() => toggleCardSelection(card.id)}
                                        className={`p-3 rounded-xl border-2 text-left transition-all ${selectedCards.includes(card.id)
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            } ${getCardColorClass(card.color)}`}
                                    >
                                        <span className="text-xs text-gray-500">
                                            {card.cardType === 'text'
                                                ? 'テキスト'
                                                : card.cardType === 'drawing'
                                                    ? '手描き'
                                                    : 'メディア'}
                                        </span>
                                        {card.cardType === 'text' && (
                                            <p className="text-sm text-gray-700 truncate mt-1">
                                                {(card.content as { text: string }).text || '(空)'}
                                            </p>
                                        )}
                                    </button>
                                ))}
                                {myCards.length === 0 && (
                                    <p className="col-span-2 text-gray-500 text-center py-4">
                                        カードがありません
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 提出ボタン */}
                    <Button
                        className="w-full"
                        disabled={selectedCards.length === 0 || isSubmitting}
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                    >
                        <Send size={16} className="mr-2" />
                        {selectedCards.length > 0
                            ? `${selectedCards.length}件のカードを提出`
                            : 'カードを選択してください'}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
