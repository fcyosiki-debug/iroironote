// ユーザーロール
export type UserRole = 'student' | 'teacher';

// ユーザー情報
export interface User {
    id: string;
    accountId: string;
    role: UserRole;
    nickname: string | null;
    createdAt: string;
}

// カードタイプ
export type CardType = 'text' | 'drawing' | 'media';

// カードの色
export type CardColor = 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange';

// カード
export interface Card {
    id: string;
    workspaceId: string;
    creatorId: string;
    creatorNickname: string;
    cardType: CardType;
    content: CardContent;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
    color: CardColor;
    createdAt: string;
    updatedAt: string;
}

// カードコンテンツ（タイプによって異なる）
export type CardContent = TextContent | DrawingContent | MediaContent;

export interface TextContent {
    type: 'text';
    text: string;
}

export interface DrawingContent {
    type: 'drawing';
    paths: DrawingPath[];
}

export interface DrawingPath {
    points: { x: number; y: number }[];
    color: string;
    width: number;
}

export interface MediaContent {
    type: 'media';
    url: string;
    fileName: string;
    fileType: 'image' | 'pdf';
}

// ワークスペースタイプ
export type WorkspaceType = 'private' | 'shared';

// ワークスペース
export interface Workspace {
    id: string;
    name: string;
    type: WorkspaceType;
    ownerId: string;
    isPublic: boolean;
    createdAt: string;
}

// カード接続線
export interface CardConnection {
    id: string;
    fromCardId: string;
    toCardId: string;
    createdAt: string;
}

// 提出ボックス
export interface SubmissionBox {
    id: string;
    name: string;
    teacherId: string;
    isPublicView: boolean;
    createdAt: string;
    submissionCount?: number;
}

// 提出
export interface Submission {
    id: string;
    boxId: string;
    cardId: string;
    studentId: string;
    submittedAt: string;
    card?: Card;
}

// リアルタイムカーソル
export interface RealtimeCursor {
    oderId: string;
    nickname: string;
    x: number;
    y: number;
    color: string;
}

// カード作成時の入力
export interface CreateCardInput {
    workspaceId: string;
    cardType: CardType;
    content: CardContent;
    positionX: number;
    positionY: number;
    color: CardColor;
}

// ワークスペース作成時の入力
export interface CreateWorkspaceInput {
    name: string;
    type: WorkspaceType;
}

// 提出ボックス作成時の入力
export interface CreateBoxInput {
    name: string;
}
