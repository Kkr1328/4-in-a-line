import { getUserID, getUserRefAndUserDoc } from "./utils";
import { GameResult } from "./types";

const getUserHistory = async (userId: string) => {
    const { userDoc } = await getUserRefAndUserDoc(userId);
    return userDoc.history;
};

const renderHistory = (ul: HTMLUListElement, history: GameResult[]) => {
    let count = 0;
    for (const { didWin, opponentUsername, turns, isTie } of history.slice().reverse()) {
        const result = isTie ? "tied 🙄" : didWin ? "won 😎" : "lost 😭";
        // prettier-ignore
        let li = `<li style="text-align: center;"> <p id="hname-value">${opponentUsername}</p> <p id="hresult-value">${result}</p> <p id="hturns-value">${turns}</p> </li> `;
        if (count % 2 === 1) {
            li = `<li style="background-color: rgb(228, 248, 255); text-align: center;"> <p id="hname-value">${opponentUsername}</p> <p id="hresult-value">${result}</p> <p id="hturns-value">${turns}</p> </li> `;
        }
        ul.insertAdjacentHTML("beforeend", li);
        count += 1;
    }
};

// MAIN PART //
// get user's history
const userId = getUserID();
getUserHistory(userId).then(userHistory => {
    // render the history
    const historyUL = document.getElementById("history-ul") as HTMLUListElement;
    renderHistory(historyUL, userHistory);
});

// END MAIN PART //
