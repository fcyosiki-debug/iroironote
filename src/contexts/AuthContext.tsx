'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserRole } from '@/types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (accountId: string, password: string) => Promise<{ success: boolean; error?: string }>;
    setNickname: (nickname: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 有効なアカウントリスト
const VALID_ACCOUNTS = [
    ...Array.from({ length: 50 }, (_, i) => `student${String(i + 1).padStart(2, '0')}`),
    ...Array.from({ length: 10 }, (_, i) => `teacher${String(i + 1).padStart(2, '0')}`),
];

const VALID_PASSWORD = 'password';
const STORAGE_KEY = 'iroirolonote_user';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 初期化時にローカルストレージからセッションを復元
    useEffect(() => {
        const checkSession = () => {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const userData = JSON.parse(stored) as User;
                    setUser(userData);
                }
            } catch (error) {
                console.error('セッション復元エラー:', error);
                localStorage.removeItem(STORAGE_KEY);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    // ログイン処理（シンプルなローカル認証）
    const login = async (accountId: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            // アカウントIDを検証
            if (!VALID_ACCOUNTS.includes(accountId)) {
                return { success: false, error: 'アカウントIDが見つかりません' };
            }

            // パスワードを検証
            if (password !== VALID_PASSWORD) {
                return { success: false, error: 'パスワードが正しくありません' };
            }

            // ロールを判定
            const role: UserRole = accountId.startsWith('teacher') ? 'teacher' : 'student';

            // ユーザー情報を作成
            const userData: User = {
                id: accountId, // アカウントIDをそのままIDとして使用
                accountId,
                role,
                nickname: null,
                createdAt: new Date().toISOString(),
            };

            // ローカルストレージに保存
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
            setUser(userData);

            return { success: true };
        } catch (error) {
            console.error('ログインエラー:', error);
            return { success: false, error: 'ログイン中にエラーが発生しました' };
        }
    };

    // ニックネーム設定
    const setNickname = async (nickname: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) {
            return { success: false, error: 'ログインが必要です' };
        }

        try {
            const updatedUser = { ...user, nickname };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
            setUser(updatedUser);
            return { success: true };
        } catch (error) {
            console.error('ニックネーム更新エラー:', error);
            return { success: false, error: 'ニックネームの更新中にエラーが発生しました' };
        }
    };

    // ログアウト処理
    const logout = async () => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                setNickname,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
