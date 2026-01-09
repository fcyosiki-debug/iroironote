'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input } from '@/components/ui';
import { User, Lock, Sparkles, BookOpen, Users } from 'lucide-react';

type LoginStep = 'credentials' | 'nickname';

export default function LoginPage() {
    const router = useRouter();
    const { login, setNickname, user } = useAuth();

    const [step, setStep] = useState<LoginStep>('credentials');
    const [accountId, setAccountId] = useState('');
    const [password, setPassword] = useState('');
    const [nicknameInput, setNicknameInput] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // ログイン処理
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(accountId, password);

        if (result.success) {
            setStep('nickname');
        } else {
            setError(result.error || 'ログインに失敗しました');
        }

        setIsLoading(false);
    };

    // ニックネーム設定処理
    const handleSetNickname = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!nicknameInput.trim()) {
            setError('ニックネームを入力してください');
            return;
        }

        if (nicknameInput.length > 20) {
            setError('ニックネームは20文字以内にしてください');
            return;
        }

        setIsLoading(true);
        const result = await setNickname(nicknameInput.trim());

        if (result.success) {
            router.push('/dashboard');
        } else {
            setError(result.error || 'ニックネームの設定に失敗しました');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex">
            {/* 左側: ログインフォーム */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* ロゴ */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg mb-4">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-purple bg-clip-text text-transparent">
                            Iroirolonote
                        </h1>
                        <p className="text-gray-500 mt-2">みんなで学ぶコラボレーション学習アプリ</p>
                    </div>

                    {/* ログインフォーム */}
                    {step === 'credentials' && (
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                                <h2 className="text-xl font-semibold text-gray-800 mb-6">ログイン</h2>

                                <div className="space-y-4">
                                    <Input
                                        label="アカウントID"
                                        placeholder="student01 または teacher01"
                                        value={accountId}
                                        onChange={(e) => setAccountId(e.target.value)}
                                        icon={<User size={18} />}
                                        autoFocus
                                    />

                                    <Input
                                        label="パスワード"
                                        type="password"
                                        placeholder="パスワードを入力"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        icon={<Lock size={18} />}
                                    />
                                </div>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full mt-6"
                                    size="lg"
                                    isLoading={isLoading}
                                >
                                    ログイン
                                </Button>
                            </div>

                            {/* ヒント */}
                            <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                                <div className="flex items-start gap-3">
                                    <Sparkles className="w-5 h-5 text-primary-500 mt-0.5" />
                                    <div className="text-sm text-primary-700">
                                        <p className="font-medium">テストアカウント</p>
                                        <p className="mt-1 text-primary-600">
                                            生徒: student01 〜 student50<br />
                                            先生: teacher01 〜 teacher10<br />
                                            パスワード: password
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* ニックネーム入力フォーム */}
                    {step === 'nickname' && (
                        <form onSubmit={handleSetNickname} className="space-y-5">
                            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-accent-yellow rounded-full mb-3">
                                        <Sparkles className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800">ニックネームを設定</h2>
                                    <p className="text-gray-500 text-sm mt-1">
                                        あなたのカードに表示される名前です
                                    </p>
                                </div>

                                <Input
                                    placeholder="例: たろう、はなこ"
                                    value={nicknameInput}
                                    onChange={(e) => setNicknameInput(e.target.value)}
                                    autoFocus
                                    maxLength={20}
                                />

                                <p className="text-xs text-gray-400 mt-2 text-right">
                                    {nicknameInput.length}/20文字
                                </p>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full mt-6"
                                    size="lg"
                                    variant="accent"
                                    isLoading={isLoading}
                                >
                                    はじめる
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* 右側: イラスト */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-purple items-center justify-center p-12 relative overflow-hidden">
                {/* 背景デコレーション */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                    <div className="absolute bottom-40 right-20 w-48 h-48 bg-accent-pink/20 rounded-full blur-2xl" />
                    <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-accent-yellow/20 rounded-full blur-xl" />
                </div>

                {/* コンテンツ */}
                <div className="relative z-10 text-center text-white">
                    <div className="flex justify-center gap-4 mb-8">
                        {/* サンプルカード */}
                        <div className="w-28 h-28 bg-card-yellow rounded-xl shadow-lg transform -rotate-6 animate-float">
                            <div className="p-3 text-gray-700 text-xs font-medium">
                                アイデア💡
                            </div>
                        </div>
                        <div className="w-28 h-28 bg-card-pink rounded-xl shadow-lg transform rotate-3 animate-float" style={{ animationDelay: '0.5s' }}>
                            <div className="p-3 text-gray-700 text-xs font-medium">
                                みんなで考えよう
                            </div>
                        </div>
                        <div className="w-28 h-28 bg-card-green rounded-xl shadow-lg transform -rotate-3 animate-float" style={{ animationDelay: '1s' }}>
                            <div className="p-3 text-gray-700 text-xs font-medium">
                                発見！🔍
                            </div>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold mb-4">
                        みんなでつくる、<br />みんなで学ぶ
                    </h2>
                    <p className="text-white/80 max-w-md mx-auto">
                        カードを作って、つなげて、共有しよう。<br />
                        クラスメイトと一緒に、新しい発見を。
                    </p>

                    <div className="flex items-center justify-center gap-6 mt-8">
                        <div className="flex items-center gap-2 text-white/90">
                            <Users size={20} />
                            <span className="text-sm">リアルタイム協働</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/90">
                            <Sparkles size={20} />
                            <span className="text-sm">楽しくカンタン</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
