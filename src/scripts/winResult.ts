// import { getUserRefAndUserDoc, getUserID } from "./utils";

const renderPage = async () => {
    // const { userRef, userDoc } = await getUserRefAndUserDoc(userId);
    const winnerMoney = sessionStorage.getItem("winnerMoney") as string;
    const loserMoney = sessionStorage.getItem("loserMoney") as string;
    const opponentUsername = sessionStorage.getItem("opponentUsername") as string;
    const myUsername = sessionStorage.getItem("myUsername") as string;
    const endResult = sessionStorage.getItem("endResult") as string; // "win" or "lose" or "tie"

    // grab all elements which will be rendered
    const winnerUsernameSection = document.getElementById("winner-username") as HTMLElement;
    const winnerMoneyText = document.getElementById("winner-money") as HTMLElement;
    const loserUsernameSection = document.getElementById("loser-username") as HTMLElement;
    const loserMoneyText = document.getElementById("loser-money") as HTMLElement;

    if (["win", "tie"].includes(endResult)) {
        winnerUsernameSection.innerText = myUsername;
        loserUsernameSection.innerText = opponentUsername;
        if (endResult === "tie") {
            Array.from(
                <HTMLCollectionOf<HTMLParagraphElement>>document.getElementsByClassName("result")
            ).forEach(
                p => (p.innerText = "TIE") // change from Winner and Loser, to TIE
            );
        }
    } else {
        // lose
        winnerUsernameSection.innerText = opponentUsername;
        loserUsernameSection.innerText = myUsername;
    }

    // winnerMoney and loserMoney = baseMoney if they tie. This is from online.ts
    winnerMoneyText.innerText = `+ ${winnerMoney} points`;
    loserMoneyText.innerText = `+ ${loserMoney} points`;
};

/// MAIN PART ///
// get updated user doc after gcf updated it, and render the page
renderPage();
console.log("Are you satisfied?? 😊");
// add on click to go to home
document.getElementById("aftermatch-button")!.querySelector("li")!.onclick = () => {
    location.href = "home.html";
};
