'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { TextCard, DrawingCard, MediaCard, CardColorPicker } from '@/components/cards';
import { ConnectionLines } from './ConnectionLine';
import CursorOverlay from './CursorOverlay';
import GroupBoxComponent, { GroupBox } from './GroupBox';
import SubmitCardModal from '@/components/modals/SubmitCardModal';
import { Button, Modal } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { generateId, throttle, getRandomCursorColor } from '@/lib/utils';
import type { Card, CardType, CardColor, CardContent, CardConnection, RealtimeCursor, TextContent, DrawingContent, MediaContent } from '@/types';
import { Plus, Type, Pencil, Image, ZoomIn, ZoomOut, Move, Square } from 'lucide-react';

interface CanvasProps {
    workspaceId: string;
    isShared: boolean;
    initialCards?: Card[];
    initialConnections?: CardConnection[];
}

export default function Canvas({
    workspaceId,
    isShared,
    initialCards = [],
    initialConnections = [],
}: CanvasProps) {
    const { user } = useAuth();
    const supabase = createClient();
    const canvasRef = useRef<HTMLDivElement>(null);

    // 状態
    const [cards, setCards] = useState<Card[]>(initialCards);
    const [connections, setConnections] = useState<CardConnection[]>(initialConnections);
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [editingCardId, setEditingCardId] = useState<string | null>(null);
    const [cursors, setCursors] = useState<RealtimeCursor[]>([]);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // カード作成モーダル
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCardType, setNewCardType] = useState<CardType>('text');
    const [newCardColor, setNewCardColor] = useState<CardColor>('yellow');

    // 接続モード
    const [connectingFromId, setConnectingFromId] = useState<string | null>(null);

    // グループボックス
    const [groups, setGroups] = useState<GroupBox[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    // 提出モーダル
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submittingCardId, setSubmittingCardId] = useState<string | null>(null);

    // カーソル色
    const cursorColor = useRef(getRandomCursorColor());

    // 編集中カードIDをrefで追跡（リアルタイム更新との競合防止用）
    const editingCardIdRef = useRef<string | null>(null);

    // Supabaseのsnake_caseデータをcamelCaseのCardに変換
    const convertToCard = (data: Record<string, unknown>): Card => ({
        id: data.id as string,
        workspaceId: data.workspace_id as string,
        creatorId: data.creator_id as string,
        creatorNickname: data.creator_nickname as string,
        cardType: data.card_type as CardType,
        content: data.content as CardContent,
        positionX: data.position_x as number,
        positionY: data.position_y as number,
        width: data.width as number,
        height: data.height as number,
        color: data.color as CardColor,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
    });

    // リアルタイム同期（共有ワークスペースのみ）
    useEffect(() => {
        if (!isShared || !user) return;

        // カード変更のリアルタイム購読
        const cardsChannel = supabase
            .channel(`cards:${workspaceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'cards',
                    filter: `workspace_id=eq.${workspaceId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newCard = convertToCard(payload.new);
                        setCards((prev) => [...prev.filter(c => c.id !== newCard.id), newCard]);
                    } else if (payload.eventType === 'UPDATE') {
                        const updated = convertToCard(payload.new);
                        // 編集中のカードはリアルタイム更新をスキップ（競合防止）
                        if (editingCardIdRef.current === updated.id) {
                            return;
                        }
                        setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                    } else if (payload.eventType === 'DELETE') {
                        const deleted = payload.old as { id: string };
                        setCards((prev) => prev.filter((c) => c.id !== deleted.id));
                    }
                }
            )
            .subscribe();

        // 接続線変更のリアルタイム購読
        const connectionsChannel = supabase
            .channel(`connections:${workspaceId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'card_connections',
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const data = payload.new;
                        const newConnection: CardConnection = {
                            id: data.id as string,
                            fromCardId: data.from_card_id as string,
                            toCardId: data.to_card_id as string,
                            createdAt: data.created_at as string,
                        };
                        setConnections((prev) => [...prev.filter(c => c.id !== newConnection.id), newConnection]);
                    } else if (payload.eventType === 'DELETE') {
                        const deleted = payload.old as { id: string };
                        setConnections((prev) => prev.filter((c) => c.id !== deleted.id));
                    }
                }
            )
            .subscribe();

        // カーソル位置のPresence
        const presenceChannel = supabase.channel(`presence:${workspaceId}`);

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                const cursorList: RealtimeCursor[] = [];

                Object.values(state).forEach((presences) => {
                    presences.forEach((presence: unknown) => {
                        const p = presence as { user_id: string; nickname: string; x: number; y: number; color: string };
                        if (p.user_id !== user.id) {
                            cursorList.push({
                                oderId: p.user_id,
                                nickname: p.nickname,
                                x: p.x,
                                y: p.y,
                                color: p.color,
                            });
                        }
                    });
                });

                setCursors(cursorList);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        user_id: user.id,
                        nickname: user.nickname,
                        x: 0,
                        y: 0,
                        color: cursorColor.current,
                    });
                }
            });

        return () => {
            supabase.removeChannel(cardsChannel);
            supabase.removeChannel(connectionsChannel);
            supabase.removeChannel(presenceChannel);
        };
    }, [isShared, workspaceId, user, supabase]);

    // マウス移動でカーソル位置を更新
    const handleMouseMove = useCallback(
        throttle((e: React.MouseEvent) => {
            if (!isShared || !user || !canvasRef.current) return;

            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - offset.x) / zoom;
            const y = (e.clientY - rect.top - offset.y) / zoom;

            const presenceChannel = supabase.channel(`presence:${workspaceId}`);
            presenceChannel.track({
                user_id: user.id,
                nickname: user.nickname,
                x,
                y,
                color: cursorColor.current,
            });
        }, 50),
        [isShared, user, workspaceId, zoom, offset, supabase]
    );

    // カードを作成
    const createCard = async () => {
        if (!user) return;

        const newCard: Card = {
            id: generateId(),
            workspaceId,
            creatorId: user.id,
            creatorNickname: user.nickname || 'Unknown',
            cardType: newCardType,
            content: getDefaultContent(newCardType),
            positionX: 100 + Math.random() * 200,
            positionY: 100 + Math.random() * 200,
            width: newCardType === 'drawing' ? 300 : 200,
            height: newCardType === 'drawing' ? 250 : 150,
            color: newCardColor,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        console.log('カード作成開始:', newCard);

        // データベースに保存
        const { error } = await supabase.from('cards').insert({
            id: newCard.id,
            workspace_id: workspaceId,
            creator_id: user.id,
            creator_nickname: user.nickname,
            card_type: newCardType,
            content: newCard.content,
            position_x: newCard.positionX,
            position_y: newCard.positionY,
            width: newCard.width,
            height: newCard.height,
            color: newCardColor,
        });

        if (error) {
            console.error('カード作成エラー:', error);
            alert(`カード作成エラー: ${error.message}`);
            return;
        }

        console.log('カード作成成功');
        setCards((prev) => [...prev, newCard]);
        setShowCreateModal(false);
        setEditingCardId(newCard.id);
        editingCardIdRef.current = newCard.id;
        setSelectedCardId(newCard.id);
    };

    // カード位置を更新
    const updateCardPosition = async (id: string, x: number, y: number) => {
        setCards((prev) =>
            prev.map((c) => (c.id === id ? { ...c, positionX: x, positionY: y } : c))
        );

        // データベースを更新（デバウンス済み）
        await supabase
            .from('cards')
            .update({ position_x: x, position_y: y })
            .eq('id', id);
    };

    // カードコンテンツを更新
    const updateCardContent = async (id: string, content: CardContent) => {
        setCards((prev) =>
            prev.map((c) => (c.id === id ? { ...c, content } : c))
        );

        await supabase
            .from('cards')
            .update({ content })
            .eq('id', id);
    };

    // カードを削除
    const deleteCard = async (id: string) => {
        setCards((prev) => prev.filter((c) => c.id !== id));
        setConnections((prev) =>
            prev.filter((c) => c.fromCardId !== id && c.toCardId !== id)
        );

        await supabase.from('cards').delete().eq('id', id);
        await supabase
            .from('card_connections')
            .delete()
            .or(`from_card_id.eq.${id},to_card_id.eq.${id}`);
    };

    // 接続を削除
    const deleteConnection = async (id: string) => {
        setConnections((prev) => prev.filter((c) => c.id !== id));
        await supabase.from('card_connections').delete().eq('id', id);
    };

    // カード接続を開始
    const startConnect = (id: string) => {
        setConnectingFromId(id);
    };

    // カードを選択（接続モードの場合は接続を作成）
    const selectCard = async (id: string) => {
        if (connectingFromId && connectingFromId !== id) {
            // 接続を作成
            const newConnection: CardConnection = {
                id: generateId(),
                fromCardId: connectingFromId,
                toCardId: id,
                createdAt: new Date().toISOString(),
            };

            setConnections((prev) => [...prev, newConnection]);
            setConnectingFromId(null);

            await supabase.from('card_connections').insert({
                id: newConnection.id,
                from_card_id: newConnection.fromCardId,
                to_card_id: newConnection.toCardId,
            });
        } else {
            setSelectedCardId(id);
            setConnectingFromId(null);
        }
    };

    // ファイルをアップロード
    const uploadFile = async (file: File): Promise<string | null> => {
        // ファイル名をサニタイズ（日本語やスペースを除去）
        const ext = file.name.split('.').pop() || 'file';
        const sanitizedName = `${generateId()}.${ext}`;

        const { data, error } = await supabase.storage
            .from('media')
            .upload(sanitizedName, file);

        if (error) {
            console.error('アップロードエラー:', error);
            alert(`アップロードエラー: ${error.message}`);
            return null;
        }

        const { data: urlData } = supabase.storage.from('media').getPublicUrl(sanitizedName);
        return urlData.publicUrl;
    };

    // パン操作（背景を左クリック、中クリック、またはAlt+クリックで開始）
    const handlePanStart = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        // キャンバス背景を直接クリックした場合（canvas-gridまたはcanvas-contentクラスを持つ要素）
        const isCanvasBackground = target.classList.contains('canvas-grid') || target.classList.contains('canvas-content');

        // 中クリック(1)、Alt+左クリック、または背景を左クリックでパン操作
        if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && isCanvasBackground)) {
            e.preventDefault();
            setIsPanning(true);
            setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        }
    };

    const handlePanMove = (e: React.MouseEvent) => {
        if (!isPanning) return;
        setOffset({
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y,
        });
    };

    const handlePanEnd = () => {
        setIsPanning(false);
    };

    // ズーム
    const handleZoom = (delta: number) => {
        setZoom((prev) => Math.max(0.25, Math.min(2, prev + delta)));
    };

    // ホイールでスクロール（Ctrlでズーム）
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey) {
            // Ctrl + ホイールでズーム
            handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
        } else {
            // 通常ホイールでスクロール（パン）
            setOffset((prev) => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY,
            }));
        }
    };

    // カード所有者かどうか
    const isCardOwner = (card: Card) => card.creatorId === user?.id;

    return (
        <div className="relative w-full h-full overflow-hidden bg-gray-100">
            {/* ツールバー */}
            <div className="absolute top-4 left-4 z-40 flex gap-2">
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} className="mr-1" />
                    カードを追加
                </Button>

                <Button
                    variant="secondary"
                    onClick={() => {
                        const newGroup: GroupBox = {
                            id: generateId(),
                            x: 100 + Math.random() * 100,
                            y: 100 + Math.random() * 100,
                            width: 300,
                            height: 200,
                            color: 'blue',
                        };
                        setGroups(prev => [...prev, newGroup]);
                        setSelectedGroupId(newGroup.id);
                    }}
                >
                    <Square size={18} className="mr-1" />
                    グループ追加
                </Button>

                {connectingFromId && (
                    <Button
                        variant="secondary"
                        onClick={() => setConnectingFromId(null)}
                    >
                        接続をキャンセル
                    </Button>
                )}
            </div>

            {/* ズームコントロール */}
            <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2 bg-white rounded-xl shadow-lg p-2">
                <button
                    onClick={() => handleZoom(-0.1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ZoomOut size={18} />
                </button>
                <span className="text-sm font-medium w-16 text-center">
                    {Math.round(zoom * 100)}%
                </span>
                <button
                    onClick={() => handleZoom(0.1)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <ZoomIn size={18} />
                </button>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <button
                    onClick={() => {
                        setZoom(1);
                        setOffset({ x: 0, y: 0 });
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    <Move size={18} />
                </button>
            </div>

            {/* キャンバス */}
            <div
                ref={canvasRef}
                className="w-full h-full canvas-grid cursor-grab"
                style={{
                    cursor: isPanning ? 'grabbing' : connectingFromId ? 'crosshair' : 'grab',
                }}
                onMouseDown={handlePanStart}
                onMouseMove={(e) => {
                    handlePanMove(e);
                    handleMouseMove(e);
                }}
                onMouseUp={handlePanEnd}
                onMouseLeave={handlePanEnd}
                onWheel={handleWheel}
                onClick={() => {
                    setSelectedCardId(null);
                    setEditingCardId(null);
                    editingCardIdRef.current = null;
                    setConnectingFromId(null);
                    setSelectedGroupId(null); // グループ選択を解除
                }}
            >
                <div
                    className="canvas-content relative w-full h-full"
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                        transformOrigin: 'top left',
                    }}
                >
                    {/* グループボックス（カードの下に表示） */}
                    {groups.map((group) => (
                        <GroupBoxComponent
                            key={group.id}
                            group={group}
                            isSelected={selectedGroupId === group.id}
                            onSelect={(id) => {
                                setSelectedGroupId(id);
                                setSelectedCardId(null);
                            }}
                            onUpdate={(id, updates) => {
                                setGroups(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
                            }}
                            onDelete={(id) => {
                                setGroups(prev => prev.filter(g => g.id !== id));
                                setSelectedGroupId(null);
                            }}
                        />
                    ))}

                    {/* 接続線 */}
                    <ConnectionLines connections={connections} cards={cards} onDelete={deleteConnection} />

                    {/* カード */}
                    {cards.map((card) => {
                        const CardComponent =
                            card.cardType === 'text'
                                ? TextCard
                                : card.cardType === 'drawing'
                                    ? DrawingCard
                                    : MediaCard;

                        return (
                            <CardComponent
                                key={card.id}
                                card={card}
                                isOwner={isCardOwner(card)}
                                isSelected={selectedCardId === card.id}
                                isEditing={editingCardId === card.id}
                                zoom={zoom}
                                onPositionChange={updateCardPosition}
                                onSelect={selectCard}
                                onDelete={isCardOwner(card) ? deleteCard : undefined}
                                onEdit={(id) => {
                                    setEditingCardId(id);
                                    editingCardIdRef.current = id;
                                }}
                                onContentChange={updateCardContent as (id: string, content: TextContent | DrawingContent | MediaContent) => void}
                                onStartConnect={startConnect}
                                onUpload={card.cardType === 'media' ? uploadFile : undefined}
                                onSubmit={isCardOwner(card) ? (id: string) => {
                                    setSubmittingCardId(id);
                                    setShowSubmitModal(true);
                                } : undefined}
                            />
                        );
                    })}

                    {/* リアルタイムカーソル */}
                    {isShared && <CursorOverlay cursors={cursors} currentUserId={user?.id || ''} />}
                </div>
            </div>

            {/* カード作成モーダル */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="新しいカードを作成"
                size="md"
            >
                <div className="space-y-6">
                    {/* カードタイプ選択 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            カードの種類
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { type: 'text' as CardType, icon: Type, label: 'テキスト' },
                                { type: 'drawing' as CardType, icon: Pencil, label: '手描き' },
                                { type: 'media' as CardType, icon: Image, label: '画像/PDF' },
                            ].map(({ type, icon: Icon, label }) => (
                                <button
                                    key={type}
                                    onClick={() => setNewCardType(type)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${newCardType === type
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon
                                        size={24}
                                        className={newCardType === type ? 'text-primary-600' : 'text-gray-400'}
                                    />
                                    <span
                                        className={`text-sm font-medium ${newCardType === type ? 'text-primary-700' : 'text-gray-600'
                                            }`}
                                    >
                                        {label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* カード色選択 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            カードの色
                        </label>
                        <CardColorPicker value={newCardColor} onChange={setNewCardColor} />
                    </div>

                    {/* 作成ボタン */}
                    <Button className="w-full" onClick={createCard}>
                        <Plus size={18} className="mr-2" />
                        カードを作成
                    </Button>
                </div>
            </Modal>

            {/* カード提出モーダル */}
            {submittingCardId && user && (
                <SubmitCardModal
                    isOpen={showSubmitModal}
                    onClose={() => {
                        setShowSubmitModal(false);
                        setSubmittingCardId(null);
                    }}
                    cardId={submittingCardId}
                    userId={user.id}
                    onSubmitSuccess={() => {
                        alert('提出が完了しました！');
                    }}
                />
            )}
        </div>
    );
}

// デフォルトコンテンツを取得
function getDefaultContent(type: CardType): CardContent {
    switch (type) {
        case 'text':
            return { type: 'text', text: '' };
        case 'drawing':
            return { type: 'drawing', paths: [] };
        case 'media':
            return { type: 'media', url: '', fileName: '', fileType: 'image' };
    }
}
