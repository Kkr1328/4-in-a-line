// The Firebase Admin SDK to access Firestore.
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import {
    AlignedCellsType,
    CellCoordinate,
    CellData,
    CollecRefType,
    GameDoc,
    GottenCellsData,
    StackPointersType,
    Table,
} from "./types";

admin.initializeApp();

const waitingPlayersCollection = "waitingPlayers";
const gamesCollection = "games";
const usersCollection = "users";

const rows = 6;
const cols = 7;

export const eraseAnonymous = functions.region("asia-east2").https.onRequest((req, resp) => {
    admin
        .firestore()
        .collection(usersCollection)
        .where("isAnonymous", "==", true)
        .get()
        .then(collecSnap => {
            collecSnap.docs.forEach(user => {
                if (user.get("isAnonymous")) user.ref.delete();
            });
            resp.send('<h1 style="color: red">Deleted all anonymous users</h1>');
        });
});

export const removeGoneAnonymousUsers = functions
    .region("asia-east2")
    .pubsub.schedule("every 60 minutes")
    .onRun(_ => {
        // every 60 mins
        // remove anonymous users who have not played for 1 hour.

        console.log("😎 Starting user clean up...");

        const db = admin.firestore();
        db.collection(usersCollection)
            .where("isAnonymous", "==", true)
            .where("startedPlayingAt", "<", new Date(new Date().getTime() - 1000 * 60 * 60))
            .get()
            .then(snap => snap.docs.forEach(snap => snap.ref.delete()));
        return null;
    });

export const garbageCollect = functions
    .region("asia-east2")
    .pubsub.schedule("every 60 minutes")
    .onRun(_ => {
        /// garbage collect every 1 hour
        console.log("🧹🚮 Starting garbage collection...");
        const db = admin.firestore();
        /// on these collections
        const collections = [gamesCollection, waitingPlayersCollection];
        collections.forEach(collection => garbageCollectOnCollection(collection, db));
        return null;
    });

export const abortGame = functions
    .region("asia-east2")
    .firestore.document(`${gamesCollection}/{gameId}`)
    .onUpdate((change, context) => {
        // If matching fails (joined = -1, "joined" field is handled client-sided), delete the game
        // -1 is written to field "joined" when a player declines or a player didn't accept the game in time
        const joined = parseInt(change.after.data().joined as string);
        if (joined === -1) {
            const gameId = context.params.gameId as string;
            admin.firestore().doc(`${gamesCollection}/${gameId}`).delete();
            functions.logger.log(`A game has been deleted, joined = -1, id: ${gameId}`);
        }
    });

export const updateGame = functions.region("asia-east2").https.onCall(async (data, context) => {
    console.log("😎 update game is starting...");
    console.log("🤷‍♂️👍👍👍 | context", context);
    console.log("🤷‍♂️👍👍👍 | data", data);
    // * This function updates the game in games collection while the game is being played
    // * both players always listen to the game doc, so that they update their ui through the game doc
    // * This function returns nothing to the players

    const row = parseInt(data.row as string); // row of the dropped coin
    const col = parseInt(data.col as string); // col of the dropped coin
    let playerId = data.playerId as string; // user doc id who dropped the coin
    let opponentId = data.opponentId as string; // opponent doc id
    const gameId = data.gameId as string; // game doc id
    const timeout = data.timeout as boolean; // timeout here means that the opponent didn't drop the coin
    if (timeout) {
        // player fools the cloud function that the opponent actually plays
        const temp = playerId;
        playerId = opponentId;
        opponentId = temp;
    }
    console.log("🤷‍♂️👍👍👍 | gameId", gameId);

    // * get the the game ref and fields
    const db = admin.firestore();
    const gameRef = db.doc(`${gamesCollection}/${gameId}`);
    const gameDoc = (await gameRef.get()).data() as GameDoc;

    const currentStackPointer = gameDoc.colStackPointers[col];
    if (currentStackPointer === rows) return; // fully filled column here

    // * get the game table collection
    const tableCollecRef = db.collection(`${gamesCollection}/${gameId}/table`);
    // create table in memory
    const table: Table = {};
    (await tableCollecRef.get()).docs.map(docSnap => {
        const row = parseInt(docSnap.id);
        table[row] = docSnap.get("cols");
    });

    // * drop the coin by changing img picture
    // we don't do that here because each cell in table exists its owner id
    // we can use that id to get the picture of equipped coin to show

    // * update ownership of the table
    // this is for processing in isWin
    table[currentStackPointer][col] = playerId;
    // this updates the table collection
    tableCollecRef.doc(row + "").update({
        cols: table[currentStackPointer],
    });

    // NOTE: whose turn it is can be inferred from the field passedTurns, so we don't update the turn, unlike in offline.js
    // NOTE: passedTurns is updated only after checking process, so we so it being updated in 3 places below

    // * update the game doc fields: colStackPointers, fullyFilledCols, passedTurns
    // ** NOTE: update the downloaded game doc first
    gameDoc.passedTurns += 1;
    const movedUpPointer = currentStackPointer + 1;
    if (movedUpPointer === rows) {
        gameDoc.fullyFilledCols += 1;
        // check if it is a tie game
        if (gameDoc.fullyFilledCols === cols) {
            // we have a tie game
            const timestamp = admin.firestore.FieldValue.serverTimestamp(); // add this to both users' and game's documents
            gameRef.update({
                fullyFilledCols: cols,
                winTimestamp: timestamp,
                passedTurns: gameDoc.passedTurns,
            });
            return;
        }
    }
    console.log("Updating colStackPointers, fullyFilledCols, passedTurns");
    gameDoc.colStackPointers[col] = movedUpPointer;
    gameRef.update({
        colStackPointers: gameDoc.colStackPointers,
        fullyFilledCols: gameDoc.fullyFilledCols,
        passedTurns: gameDoc.passedTurns,
    });

    const turnsToCheckFromNowOn = 7;
    // * ignore if the number of turns is less than the least number required for a player to win
    if (gameDoc.passedTurns < turnsToCheckFromNowOn) {
        console.log(
            "🤷‍♂️👍👍👍 |  returning out of function... gameDoc.passedTurns < 7",
            gameDoc.passedTurns
        );
        return;
    }

    const { winnerId, alignedCells } = isWin(row, col, playerId, table);
    if (winnerId !== "") {
        const timestamp = admin.firestore.FieldValue.serverTimestamp(); // add this to both users' and game's documents
        // * update game doc

        gameRef.update({
            winnerId,
            alignedCells,
            passedTurns: admin.firestore.FieldValue.increment(1),
            winTimestamp: timestamp,
        });

        return;
    }
});

export const matchMake = functions
    .region("asia-east2")
    .firestore.document(`${waitingPlayersCollection}/{docId}`)
    .onCreate(async (snapshot, _) => {
        functions.logger.log("A player appears with user doc id: " + snapshot.data().userId);

        // get the whole waitingPlayers collection
        const db = admin.firestore();
        const waitingPlayers = await db.collection(waitingPlayersCollection).get();
        let matchedPlayers: string[][] = [];

        for (const waitingPlayerDocData of waitingPlayers.docs) {
            const waitingPlayerDocId = waitingPlayerDocData.id;
            const waitingPlayerId = waitingPlayerDocData.data().userId as string;
            matchedPlayers.push([waitingPlayerDocId, waitingPlayerId]);
            if (matchedPlayers.length === 2) {
                // found a match
                const [
                    [waitingPlayerDocId1, waitingPlayerId1],
                    [waitingPlayerDocId2, waitingPlayerId2],
                ] = matchedPlayers;
                functions.logger.log(`Found a match: ${waitingPlayerId1} and ${waitingPlayerId2}`);

                // remove them from the waitingPlayers, because they are now playing
                db.collection(waitingPlayersCollection).doc(waitingPlayerDocId1).delete();
                db.collection(waitingPlayersCollection).doc(waitingPlayerDocId2).delete();
                functions.logger.log("Remove both players from waiting state");

                // create a game with fields
                let firstPlayer = waitingPlayerId1;
                let secondPlayer = waitingPlayerId2;
                if (Math.random() < 0.5) { // decide who gets the first turn
                    firstPlayer = waitingPlayerId2;
                    secondPlayer = waitingPlayerId1;
                }

                const p1Ref = db.doc(usersCollection + "/" + firstPlayer);
                const p2Ref = db.doc(usersCollection + "/" + secondPlayer);
                const defaultGame: GameDoc = {
                    createdTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                    p1Ref,
                    p2Ref,
                    fullyFilledCols: 0,
                    joined: 0,
                    passedTurns: 0,
                    winnerId: "", // Update this field to signal that a player wins
                    alignedCells: [], // type of AlignedCellsType
                    colStackPointers: createStackPointers(),
                };

                // add this new game to games collection
                const gameRef = await db.collection(gamesCollection).add(defaultGame);
                functions.logger.log("Created game in firestore with doc id: " + gameRef.id);

                // create a table collection for this game
                const tableCollecRef = db.collection(`${gamesCollection}/${gameRef.id}/table`);
                addEmptyRowsToTable(tableCollecRef);

                // let both users know about this game so that they are redirected
                p1Ref.update({ gameRef }); // These will trigger onSnapshot on
                p2Ref.update({ gameRef }); // client side and will redirect them
                functions.logger.log("Notified both players with ref to game doc");

                matchedPlayers = []; // keep on matching
            }
        }
    });

export const testReqBody = functions.region("asia-east2").https.onRequest((req, resp) => {
    functions.logger.log("This is the request object:", req);
    functions.logger.log(
        "This is the request.body:",
        req.body,
        "This is req.body.row",
        req.body.row
    );
    functions.logger.log("This is req.body.hello:", req.body.hello);

    resp.status(200).send("<h1>See the function logger</h1>");
});

const isWin = (row: number, col: number, playerId: string, table: Table) => {
    // Check for winning conditions
    // returns {winnerId: playerId, alignedCells: [positions of those cells]},
    // if we found the winner else { winnerId: "", alignedCells: [] }

    // assume a player wins
    let winnerId = playerId;
    let alignedCells: AlignedCellsType = [];
    const cellsCheckedOnce = 4;

    // ---> helper functions
    const areOwnedByTheSamePlayer = (cells: GottenCellsData): boolean => {
        // check memberships of each 4 cells
        // return true if they share common owner else false
        const distinctCellOwnerships = new Set(cells.map(cell => cell.ownerId));
        // "" signals empty cell
        if (distinctCellOwnerships.has("")) return false;
        // Having one member in the set signals 4 cells owned by the same player
        return distinctCellOwnerships.size === 1;
    };
    const getAlignedCellsFromGottenCellsData = (cellsData: GottenCellsData): AlignedCellsType => {
        // convert to the type of games/standard/alignedCells
        return cellsData.map(cell => {
            return { col: cell.col, row: cell.row };
        });
    };
    const getVerticalCells = (firstRow: number, colToGet: number): GottenCellsData => {
        let gottenCellsData = [];
        for (let rowOffset = 0; rowOffset < cellsCheckedOnce; ++rowOffset) {
            const thisRow = firstRow + rowOffset;
            gottenCellsData.push({
                col: colToGet,
                row: thisRow,
                ownerId: table[thisRow]![colToGet],
            });
        }
        return gottenCellsData;
    };
    const getHorizontalCells = (rowToGet: number, firstCol: number): GottenCellsData => {
        let gottenCellsData = [];
        for (let colOffset = 0; colOffset < cellsCheckedOnce; ++colOffset) {
            const thisCol = firstCol + colOffset;
            gottenCellsData.push({
                col: thisCol,
                row: rowToGet,
                ownerId: table[rowToGet]![thisCol],
            });
        }
        return gottenCellsData;
    };
    const getDiagCells = (
        slope: number,
        justDroppedCellCoord: CellCoordinate,
        xOffset: number
    ): GottenCellsData => {
        // * return 4 cells in a diagonal line with a given slope, including the targeted cell OR
        // ! return [] if we use invalid index
        let gottenCellsData = [];
        for (let i = 0; i < cellsCheckedOnce; ++i) {
            const x = justDroppedCellCoord.x + xOffset + i; // we know this
            if (x < 0 || x > cols - 1) return [];
            // y = m(x - xp) + yp
            const y = slope * (x - justDroppedCellCoord.x) + justDroppedCellCoord.y; // find this
            if (y < 0 || y > rows - 1) return [];
            const cellData: CellData = {
                col: x,
                row: y,
                ownerId: table[y]![x],
            }; // y represents row, x represents col
            gottenCellsData.push(cellData);
        }
        return gottenCellsData;
    };
    // ---> end helper functions

    {
        // * vertically check

        const colToCheck = col;
        console.log("Checking vertically");
        // offset upwards
        for (
            // " + 1" because if there are 6 rows and we check 4 cells at once
            // we need to loop 6 - 4 + 1 = 3 times
            let rowToCheck = 0;
            rowToCheck < rows - cellsCheckedOnce + 1;
            ++rowToCheck
        ) {
            // rowToCheck starts from the top
            const verticalCellsData = getVerticalCells(rowToCheck, colToCheck);

            if (areOwnedByTheSamePlayer(verticalCellsData)) {
                // We found the winner!
                alignedCells = getAlignedCellsFromGottenCellsData(verticalCellsData);
                return { winnerId, alignedCells };
            }
        }
    }

    {
        // * horizontally check

        console.log("Checking horizontally");
        const rowToCheck = row;
        for (
            let colToCheck = 0;
            colToCheck < cols - cellsCheckedOnce + 1; // for " + 1" see comment on vertical check
            ++colToCheck
        ) {
            // left to right
            const horizontalCellsData = getHorizontalCells(rowToCheck, colToCheck);

            if (areOwnedByTheSamePlayer(horizontalCellsData)) {
                // We found the winner!
                alignedCells = getAlignedCellsFromGottenCellsData(horizontalCellsData);
                return { winnerId, alignedCells };
            }
        }
    }

    {
        // * diagonally check
        // checking with the idea of line equation with slope -1, 1
        console.log("Checking diagonally");

        // get the coordinate of the targeted cell in conventional xy plane
        const targetedCellCoord: CellCoordinate = {
            x: col,
            y: row,
        };

        const possibleXOffsets = [-3, -2, -1, 0]; // designed for getDiagCells
        const slopes = [-1, 1]; // for "\" and "/" respectively
        for (const xOffset of possibleXOffsets) {
            for (const slope of slopes) {
                const diagCellsData = getDiagCells(slope, targetedCellCoord, xOffset);
                if (diagCellsData === []) continue; // NOTE: This is [], not null like in offline.js
                if (areOwnedByTheSamePlayer(diagCellsData)) {
                    // We found the winner!
                    alignedCells = getAlignedCellsFromGottenCellsData(diagCellsData);
                    return { winnerId, alignedCells };
                }
            }
        }
    }

    // no winning conditions have been met
    console.log("no winning conditions have been met");
    return { winnerId: "", alignedCells: [] };
};

const createStackPointers = (): StackPointersType => {
    let pointers: StackPointersType = [];
    for (let col = 0; col < cols; ++col) {
        pointers.push(0);
    }
    return pointers;
};

const addEmptyRowsToTable = (tableRef: CollecRefType) => {
    // populate table collection with ${rows} docs
    // each of which has a cols field which is an array of ${cols} empty strings
    for (let row = 0; row < rows; ++row) {
        const emptyRow = [];
        for (let col = 0; col < cols; ++col) {
            emptyRow.push("");
        }
        tableRef.doc(row + "").set({ cols: emptyRow });
    }
};

const garbageCollectOnCollection = async (
    collectionName: string,
    db: FirebaseFirestore.Firestore
) => {
    (
        await db
            .collection(collectionName)
            .where("createdTimestamp", "<", new Date(new Date().getTime() - 1000 * 60 * 60))
            .get()
    ).docs.forEach(snap => snap.ref.delete());
};
