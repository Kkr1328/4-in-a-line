import { db, firestore, usersCollection, waitingPlayersCollection } from "./firebase";
import { DocRefType, GameDoc, UserDoc } from "./types";
import {
    addBgColor,
    getRandomEmoji,
    getNextMinsDate,
    getUserID,
    showBackdrop,
    setToWaitingPlayers,
} from "./utils";

enum WaitingState {
    IDLE, // isn't finding a match
    FINDING,
    WAITING, // for another player to accept
}
// to indicate match finding states
let waitingState = WaitingState.IDLE;

// Get HTML elements
const waitingOverlay = document.getElementById("waiting-box-overlay") as HTMLDivElement;
const playBtn = document.getElementById("play-btn") as HTMLLIElement;

// This overlay's style will be changed by cancelMatch and promptAcceptMatch
const promptAcceptOverlay = document.querySelector("#accept-overlay") as HTMLDivElement;

// Database References
const waitingPlayersRef = db.collection(waitingPlayersCollection);
const usersCollecRef = db.collection(usersCollection);
const userId = getUserID();
// early delete any left over gameRef
db.collection(usersCollection).doc(userId).update({ gameRef: firestore.FieldValue.delete() });

let waitingPlayerDocId = userId;
let unsubscribe: any;

// keep setting doc in waitingPlayersCollection every 5 seconds
// so that that is no problem like showing finding a game but the doc is not in the waitingPlayersCollection
let addToWaitingPlayersInterval: number;

//* Call when a user click play button and then a user will get into waiting state
async function getQueue() {
    // Update UI
    waitingOverlay.style.visibility = "visible";
    showBackdrop(true);
    waitingState = WaitingState.FINDING;

    // delete any waiting players that have been created for more than 10 minutes
    const last10minsDate = getNextMinsDate(-10);
    console.log("🤷‍♂️👍👍👍 | nextTenMinutesDate", last10minsDate);
    db.collection(waitingPlayersCollection)
        .where("createdTimestamp", "<", last10minsDate) // created before the last 10 minutes
        .get()
        .then(snap => snap.docs.forEach(doc => doc.ref.delete()))
        .then(() => {
            // then add to the waitingPlayers Collection again by rewriting
            setToWaitingPlayers(userId);
            // NOTE: setInterval sets timeout first then the callback keeps getting invoked
            addToWaitingPlayersInterval = setInterval(() => setToWaitingPlayers(userId), 5000); // every 5 seconds
            // after searching for 10 minutes, stop
            setTimeout(() => {
                clearInterval(addToWaitingPlayersInterval);
                cancelQueue();
                alert(
                    "No players are playing at the moment.\nTry searching later or just invite a friend. 😉"
                );
            }, 10 * 60 * 1000); // 10 minutes
        });

    // Add listener to add the database
    // this function will call when users/{userId}/gameRef is changed
    unsubscribe = db.doc(`users/${userId}`).onSnapshot(user => {
        try {
            const gameRoomRef = user.data()!.gameRef as DocRefType;
            if (gameRoomRef) {
                clearInterval(addToWaitingPlayersInterval);
                db.collection(waitingPlayersCollection).doc(userId).delete(); // in case it's still there
                console.log(`Found a game! 😁 with id: ${gameRoomRef.id}`);
                const gameId = gameRoomRef.id;
                promptToAccept(gameRoomRef); // prompt overlay is now showing, if accept field "joined" will be + 1, if not, will DELETE game doc
                waitingOverlay.style.visibility = "hidden"; // hide waiting for player overlay
                // listen to joined field, if 2, redirect. if -1, find room again
                db.doc(`games/${gameId}`).onSnapshot(snap => {
                    const gameDoc = snap.data() as GameDoc;
                    if (gameDoc) {
                        const joined = gameDoc.joined;
                        if (joined === 2) {
                            // both players accept the match. += 1 from each within function "handleAcceptOverlayOnClick"
                            sessionStorage.setItem("gameRoom", gameId);
                            db.collection(usersCollection).doc(userId).update({
                                startedPlayingAt: firestore.FieldValue.serverTimestamp(),
                            });
                            window.location.href = "online.html";
                        }
                    } else {
                        // game doc on firestore just got deleted which fires onSnapshot as well
                        // or match cancelling from another player deletes the game doc, resulting in undefined
                        if (waitingState === WaitingState.WAITING) {
                            waitingState = WaitingState.IDLE;
                            promptAcceptOverlay.style.visibility = "hidden";
                            showBackdrop(false);
                        }
                    }
                });
            } else {
                console.log(`gameRef field is currently ${gameRoomRef}`);
            }
        } catch (err) {
            console.log(err.message);
        }
    });
}

//* Remove a user from match making queue
async function cancelQueue() {
    clearInterval(addToWaitingPlayersInterval);

    // Update UI
    waitingOverlay.style.visibility = "hidden";
    showBackdrop(false);
    waitingState = WaitingState.IDLE;

    //Remove me from the waitingPlayers Collection
    await waitingPlayersRef.doc(waitingPlayerDocId).delete();

    //Detach listener
    unsubscribe();
}

playBtn.addEventListener("click", getQueue);
waitingOverlay.addEventListener("click", cancelQueue);

const renderScoreboard = (ul: HTMLUListElement, sortedPlayer: UserDoc[]) => {
    let rank = 1;
    sortedPlayer.forEach(player => {
        const wrapper = document.createElement("div");
        // prettier-ignore
        wrapper.innerHTML = `<li><p id="rank-value" style="color:black;">${rank}</p><p id="name-value" style="color:black;">${player.username}</p><p id="point-value" style="color:black;">${player.point.toFixed(0)}</p><p id="rate-value" style="color:black;">${player.numGames === 0 || player.numGames === undefined ? 0 : Math.round(player.numWins / player.numGames * 100)}%</p></li>`;
        const li = wrapper.firstChild as HTMLLIElement;
        if (rank % 2 === 1) {
            // display a blue background
            addBgColor(li);
        }
        ul.appendChild(li);
        rank += 1;
    });
};

/// render the page
// render username
usersCollecRef
    .doc(userId)
    .get()
    .then(snap => {
        const usernameDiv = document.querySelector("#user-name") as HTMLDivElement;
        const userDoc = snap.data() as UserDoc;
        // prettier-ignore
        usernameDiv.innerHTML = `Hello <span style="color: darkblue; font-weight: bold;">${userDoc.username}</span> ${getRandomEmoji()}`;
    });
// render scoreboard
db.collection(usersCollection)
    .where("isAnonymous", "==", false)
    .orderBy("point", "desc")
    .get()
    .then(collectionSnapshot => {
        const validUsers = collectionSnapshot.docs.map(snap => snap.data() as UserDoc);
        const ul = document.querySelector("#scoreboard-ul") as HTMLUListElement; // should be only ul on the page
        renderScoreboard(ul, validUsers); // will render nothing if we found no valid user
    });
/// done rendering

const changeAcceptOverlayTextAndColor = (
    h1Text: string,
    h2Text: string,
    color: string = "rgb(144, 144, 255)" // light purple
) => {
    promptAcceptOverlay.querySelector("h1")!.innerText = h1Text;
    promptAcceptOverlay.querySelector("h2")!.innerText = h2Text;
    promptAcceptOverlay.style.backgroundColor = color;
};

const handleAcceptOverlayOnClick = (gameRef: DocRefType, timerToCancelMatch: number) => {
    // user clicks the overlay
    // if from idle to waiting
    if (waitingState === WaitingState.FINDING) {
        // clear timer
        clearTimeout(timerToCancelMatch);

        // +1 to the field joined of game doc
        waitingState = WaitingState.WAITING;
        gameRef.update({ joined: firestore.FieldValue.increment(1) }); /// increment whatever in the field

        // wait for another player for another 10 secs, NOTE: will be redirected first if another player accepts
        const waitTimeForOpponentAfterClickedAccept = 10000; // 10 secs
        setTimeout(() => {
            cancelMatch(gameRef);
            alert("Your opponent did not accept the match!\n😪😪😪");
        }, waitTimeForOpponentAfterClickedAccept);
        changeAcceptOverlayTextAndColor(
            "Waiting for another player",
            "Click to Cancel",
            "lightpink" // make it standout more
        );
    } else if (waitingState === WaitingState.WAITING) {
        // This clicks to cancel manually
        cancelMatch(gameRef);
    }
};

const promptToAccept = (gameRef: DocRefType) => {
    // prompt overlay to accept
    changeAcceptOverlayTextAndColor("You found a game! 😀", "Click here to accept", "lightpink");
    // if the user accepts, timeout set to cancel match will be cancelled, joined += 1
    // if not in time, this will DELETE the game doc and other playing will be notified from onSnapshot
    const timeToAccept = 10000; // 10 secs
    // when a match is found,
    const confirmCountDown = setTimeout(() => {
        cancelMatch(gameRef, "You did not accept the match! 😠");
    }, timeToAccept); // while counting down time
    promptAcceptOverlay.style.visibility = "visible"; // show overlay with onclick to accept
    promptAcceptOverlay.onclick = () => {
        handleAcceptOverlayOnClick(gameRef, confirmCountDown);
    };
};

const cancelMatch = async (gameRef: DocRefType, alert: string = "") => {
    // signal game cancellation
    // delete gameRef field from both players
    const gameDoc = (await gameRef.get()).data() as GameDoc;
    gameDoc.p1Ref.update({ gameRef: firestore.FieldValue.delete() });
    gameDoc.p2Ref.update({ gameRef: firestore.FieldValue.delete() });
    // delete the game doc entirely
    gameRef.delete();
    // hide the overlay
    promptAcceptOverlay.style.visibility = "hidden";
    showBackdrop(false);
    // blame the user if didn't accept
    if (alert !== "") window.alert(alert);
    waitingState = WaitingState.IDLE;
};
