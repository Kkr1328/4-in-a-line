import firebase from "firebase/app";

// This file defines type structures

export enum CoinTier {
    NOOB, // free 😪
    COMMON, // static 😑
    NICE, // little animation 🙂
    RARE, // lots of animation 😲
    LEGENDARY, // super duper cool 😎
}

export enum Visibility {
    SHOW,
    HIDE,
}

export class Coin {
    readonly tierColor: string;
    readonly tierName: string;
    readonly price: number;

    constructor(
        // ! all firestoreName(s) must start with "Gold ..." or "Silver ..." where ... cannot contain white spaces
        // ! The image names must start with "Gold" or "Silver"

        readonly displayName: string, // only to display on the market page
        readonly firestoreName: string, // saved on firestore, purchase and equip, ⚠ only 1 space is allowed ⚠
        readonly path: string, // path to the image file ⚠ use import ... from "../path/to/.png, .gif";
        readonly tier: CoinTier = CoinTier.COMMON, // change border and name text color
        readonly visibility: Visibility = Visibility.SHOW // to show or hide on the market page
    ) {
        if (tier === CoinTier.COMMON) {
            this.tierColor = "#34589c"; // blue
            this.price = 150;
            this.tierName = "COMMON";
        } else if (tier === CoinTier.NICE) {
            this.tierColor = "darkviolet";
            this.price = 500;
            this.tierName = "NICE";
        } else if (tier === CoinTier.RARE) {
            this.tierColor = "DarkOrange";
            this.price = 1000;
            this.tierName = "RARE";
        } else if (tier === CoinTier.LEGENDARY) {
            this.tierColor = "red";
            this.price = 3000;
            this.tierName = "LEGENDARY";
        } else {
            this.tierColor = "#777777"; // not pretty grey
            this.price = 0;
            this.tierName = "NOOB";
        }
    }

    getColor = (): string => {
        return this.firestoreName.split(" ")[0];
    };

    getInvertedColor(): string {
        if (this.getColor() === "Silver") return "Gold";
        else return "Silver";
    }
}

export type MoveRequest = {
    // send to updateGame gcf
    row: number;
    col: number;
    opponentId: string;
    gameId: string;
    playerId: string;
    timeout: boolean;
};
export type Table = { [row: number]: string[] };
export type OfflineTable = { [row: number]: HTMLDivElement[] };
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
export type ReadTimestamp = firebase.firestore.Timestamp; // to use Timestamp method like toDate, toMillis
export type WriteTimestamp = firebase.firestore.FieldValue; // used for set() or update() at DocRefType
export type Timestamp = ReadTimestamp | WriteTimestamp;

// firestore documents, collections
export type DocRefType = firebase.firestore.DocumentReference<firebase.firestore.DocumentData>;
export type CollecRefType = firebase.firestore.CollectionReference<firebase.firestore.DocumentData>;
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
    createdAt: WriteTimestamp; // set to serverTimestamp
    startedPlayingAt?: Timestamp;
    gameRef?: DocRefType;
};
export type waitingPlayerDoc = {
    userId: string;
    createdTimestamp: Timestamp;
};
