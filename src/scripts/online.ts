import { db, functions, firestore, usersCollection } from "./firebase";
import { allCoins } from "./coins";
import { Coin, UserDoc, GameDoc, MoveRequest, GameResult } from "./types";
import {
    getUserID,
    highlightAlignedCells,
    highlightPlayer,
    getGameBoard,
    saveToSession,
    showDroppingOverlay,
    getRandomColor,
} from "./utils";

enum GameEndState {
    WIN,
    LOSE,
    TIE,
}

const secondsForTurn = 46; // -1 at the calling of setInterval so it's just 45 seconds
let remainingSecondsForTurn = secondsForTurn;
let countingDownClock: number; // interval that changes the top label every second
let numberOfOpponentTimeout = 0; // If it is 3, show an alert to the user about that

// when is called, send data to the cloud function
const updateGame = functions.httpsCallable("updateGame");

/// *Database path & Reference
const gameRoomPath = sessionStorage.getItem("gameRoom") as string;

const gameRoomRef = db.doc(`games/${gameRoomPath}`);
const tableCollecRef = db.collection(`games/${gameRoomPath}/table`);
/// *End Database paths & references

/// *Client side data and game state
const userId = getUserID();
const userRef = db.doc(`${usersCollection}/${userId}`);
// const gameId = gameRoomRef.id;

let myUsername: string;
let opponentUsername: string;
let opponentId: string;
let gameDoc: GameDoc;
let playerCoin: Coin; //path to the image's source
let opponentCoin: Coin;

const rows = 6;
const cols = 7;
const maxTurns = rows * cols;
const baseMoney = 100; // used when the game ends
let gameBoard: Array<Array<HTMLDivElement>>; // { (nthRow: int): (row: <div class="cell">[]) };
let isGameOver = false;
let gameResult: GameEndState; // '0' is tie, '1' is win, '2' is lose
let playerIndex: number;
/// * end client's game state

// Get Elements
const turnLabel = document.getElementById("player-turn-label") as HTMLDivElement;
const clockTimer = document.getElementById("clock-timer") as HTMLSpanElement;

/// *Small functions
const findPlayerIndex = (gameData: GameDoc) => {
    if (userId === gameData.p1Ref.id) {
        return 1;
    }
    return 2;
};

const loadPlayerSkinAndName = async (playerSignature: number, gameData: GameDoc) => {
    const playerBoxes = document.getElementsByClassName(
        "player-box"
    ) as HTMLCollectionOf<HTMLDivElement>;
    const playerNameTags = document.getElementsByClassName(
        "player"
    ) as HTMLCollectionOf<HTMLDivElement>;

    let player1 = (await gameData.p1Ref.get()).data() as UserDoc; // In case we need it later
    let player2 = (await gameData.p2Ref.get()).data() as UserDoc;

    let p1SkinName = player1.equippedSkin;
    let p2SkinName = player2.equippedSkin;

    // locate where both players should appear, in wide screen, left (1) or right (2).
    if (playerSignature === 1) {
        myUsername = player1.username;
        opponentUsername = player2.username;
        for (const coin of allCoins) {
            const firestoreName = coin.firestoreName;

            if (firestoreName === p1SkinName) {
                playerCoin = coin;
            }

            if (firestoreName === p2SkinName) {
                opponentCoin = coin;
            }

            if (playerCoin && opponentCoin) break;
        }

        if (playerCoin === undefined || opponentCoin === undefined) {
            // This is for fail save so this block of code should never be executed.
            console.log("Fail save case is reached?? Check it out.");
            gameRoomRef.get().then(snap => {
                const gameDoc = snap.data() as GameDoc;
                gameDoc.p1Ref.update({ gameRef: firestore.FieldValue.delete() });
                gameDoc.p2Ref.update({ gameRef: firestore.FieldValue.delete() });
                snap.ref.delete();
            });
            if (playerCoin === undefined) {
                alert("Equip a coin before you play!.");
                window.location.href = "market.html";
            }
            if (opponentCoin === undefined) {
                alert("Your opponent doesn't equip a coin. What!?");
                window.location.href = "home.html";
            }
        }

        // If both equip the same coin, invert the opponent coin's color
        const playerCoinFirestoreName = playerCoin.firestoreName;
        if (playerCoinFirestoreName == opponentCoin.firestoreName) {
            opponentCoin = allCoins.find(
                coin =>
                    coin.firestoreName ===
                    playerCoinFirestoreName.replace(
                        playerCoin.getColor(),
                        playerCoin.getInvertedColor()
                    )
            ) as Coin;
        }

        playerBoxes[0].style.backgroundImage = `linear-gradient(to right,rgba(255, 255, 255, 0.5),rgba(255, 255, 255, 0.5)), url("${playerCoin.path}")`;
        playerBoxes[1].style.backgroundImage = `linear-gradient(to right,rgba(255, 255, 255, 0.5),rgba(255, 255, 255, 0.5)), url("${opponentCoin.path}")`;

        //Change name of player blocks
        playerNameTags[0].innerHTML = "YOU";
        playerNameTags[1].innerHTML = player2.username;
    } else {
        myUsername = player2.username;
        opponentUsername = player1.username;
        for (const coin of allCoins) {
            const firestoreName = coin.firestoreName;

            if (firestoreName === p1SkinName) {
                opponentCoin = coin;
            }

            if (firestoreName === p2SkinName) {
                playerCoin = coin;
            }

            if (playerCoin && opponentCoin) break;
        }

        if (playerCoin === undefined || opponentCoin === undefined) {
            // This is for fail save so this block of code should never be executed.
            console.log("Fail save case is reached?? Check it out.");
            gameRoomRef.get().then(snap => {
                gameDoc = snap.data() as GameDoc;
                gameDoc.p1Ref.update({ gameRef: firestore.FieldValue.delete() });
                gameDoc.p2Ref.update({ gameRef: firestore.FieldValue.delete() });
                snap.ref.delete();
            });
            if (playerCoin === undefined) {
                alert("Equip a coin before you play!.");
                window.location.href = "market.html";
            }
            if (opponentCoin === undefined) {
                alert("Your opponent doesn't equip a coin. What!?");
                window.location.href = "home.html";
            }
        }

        // If both equip the same coin, invert the opponent coin's color
        const playerCoinFirestoreName = playerCoin.firestoreName;
        if (playerCoinFirestoreName == opponentCoin.firestoreName) {
            opponentCoin = allCoins.find(
                coin =>
                    coin.firestoreName ===
                    playerCoinFirestoreName.replace(
                        playerCoin.getColor(),
                        playerCoin.getInvertedColor()
                    )
            ) as Coin;
        }

        playerBoxes[0].style.backgroundImage = `linear-gradient(to right,rgba(255, 255, 255, 0.5),rgba(255, 255, 255, 0.5)), url("${opponentCoin.path}")`;
        playerBoxes[1].style.backgroundImage = `linear-gradient(to right,rgba(255, 255, 255, 0.5),rgba(255, 255, 255, 0.5)), url("${playerCoin.path}")`;

        //Change name of player blocks
        playerNameTags[0].innerHTML = player1.username;
        playerNameTags[1].innerHTML = "YOU";
    }

    changeTurn(); // to start
};

const changeTurn = () => {
    console.log("changeTurn is called.");
    // highlight the player's name tag who is playing the turn
    const side = gameDoc.passedTurns % 2 == 0 ? 2 : 1;
    if (side === 1) {
        highlightPlayer(1);
    } else {
        highlightPlayer(2);
    }
    // and change the top label is as well
    const isThisMyTurn = side === playerIndex;
    if (isThisMyTurn) {
        turnLabel.innerHTML = "YOUR TURN 😎";
        turnLabel.style.color = "red";
        turnLabel.style.fontWeight = "bolder";

        clockTimer.style.color = "red";
        clockTimer.style.fontWeight = "bold";
    } else {
        turnLabel.innerHTML = opponentUsername + "'s Turn";
        turnLabel.style.color = "black";
        turnLabel.style.fontWeight = "normal";

        clockTimer.style.color = "black";
        clockTimer.style.fontWeight = "normal";
    }

    // clear before setting up a new timer
    clearInterval(countingDownClock);

    // start counting down on every change of turns
    countingDownClock = setInterval(() => {
        remainingSecondsForTurn -= 1;
        clockTimer.innerText = remainingSecondsForTurn + "";
        if (remainingSecondsForTurn === 0) {
            // resets it for the next turn
            remainingSecondsForTurn = secondsForTurn;
            // stop the counting down clock
            clearInterval(countingDownClock);

            if (!isThisMyTurn) {
                // If this is not our turn, and the opponent doesn't drop (the time just ran out)
                // , fake click event in the name of the opponent, avoid full cols
                // show overlay so the player knows something after some time
                numberOfOpponentTimeout += 1;
                if (numberOfOpponentTimeout === 2) alert("Your opponent is gone!?\n😨😨😨");
                const availableCols = gameDoc.colStackPointers.filter(n => n !== cols);
                const randomizedCol = Math.floor(Math.random() * availableCols.length);
                const data: MoveRequest = {
                    row: gameDoc.colStackPointers[randomizedCol],
                    col: randomizedCol,
                    opponentId: opponentId,
                    gameId: gameRoomRef.id,
                    playerId: userId,
                    timeout: true, // if timer runs out, this is true. When another player hasn't played for a long time
                };
                updateGame(data);
                clockTimer.innerText = "changing turn..";
            } else {
                // NOTE: The opponent is dropping for you, if he is there...
                // else this overlay persists until this player clicks to drop
                showDroppingOverlay(true, "Are you there? 😴", "Dropping randomly...?");
            }
            // NOTE: dropping overlay will be hidden once we get a new game snap? must be
        }
    }, 1000); // every 1000 ms, 1 second
};
/// *End small functions

/// *Gameplay logic

// Receive the player's input
// "let" here so that we can set it to do nothing when the game ends
let handleColOnClick = (event: any) => {
    const playerTurn = gameDoc.passedTurns % 2 == 0 ? 2 : 1;

    if (playerTurn != playerIndex) {
        console.log("Not yet bros.");
        return;
    }

    // clear the counting down timer
    clearInterval(countingDownClock);
    // resets the timer
    remainingSecondsForTurn = secondsForTurn;

    // If a player click a column, this is OK
    // but if it is a cell, we must find the column it belongs
    const targetElem = event.target;
    let targetCol = event.target;
    if (targetElem.classList.contains("cell")) {
        targetCol = targetElem.parentElement;
    }
    let i_col = targetCol.dataset.col;
    let i_row = gameDoc.colStackPointers[i_col];
    if (i_row === rows) {
        console.log("This row is full");
        alert("This column is full! 😡");
        return;
    }
    // show overlay to notify that he needs to wait
    showDroppingOverlay(true);
    console.log(`sending input to gcf .....`);
    // Send a http request to server
    const data: MoveRequest = {
        row: i_row,
        col: i_col,
        opponentId: opponentId,
        gameId: gameRoomRef.id,
        playerId: userId,
        timeout: false, // if timer runs out, this is true. When another player hasn't played for a long time
    };
    updateGame(data);
    clockTimer.innerText = "changing turn..";
};

// Listen to change in game state
const unsubscribeGameRef = gameRoomRef.onSnapshot(async gameSnap => {
    // hide dropping overlay
    showDroppingOverlay(false);
    // stop counting down timer
    clearInterval(countingDownClock);
    // reset to 20 seconds
    remainingSecondsForTurn = secondsForTurn;

    if (!gameSnap) {
        console.log("May be a bug");
        alert("game doc has been deleted");
        window.location.href = "home.html";
        return;
    }

    gameDoc = gameSnap.data() as GameDoc;
    if (gameDoc.leftUsername) {
        if (gameDoc.leftUsername !== myUsername) alert("Your opponent just left! 😨😨");
    }

    // Check for game-over conditions
    if (gameDoc.winnerId !== "" || gameDoc.fullyFilledCols === cols) {
        isGameOver = true;

        unsubscribeGameRef(); // to not get another snap

        saveToSession("myUsername", myUsername);
        saveToSession("opponentUsername", opponentUsername);

        // to catch more attention, these will be used to display important information
        turnLabel.style.fontWeight = "bolder";
        clockTimer.style.color = "black";
        clockTimer.style.fontWeight = "bolder";

        window.onbeforeunload = null; // to prevent popup like changes you have made ...
        handleColOnClick = () => {}; // set this to do nothing when the game ends
        clockTimer.innerText = "Click anywhere to continue";
        document.body.onclick = () => {
            window.location.href = "winResult.html";
        };

        setInterval(() => {
            turnLabel.style.color = getRandomColor();
        }, 300);
    } else {
        changeTurn(); // this will set another clock
        return;
    }

    if (gameDoc.winnerId !== "") {
        gameResult = gameDoc.winnerId === userId ? GameEndState.WIN : GameEndState.LOSE;

        // add new fields to user doc, numWins, numGames, others
        const winnerMoney = Math.round(baseMoney * (maxTurns / gameDoc.passedTurns)); // max is 600 if min money = 100, 7 turns, 6 rows, and 7 cols
        const loserMoney = Math.round(winnerMoney * 0.5);
        let receivedMoney: number;
        let didWin: boolean;
        let numWinIncrement: number;
        if (userId === gameDoc.winnerId) {
            didWin = true;
            receivedMoney = winnerMoney;
            numWinIncrement = 1;
        } else {
            receivedMoney = loserMoney;
            didWin = false;
            numWinIncrement = 0;
        }
        const newHistory: GameResult = {
            didWin,
            opponentUsername,
            receivedMoney,
            timestamp: gameDoc.winTimestamp!,
            turns: gameDoc.passedTurns,
            isTie: false,
        };

        userRef.update({
            history: firestore.FieldValue.arrayUnion(newHistory),
            point: firestore.FieldValue.increment(Math.round(receivedMoney)),
            money: firestore.FieldValue.increment(Math.round(receivedMoney)),
            numWins: firestore.FieldValue.increment(numWinIncrement),
            numGames: firestore.FieldValue.increment(1),
            gameRef: firestore.FieldValue.delete(),
        });

        // save some info to display in winResult
        saveToSession("winnerMoney", winnerMoney + "");
        saveToSession("loserMoney", loserMoney + "");
        if (didWin) saveToSession("endResult", "win");
        /// NOTE: "yes" or "no"
        else saveToSession("endResult", "lose");

        // Highlight the aligned coins
        highlightAlignedCells(gameBoard, gameDoc.alignedCells);

        if (gameResult === GameEndState.WIN) {
            turnLabel.innerText = "You win! 🎉🎉🎉";
        } else {
            turnLabel.innerText = "You lose! 😭😭😭";
        }
    } else {
        // tie game here
        gameResult = GameEndState.TIE;

        turnLabel.innerText = "TIE GAME! 😲😲😲";

        const newHistory: GameResult = {
            didWin: false,
            opponentUsername,
            receivedMoney: baseMoney,
            timestamp: gameDoc.winTimestamp!,
            turns: gameDoc.passedTurns,
            isTie: true,
        };
        userRef.update({
            history: firestore.FieldValue.arrayUnion(newHistory),
            point: firestore.FieldValue.increment(baseMoney),
            money: firestore.FieldValue.increment(baseMoney),
            numGames: firestore.FieldValue.increment(1),
            gameRef: firestore.FieldValue.delete(),
        });

        saveToSession("winnerMoney", baseMoney + "");
        saveToSession("loserMoney", baseMoney + "");
        saveToSession("endResult", "tie");
    }
});

// Update coin images in the gameBoard

tableCollecRef.onSnapshot(
    querySnapshot => {
        if (!querySnapshot) {
            console.log("something went wrong....");
            return;
        }

        console.log("Render board.....");
        querySnapshot.docs.map(row => {
            const i = parseInt(row.id);
            const tmp = row.data().cols;
            for (let j = 0; j < cols; ++j) {
                if (tmp[j] === "") {
                    continue;
                }

                if (tmp[j] === userId) {
                    gameBoard[i][j].style.backgroundImage = `url("${playerCoin.path}")`;
                    gameBoard[i][j].style.borderColor = playerCoin.tierColor;
                } else if (tmp[j] === opponentId) {
                    gameBoard[i][j].style.backgroundImage = `url("${opponentCoin.path}")`;
                    gameBoard[i][j].style.borderColor = opponentCoin.tierColor;
                }
            }
        });
    },
    error => {
        console.log("Oops!! something went wrong...");
        console.log(error.message);
    }
);

window.onload = async () => {
    const response = await gameRoomRef.get();
    gameDoc = response.data() as GameDoc;
    playerIndex = findPlayerIndex(gameDoc);
    loadPlayerSkinAndName(playerIndex, gameDoc);
    opponentId = playerIndex == 1 ? gameDoc!.p2Ref.id : gameDoc!.p1Ref.id;
    gameBoard = getGameBoard(handleColOnClick, rows);
};

// check if the user quits before the game ends
window.onbeforeunload = async () => {
    if (!isGameOver) {
        // notify the opponent that you left the game
        gameRoomRef.update({ leftUsername: myUsername });
        // delete the gameRef from your field
        userRef.update({ gameRef: firestore.FieldValue.delete() });
    }
};
