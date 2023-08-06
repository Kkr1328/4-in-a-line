// This file defines type structures

export class Coin {
    constructor(readonly name: string, readonly path: string, readonly price: number) {}
}

export type Table = { [row: number]: string[] };
export type StackPointersType = number[];
export type CellData = { col: number; row: number; ownerId: string };
export type GottenCellsData = CellData[];
export type AlignedCellsType = { col: number; row: number }[];
export type CellCoordinate = { x: number; y: number };
export type GameResult = {
    didWin: boolean;
    opponentUsername: string;
    turns: number;
    timestamp: WriteTimestamp;
    receivedMoney: number;
    isTie?: boolean;
};
export type IdType = string;
export type didWinType = boolean;
export type ReadTimestamp = FirebaseFirestore.Timestamp; // to use Timestamp method like toDate, toMillis
export type WriteTimestamp = FirebaseFirestore.FieldValue; // used for set() or update() at DocRefType
export type Timestamp = ReadTimestamp | WriteTimestamp;

// firestore documents, collections
export type DocRefType = FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
export type CollecRefType = FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;
export type GameDoc = {
    p1Ref: DocRefType;
    p2Ref: DocRefType;
    fullyFilledCols: number;
    passedTurns: number;
    winnerId: string;
    alignedCells: AlignedCellsType;
    colStackPointers: StackPointersType;
    joined: number;
    createdTimestamp: Timestamp;
    leftUsername?: string; // identifies a player who left before the game ended
    winTimestamp?: Timestamp; // doesn't exist when the game isn't over
    baseMoney?: number; // exists when a game is over
};
export type UserDoc = {
    // comments are for default values on creation
    email: string;
    username: string;
    equippedSkin: string; // "Gold"
    history: GameResult[]; // []
    isAnonymous: boolean;
    money: number; // 0
    point: number; // 0
    skins: string[]; // ["Gold", "Silver"]
    numWins: number;
    numGames: number;
    createdAt: Timestamp; // set to serverTimestamp
    startedPlayingAt?: Timestamp;
    gameRef?: DocRefType;
};
export type waitingPlayerDoc = {
    userId: string;
    createdTimestamp: Timestamp;
};
