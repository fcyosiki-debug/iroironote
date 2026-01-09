import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

// カードの色に対応するクラスを取得
export function getCardColorClass(color: string): string {
    const colorMap: Record<string, string> = {
        yellow: 'card-yellow',
        pink: 'card-pink',
        green: 'card-green',
        blue: 'card-blue',
        purple: 'card-purple',
        orange: 'card-orange',
    };
    return colorMap[color] || 'card-blue';
}

// ランダムなカーソル色を生成
export function getRandomCursorColor(): string {
    const colors = [
        '#ef4444', // red
        '#f97316', // orange
        '#eab308', // yellow
        '#22c55e', // green
        '#06b6d4', // cyan
        '#3b82f6', // blue
        '#8b5cf6', // violet
        '#ec4899', // pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// UUIDを生成
export function generateId(): string {
    return crypto.randomUUID();
}

// 日付をフォーマット
export function formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// デバウンス関数
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// スロットル関数
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
