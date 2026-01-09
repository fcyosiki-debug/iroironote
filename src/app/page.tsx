'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Loader2 } from 'lucide-react';

export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated && user?.nickname) {
                router.push('/dashboard');
            } else {
                router.push('/login');
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    // ローディング画面
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-white">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg mb-6 animate-pulse">
                    <BookOpen className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-purple bg-clip-text text-transparent mb-4">
                    Iroirolonote
                </h1>
                <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>読み込み中...</span>
                </div>
            </div>
        </div>
    );
}
