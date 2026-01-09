'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Modal, Input } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Workspace, SubmissionBox } from '@/types';
import {
    BookOpen,
    Plus,
    Users,
    FolderOpen,
    Send,
    LogOut,
    Sparkles,
    ChevronRight,
    Box,
    Loader2,
    Trash2,
    AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, logout } = useAuth();
    const supabase = createClient();

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [sharedWorkspaces, setSharedWorkspaces] = useState<Workspace[]>([]);
    const [boxes, setBoxes] = useState<SubmissionBox[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userEnsured, setUserEnsured] = useState(false);

    // モーダル状態
    const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
    const [showCreateBox, setShowCreateBox] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [newBoxName, setNewBoxName] = useState('');

    // 削除確認モーダル
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'workspace' | 'box'; id: string; name: string } | null>(null);

    // 認証チェック
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (!authLoading && user && !user.nickname) {
            router.push('/login');
        }
    }, [authLoading, user, router]);

    // ユーザーがデータベースに存在することを確認
    useEffect(() => {
        if (user && !userEnsured) {
            ensureUserExists();
        }
    }, [user, userEnsured]);

    // ユーザーをデータベースに登録（存在しない場合）
    const ensureUserExists = async () => {
        if (!user) return;

        try {
            // まずユーザーが存在するか確認
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single();

            if (!existingUser) {
                // ユーザーが存在しない場合は作成
                const { error: insertError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        account_id: user.accountId,
                        role: user.role,
                        nickname: user.nickname,
                    });

                if (insertError) {
                    console.error('ユーザー作成エラー:', insertError);
                }
            } else {
                // ニックネームを更新
                await supabase
                    .from('users')
                    .update({ nickname: user.nickname })
                    .eq('id', user.id);
            }

            setUserEnsured(true);
            loadData();
        } catch (error) {
            console.error('ユーザー確認エラー:', error);
            setUserEnsured(true);
            loadData();
        }
    };

    // データ取得
    const loadData = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            // マイワークスペースを取得
            const { data: myWorkspaces, error: wsError } = await supabase
                .from('workspaces')
                .select('*')
                .eq('owner_id', user.id)
                .eq('type', 'private')
                .order('created_at', { ascending: false });

            if (wsError) console.error('ワークスペース取得エラー:', wsError);

            // 共有ワークスペースを取得
            const { data: shared, error: sharedError } = await supabase
                .from('workspaces')
                .select('*')
                .eq('type', 'shared')
                .order('created_at', { ascending: false });

            if (sharedError) console.error('共有ワークスペース取得エラー:', sharedError);

            // 提出ボックスを取得
            const { data: boxesData, error: boxError } = await supabase
                .from('submission_boxes')
                .select('*')
                .order('created_at', { ascending: false });

            if (boxError) console.error('提出ボックス取得エラー:', boxError);

            setWorkspaces(myWorkspaces || []);
            setSharedWorkspaces(shared || []);
            setBoxes(boxesData?.map(box => ({
                ...box,
                submissionCount: 0
            })) || []);
        } catch (error) {
            console.error('データ取得エラー:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // 新しいワークスペースを作成
    const createWorkspace = async (type: 'private' | 'shared') => {
        if (!newWorkspaceName.trim() || !user) return;

        console.log('ワークスペース作成開始:', { name: newWorkspaceName, type, owner_id: user.id });

        const { data, error } = await supabase
            .from('workspaces')
            .insert({
                name: newWorkspaceName,
                type,
                owner_id: user.id,
                is_public: type === 'shared',
            })
            .select()
            .single();

        if (error) {
            console.error('ワークスペース作成エラー:', error);
            alert(`ワークスペース作成エラー: ${error.message}`);
            return;
        }

        if (data) {
            console.log('ワークスペース作成成功:', data);
            if (type === 'private') {
                setWorkspaces([data, ...workspaces]);
            } else {
                setSharedWorkspaces([data, ...sharedWorkspaces]);
            }
            setNewWorkspaceName('');
            setShowCreateWorkspace(false);
        }
    };

    // 新しい提出ボックスを作成
    const createBox = async () => {
        if (!newBoxName.trim() || !user) return;

        console.log('提出ボックス作成開始:', { name: newBoxName, teacher_id: user.id });

        const { data, error } = await supabase
            .from('submission_boxes')
            .insert({
                name: newBoxName,
                teacher_id: user.id,
                is_public_view: false,
            })
            .select()
            .single();

        if (error) {
            console.error('提出ボックス作成エラー:', error);
            alert(`提出ボックス作成エラー: ${error.message}`);
            return;
        }

        if (data) {
            console.log('提出ボックス作成成功:', data);
            setBoxes([{ ...data, submissionCount: 0 }, ...boxes]);
            setNewBoxName('');
            setShowCreateBox(false);
        }
    };

    // ワークスペース削除
    const deleteWorkspace = async (id: string) => {
        try {
            // まずワークスペース内のカードを削除
            await supabase.from('cards').delete().eq('workspace_id', id);
            // ワークスペースを削除
            const { error } = await supabase.from('workspaces').delete().eq('id', id);
            if (error) {
                console.error('ワークスペース削除エラー:', error);
                alert('削除に失敗しました');
                return;
            }
            setWorkspaces(workspaces.filter(ws => ws.id !== id));
            setSharedWorkspaces(sharedWorkspaces.filter(ws => ws.id !== id));
            setDeleteTarget(null);
        } catch (err) {
            console.error('削除エラー:', err);
            alert('削除に失敗しました');
        }
    };

    // 提出ボックス削除
    const deleteBox = async (id: string) => {
        try {
            // まず提出を削除
            await supabase.from('submissions').delete().eq('box_id', id);
            // ボックスを削除
            const { error } = await supabase.from('submission_boxes').delete().eq('id', id);
            if (error) {
                console.error('提出ボックス削除エラー:', error);
                alert('削除に失敗しました');
                return;
            }
            setBoxes(boxes.filter(b => b.id !== id));
            setDeleteTarget(null);
        } catch (err) {
            console.error('削除エラー:', err);
            alert('削除に失敗しました');
        }
    };

    // 削除確認
    const handleDelete = () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === 'workspace') {
            deleteWorkspace(deleteTarget.id);
        } else {
            deleteBox(deleteTarget.id);
        }
    };

    // ログアウト
    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const isTeacher = user.role === 'teacher';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30">
            {/* ヘッダー */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-purple bg-clip-text text-transparent">
                                Iroirolonote
                            </span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                                <div className={`w-2 h-2 rounded-full ${isTeacher ? 'bg-accent-purple' : 'bg-accent-green'}`} />
                                <span className="text-sm font-medium text-gray-700">{user.nickname}</span>
                                <span className="text-xs text-gray-500">
                                    ({isTeacher ? '先生' : '生徒'})
                                </span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut size={18} className="mr-1" />
                                ログアウト
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* ウェルカムメッセージ */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        こんにちは、{user.nickname}さん！
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isTeacher ? '授業を始めましょう' : '今日も楽しく学びましょう'}
                    </p>
                </div>

                {/* アクションボタン（教師のみ） */}
                {isTeacher && (
                    <div className="flex gap-4 mb-8">
                        <Button onClick={() => setShowCreateWorkspace(true)}>
                            <Plus size={18} className="mr-2" />
                            共有ワークスペースを作成
                        </Button>
                        <Button variant="accent" onClick={() => setShowCreateBox(true)}>
                            <Box size={18} className="mr-2" />
                            提出ボックスを作成
                        </Button>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* マイワークスペース */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* マイワークスペースセクション */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <FolderOpen className="text-primary-500" />
                                    マイワークスペース
                                </h2>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setNewWorkspaceName('');
                                        setShowCreateWorkspace(true);
                                    }}
                                >
                                    <Plus size={16} className="mr-1" />
                                    新規作成
                                </Button>
                            </div>

                            {isLoading ? (
                                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
                                </div>
                            ) : workspaces.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                                    <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">まだワークスペースがありません</p>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => setShowCreateWorkspace(true)}
                                    >
                                        最初のワークスペースを作成
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {workspaces.map((ws) => (
                                        <div
                                            key={ws.id}
                                            className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-lg hover:border-primary-200 transition-all duration-200 group relative"
                                        >
                                            <button
                                                onClick={() => router.push(`/workspace/${ws.id}`)}
                                                className="w-full text-left"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="w-10 h-10 bg-card-blue rounded-xl flex items-center justify-center">
                                                        <FolderOpen className="w-5 h-5 text-primary-600" />
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                                </div>
                                                <h3 className="font-medium text-gray-900 mt-3">{ws.name}</h3>
                                                <p className="text-xs text-gray-400 mt-1">プライベート</p>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget({ type: 'workspace', id: ws.id, name: ws.name });
                                                }}
                                                className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="削除"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* 共有ワークスペースセクション */}
                        <section>
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                <Users className="text-accent-purple" />
                                共有ワークスペース
                            </h2>

                            {sharedWorkspaces.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">共有ワークスペースがありません</p>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {sharedWorkspaces.map((ws) => (
                                        <div
                                            key={ws.id}
                                            className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-lg hover:border-accent-purple/30 transition-all duration-200 group relative"
                                        >
                                            <button
                                                onClick={() => router.push(`/workspace/${ws.id}`)}
                                                className="w-full text-left"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="w-10 h-10 bg-card-purple rounded-xl flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                            リアルタイム
                                                        </span>
                                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-accent-purple transition-colors" />
                                                    </div>
                                                </div>
                                                <h3 className="font-medium text-gray-900 mt-3">{ws.name}</h3>
                                                <p className="text-xs text-gray-400 mt-1">みんなで編集可能</p>
                                            </button>
                                            {isTeacher && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteTarget({ type: 'workspace', id: ws.id, name: ws.name });
                                                    }}
                                                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="削除"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* 提出ボックス */}
                    <div>
                        <section>
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                <Send className="text-accent-pink" />
                                提出ボックス
                            </h2>

                            {boxes.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                                    <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">提出ボックスがありません</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {boxes.map((box) => (
                                        <div
                                            key={box.id}
                                            className="w-full bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-lg hover:border-accent-pink/30 transition-all duration-200 group relative"
                                        >
                                            <button
                                                onClick={() => router.push(`/box/${box.id}`)}
                                                className="w-full text-left"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-card-pink rounded-xl flex items-center justify-center">
                                                            <Box className="w-5 h-5 text-pink-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium text-gray-900">{box.name}</h3>
                                                            <p className="text-xs text-gray-400">
                                                                {box.submissionCount || 0}件の提出
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-accent-pink transition-colors" />
                                                </div>
                                            </button>
                                            {isTeacher && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteTarget({ type: 'box', id: box.id, name: box.name });
                                                    }}
                                                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="削除"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            {/* ワークスペース作成モーダル */}
            <Modal
                isOpen={showCreateWorkspace}
                onClose={() => setShowCreateWorkspace(false)}
                title="ワークスペースを作成"
            >
                <div className="space-y-4">
                    <Input
                        label="ワークスペース名"
                        placeholder="例: 理科の実験まとめ"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        autoFocus
                    />
                    <div className="flex gap-3 pt-2">
                        <Button
                            className="flex-1"
                            variant="secondary"
                            onClick={() => createWorkspace('private')}
                        >
                            <FolderOpen size={18} className="mr-2" />
                            プライベート
                        </Button>
                        {isTeacher && (
                            <Button
                                className="flex-1"
                                onClick={() => createWorkspace('shared')}
                            >
                                <Users size={18} className="mr-2" />
                                共有
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>

            {/* 提出ボックス作成モーダル */}
            <Modal
                isOpen={showCreateBox}
                onClose={() => setShowCreateBox(false)}
                title="提出ボックスを作成"
            >
                <div className="space-y-4">
                    <Input
                        label="ボックス名"
                        placeholder="例: 今日の感想"
                        value={newBoxName}
                        onChange={(e) => setNewBoxName(e.target.value)}
                        autoFocus
                    />
                    <Button className="w-full" onClick={createBox}>
                        <Box size={18} className="mr-2" />
                        作成する
                    </Button>
                </div>
            </Modal>

            {/* 削除確認モーダル */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="削除の確認"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                        <div>
                            <p className="font-medium">この操作は取り消せません</p>
                            <p className="text-sm text-red-600 mt-1">
                                {deleteTarget?.type === 'workspace'
                                    ? 'ワークスペース内のすべてのカードも削除されます'
                                    : 'すべての提出も削除されます'}
                            </p>
                        </div>
                    </div>
                    <p className="text-gray-700">
                        「<span className="font-semibold">{deleteTarget?.name}</span>」を削除しますか？
                    </p>
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setDeleteTarget(null)}
                        >
                            キャンセル
                        </Button>
                        <Button
                            className="flex-1 bg-red-500 hover:bg-red-600"
                            onClick={handleDelete}
                        >
                            <Trash2 size={16} className="mr-2" />
                            削除する
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
