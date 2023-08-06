import { db, usersCollection, firestore, waitingPlayersCollection } from "./firebase";
import { UserDoc, AlignedCellsType } from "./types";

export const setToWaitingPlayers = (userId: string) => {
    db.collection(waitingPlayersCollection).doc(userId).set({
        userId,
        createdTimestamp: firestore.FieldValue.serverTimestamp(),
    });
};

export const getNextMinsDate = (minutes: number, d = new Date()) => {
    // round a date object to the nearest x minutes,
    // or if you don't give it any date it will round the current time.

    const ms = 1000 * 60 * minutes; // convert minutes to ms
    const addedMinsDate = new Date(d.getTime() + ms);

    return addedMinsDate;
};

export const getRandomColor = () => {
    // prettier-ignore
    const colors = ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', 
    '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D',
    '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', 
    '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC',
    '#66994D', '#B366CC', '#4D8000', '#B33300', '#CC80CC', 
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680', 
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3', 
        '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
    return colors[Math.floor(Math.random() * colors.length)];
};

export const showBackdrop = (isShown: boolean) => {
    // overlay that blocks everything behind
    // requires that <div class="backdrop"></div> is in the markup
    // see _variables.scss for z-index property
    const backdrop = document.querySelector(".backdrop") as HTMLDivElement;
    if (isShown) {
        backdrop.style.opacity = "1";
        backdrop.style.visibility = "visible";
    } else {
        backdrop.style.opacity = "0";
        backdrop.style.visibility = "hidden";
    }
};

export const redirectToHomeOnLogin = (uid: string) => {
    sessionStorage.setItem("userId", uid); // save to session
    db.doc(usersCollection + "/" + uid).update({
        gameRef: firestore.FieldValue.delete(),
    });
    window.location.href = "home.html"; // redirect to home.html
};

export const saveToSession = (name: string, toSave: string) => {
    sessionStorage.setItem(name, toSave); // save to session
};

export const highlightAlignedCells = (
    table: HTMLDivElement[][],
    alignedCells: AlignedCellsType
) => {
    // dim other cells except those in alignedCells
    for (const rowOfCells of table) {
        for (const cell of rowOfCells) {
            cell.style.opacity = "0.5";
        }
    }

    for (const { col, row } of alignedCells) {
        table[row][col].style.opacity = "1";
    }
};

export const highlightAlignedCellsOffline = (
    table: { [row: number]: HTMLDivElement[] },
    alignedCells: HTMLDivElement[]
) => {
    // dim other cells except those in alignedCells
    for (const row in table) {
        for (const cell of table[row]) {
            cell.style.opacity = "0.5";
        }
    }

    for (const cell of alignedCells) {
        cell.style.opacity = "1";
    }
};

export const highlightPlayer = (
    playerSignature: number,
    HighlightColor = "yellow",
    defaultColor = "white"
) => {
    const playerBtns = document.getElementsByClassName(
        "player"
    ) as HTMLCollectionOf<HTMLDivElement>;
    if (playerSignature === 1) {
        playerBtns[0].style.backgroundColor = HighlightColor;
        playerBtns[1].style.backgroundColor = defaultColor;
    } else if (playerSignature === 2) {
        playerBtns[1].style.backgroundColor = HighlightColor;
        playerBtns[0].style.backgroundColor = defaultColor;
    }
};

export const showDroppingOverlay = (
    really: boolean,
    h1: string = "Dropping your coin...",
    h2: string = "😗😗😗"
) => {
    const droppingOverlay = document.getElementById("dropping-coin-overlay") as HTMLDivElement;
    if (really) {
        droppingOverlay.style.visibility = "visible";
        droppingOverlay.querySelector("h1")!.innerText = h1;
        droppingOverlay.querySelector("h2")!.innerText = h2;
    } else {
        droppingOverlay.style.visibility = "hidden";
    }
};

export const changeTopLabelInGame = (turnLabel: HTMLDivElement, toWhat: string) => {
    turnLabel.innerText = toWhat;
};

export const getGameBoard = (onClickHandler: (event: any) => void, rows: number) => {
    // * create table in memory
    const twoDimensionTable = new Array<Array<HTMLDivElement>>();
    for (let row = 0; row < rows; ++row) {
        const emptyRow = Array<HTMLDivElement>();
        twoDimensionTable.push(emptyRow);
    }

    const tableColumns = Array.from(
        document.getElementsByClassName("col") as HTMLCollectionOf<HTMLDivElement>
    );
    for (const col of tableColumns) {
        col.addEventListener("click", onClickHandler);
        for (const cell of col.getElementsByClassName("cell") as HTMLCollectionOf<HTMLDivElement>) {
            const rowOfThisCell = parseInt(cell.dataset.row as string); // data-row in .cell div
            twoDimensionTable[rowOfThisCell].push(cell);
        }
    }
    return twoDimensionTable;
};

export const RedirectToGameResult = () => {};

export const getRandomEmoji = () => {
    const randomEmojis = [
        "😎",
        "😳",
        "👽",
        "👻",
        "🦄",
        "🦜",
        "👀",
        "🧛‍♂️",
        "💪",
        "🤘",
        "👌",
        "🎈",
        "🎆",
        "🎇",
        "🎉",
        "✨",
        "🎃",
        "🎊",
        "💎",
        "🍕",
        "🍆",
        "🍌",
        "🛸",
        "⭐",
        "🌈",
        "🌊",
        "❤",
        "🧡",
        "💛",
        "💚",
        "💙",
        "💜",
        "😑",
        "😁",
        "🤣",
        "😂",
        "🥰",
    ];
    return randomEmojis[Math.floor(Math.random() * randomEmojis.length)];
};

export const changeSidebarToNotLoginState = () => {
    // remove the second and the third item, namely market and history
    const navListItems = Array.from(
        document.getElementsByClassName("sidebar-item")
    ) as HTMLLIElement[];
    navListItems[0].querySelector("a")!.href = "/"; // go to login page instead of home
    navListItems[1].style.display = "none";
    navListItems[2].style.display = "none";
    // change "logout" to "login" and set onclick to go to the login page
    const logInOutBtn = document.getElementById("logInOut-btn") as HTMLButtonElement;
    logInOutBtn.innerText = "LOG IN";
    logInOutBtn.onclick = () => {
        window.location.href = "/"; // go to login page
    };
};

export function getUserID() {
    return sessionStorage.getItem("userId") as string;
}

export const getUserRefAndUserDoc = async (id: string) => {
    const userRef = db.doc(`${usersCollection}/${id}`);
    const userDoc = (await userRef.get()).data() as UserDoc;
    return { userRef, userDoc };
};

export const addBgColor = (
    element: HTMLElement,
    color: string = "rgb(228, 248, 255)" // very light blue
) => {
    element.style.backgroundColor = color;
};
