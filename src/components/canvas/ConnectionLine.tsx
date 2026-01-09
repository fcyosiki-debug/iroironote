'use client';

import { useMemo, useState } from 'react';
import type { CardConnection, Card } from '@/types';

interface ConnectionLineProps {
    connection: CardConnection;
    cards: Card[];
    onDelete?: (id: string) => void;
}

export default function ConnectionLine({ connection, cards, onDelete }: ConnectionLineProps) {
    const [isHovered, setIsHovered] = useState(false);

    const { fromCard, toCard } = useMemo(() => {
        return {
            fromCard: cards.find((c) => c.id === connection.fromCardId),
            toCard: cards.find((c) => c.id === connection.toCardId),
        };
    }, [connection, cards]);

    if (!fromCard || !toCard) return null;

    // カードの中心点を計算
    const fromX = fromCard.positionX + fromCard.width / 2;
    const fromY = fromCard.positionY + fromCard.height / 2;
    const toX = toCard.positionX + toCard.width / 2;
    const toY = toCard.positionY + toCard.height / 2;

    // 中間点
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;

    // ベジェ曲線の制御点
    const offset = Math.min(Math.abs(toX - fromX), Math.abs(toY - fromY)) * 0.3;

    // 矢印の計算
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 10;

    // 矢印の先端位置（カードの端から少し離す）
    const arrowTipX = toX - Math.cos(angle) * 30;
    const arrowTipY = toY - Math.sin(angle) * 30;

    // 矢印の翼
    const arrowPoint1X = arrowTipX - arrowLength * Math.cos(angle - Math.PI / 6);
    const arrowPoint1Y = arrowTipY - arrowLength * Math.sin(angle - Math.PI / 6);
    const arrowPoint2X = arrowTipX - arrowLength * Math.cos(angle + Math.PI / 6);
    const arrowPoint2Y = arrowTipY - arrowLength * Math.sin(angle + Math.PI / 6);

    return (
        <g
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* クリック可能な透明な線（太い） */}
            <path
                d={`M ${fromX} ${fromY} Q ${midX + offset} ${midY - offset} ${arrowTipX} ${arrowTipY}`}
                fill="none"
                stroke="transparent"
                strokeWidth="20"
                className="cursor-pointer"
                style={{ pointerEvents: 'stroke' }}
            />

            {/* 接続線（曲線） */}
            <path
                d={`M ${fromX} ${fromY} Q ${midX + offset} ${midY - offset} ${arrowTipX} ${arrowTipY}`}
                fill="none"
                stroke={isHovered ? '#ef4444' : '#94a3b8'}
                strokeWidth={isHovered ? 3 : 2}
                strokeDasharray="5,5"
                className="transition-all duration-150 pointer-events-none"
            />

            {/* 矢印 */}
            <polygon
                points={`${arrowTipX},${arrowTipY} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`}
                fill={isHovered ? '#ef4444' : '#94a3b8'}
                className="pointer-events-none transition-colors duration-150"
            />

            {/* 削除ボタン（ホバー時のみ表示） */}
            {isHovered && (
                <g
                    className="cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(connection.id);
                    }}
                >
                    <circle
                        cx={midX}
                        cy={midY}
                        r="12"
                        fill="#ef4444"
                        className="drop-shadow-md"
                    />
                    <text
                        x={midX}
                        y={midY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="14"
                        fontWeight="bold"
                        fill="white"
                        className="pointer-events-none"
                    >
                        ×
                    </text>
                </g>
            )}
        </g>
    );
}

// 複数の接続線を描画するコンポーネント
export function ConnectionLines({
    connections,
    cards,
    onDelete,
}: {
    connections: CardConnection[];
    cards: Card[];
    onDelete?: (id: string) => void;
}) {
    return (
        <svg
            className="absolute inset-0 z-0"
            style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        >
            <g style={{ pointerEvents: 'auto' }}>
                {connections.map((conn) => (
                    <ConnectionLine
                        key={conn.id}
                        connection={conn}
                        cards={cards}
                        onDelete={onDelete}
                    />
                ))}
            </g>
        </svg>
    );
}
