'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Canvas } from '@/components/canvas';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Workspace, Card, CardConnection } from '@/types';
import { ArrowLeft, Users, Lock, Loader2 } from 'lucide-react';

export default function WorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const supabase = createClient();

    const workspaceId = params.id as string;
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [connections, setConnections] = useState<CardConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 認証チェック
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    // データ取得
    useEffect(() => {
        if (!user || !workspaceId) return;

        const loadWorkspace = async () => {
            setIsLoading(true);
            try {
                // ワークスペース情報を取得
                const { data: wsData, error: wsError } = await supabase
                    .from('workspaces')
                    .select('*')
                    .eq('id', workspaceId)
                    .single();

                if (wsError || !wsData) {
                    setError('ワークスペースが見つかりません');
                    return;
                }

                setWorkspace(wsData);

                // カードを取得
                const { data: cardsData } = await supabase
                    .from('cards')
                    .select('*')
                    .eq('workspace_id', workspaceId)
                    .order('created_at', { ascending: true });

                // 接続を取得
                const cardIds = cardsData?.map((c) => c.id) || [];
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let connectionsData: any[] = [];

                if (cardIds.length > 0) {
                    const { data: connData } = await supabase
                        .from('card_connections')
                        .select('*')
                        .or(
                            cardIds.map((id) => `from_card_id.eq.${id}`).join(',') +
                            ',' +
                            cardIds.map((id) => `to_card_id.eq.${id}`).join(',')
                        );
                    connectionsData = connData || [];
                }

                // データを変換
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

                const transformedConnections: CardConnection[] = (connectionsData || []).map((c) => ({
                    id: c.id,
                    fromCardId: c.from_card_id,
                    toCardId: c.to_card_id,
                    createdAt: c.created_at,
                }));

                setCards(transformedCards);
                setConnections(transformedConnections);
            } catch (err) {
                console.error('エラー:', err);
                setError('データの読み込みに失敗しました');
            } finally {
                setIsLoading(false);
            }
        };

        loadWorkspace();
    }, [user, workspaceId, supabase]);

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
                    <p className="text-gray-500">読み込み中...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={() => router.push('/dashboard')}>
                        ダッシュボードに戻る
                    </Button>
                </div>
            </div>
        );
    }

    if (!workspace) return null;

    const isShared = workspace.type === 'shared';

    return (
        <div className="h-screen flex flex-col bg-gray-100">
            {/* ヘッダー */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-50">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard')}
                    >
                        <ArrowLeft size={18} className="mr-1" />
                        戻る
                    </Button>

                    <div className="flex items-center gap-2">
                        <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${isShared ? 'bg-purple-100' : 'bg-blue-100'
                                }`}
                        >
                            {isShared ? (
                                <Users size={16} className="text-purple-600" />
                            ) : (
                                <Lock size={16} className="text-blue-600" />
                            )}
                        </div>
                        <div>
                            <h1 className="font-semibold text-gray-900">{workspace.name}</h1>
                            <p className="text-xs text-gray-500">
                                {isShared ? '共有ワークスペース • リアルタイム協働' : 'プライベートワークスペース'}
                            </p>
                        </div>
                    </div>
                </div>

                {isShared && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        リアルタイム接続中
                    </div>
                )}
            </header>

            {/* キャンバス */}
            <main className="flex-1 relative">
                <Canvas
                    workspaceId={workspaceId}
                    isShared={isShared}
                    initialCards={cards}
                    initialConnections={connections}
                />
            </main>
        </div>
    );
}
