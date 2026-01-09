import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const notoSansJP = Noto_Sans_JP({
    subsets: ['latin'],
    variable: '--font-noto-sans',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Iroirolonote - みんなで学ぶコラボレーション学習アプリ',
    description: 'リアルタイムでカードを共有し、クラスメートと一緒に学びを深める教育用アプリケーション',
    keywords: ['教育', 'コラボレーション', '学習', 'カード', 'リアルタイム'],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja" className={notoSansJP.variable}>
            <body className="antialiased">
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
