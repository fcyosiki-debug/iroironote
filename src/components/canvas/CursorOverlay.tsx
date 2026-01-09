'use client';

import type { RealtimeCursor } from '@/types';
import { MousePointer2 } from 'lucide-react';

interface CursorOverlayProps {
    cursors: RealtimeCursor[];
    currentUserId: string;
}

export default function CursorOverlay({ cursors, currentUserId }: CursorOverlayProps) {
    // 自分以外のカーソルのみ表示
    const otherCursors = cursors.filter((c) => c.oderId !== currentUserId);

    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {otherCursors.map((cursor) => (
                <div
                    key={cursor.oderId}
                    className="absolute transition-all duration-75 ease-out"
                    style={{
                        left: cursor.x,
                        top: cursor.y,
                        transform: 'translate(-2px, -2px)',
                    }}
                >
                    {/* カーソルアイコン */}
                    <MousePointer2
                        size={20}
                        className="drop-shadow-md"
                        style={{ color: cursor.color, fill: cursor.color }}
                    />

                    {/* ニックネームラベル */}
                    <div
                        className="absolute left-4 top-4 px-2 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap shadow-md"
                        style={{ backgroundColor: cursor.color }}
                    >
                        {cursor.nickname}
                    </div>
                </div>
            ))}
        </div>
    );
}
