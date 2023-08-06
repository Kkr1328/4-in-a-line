// gets executed when user enters offline mode

import { changeSidebarToNotLoginState, highlightAlignedCellsOffline } from "./utils";
import { allCoins } from "./coins";
import { CellCoordinate, OfflineTable } from "./types";

changeSidebarToNotLoginState();

// * client side game logic
const rows = 6;
const cols = 7;
// ! NOTE --------------------------------------------
// * 0th row is at the bottom, 0th col is at the left
// * The stack pointer's initial value is 0 of each col

const player1signature = "1";
const player2signature = "2";
const numCoins = allCoins.length;
// select coins
const player1Coin = allCoins[Math.floor(Math.random() * numCoins)];
let player2Coin = allCoins[Math.floor(Math.random() * numCoins)];
while (player1Coin.displayName === player2Coin.displayName) {
    player2Coin = allCoins[Math.floor(Math.random() * numCoins)];
}
// apply coin backgrounds
const playerBoxes = document.getElementsByClassName(
    "player-box"
) as HTMLCollectionOf<HTMLDivElement>;
playerBoxes[0].style.backgroundImage = `linear-gradient(to right,rgba(255, 255, 255, 0.5),rgba(255, 255, 255, 0.5)), url("${player1Coin.path}")`;
playerBoxes[1].style.backgroundImage = `linear-gradient(to right,rgba(255, 255, 255, 0.5),rgba(255, 255, 255, 0.5)), url("${player2Coin.path}")`;

// * global game status
let gameActive = true;
let player1Turn = true;
let passedTurns = 1; // first turn starts at 1
let fullyFilledCols = 0;

// ____________________

const highlightPlayer = (
    playerSignature: string,
    HighlightColor = "yellow",
    defaultColor = "white"
) => {
    const playerBtns = document.getElementsByClassName(
        "player"
    ) as HTMLCollectionOf<HTMLButtonElement>;
    if (playerSignature === "1") {
        playerBtns[0].style.backgroundColor = HighlightColor;
        playerBtns[1].style.backgroundColor = defaultColor;
    } else if (playerSignature === "2") {
        playerBtns[1].style.backgroundColor = HighlightColor;
        playerBtns[0].style.backgroundColor = defaultColor;
    }
};
// starts with a player being highlighted
player1Turn ? highlightPlayer(player1signature) : highlightPlayer(player2signature);

const handleColOnClick = (event: Event, table: OfflineTable) => {
    if (!gameActive) return;
    if (fullyFilledCols === cols) {
        setTimeout(() => {
            popupTie();
        }, 0);
        gameActive = false;
        window.location.reload();
        return;
    }

    // *** There are 2 things that need to be updated along the way,
    // * div.col's data-stack-pointer, and div.cell's data-owned-by
    // ** This manipulates global game status

    const targetElem = event.target as HTMLDivElement;
    let targetCol = event.target as HTMLDivElement;
    if (targetElem.classList.contains("cell")) {
        targetCol = targetElem.parentElement as HTMLDivElement;
    }
    let currentStackPtr = parseInt(targetCol.dataset.stackPointer as string); // data-stack-pointer in .col div
    if (currentStackPtr === rows) return; // if stack pointer is at the top, ignore

    // prepare the color to add for whom just clicked
    let imgPath;
    let borderColor;
    if (player1Turn) {
        imgPath = player1Coin.path;
        borderColor = player1Coin.tierColor;
    } else {
        imgPath = player2Coin.path;
        borderColor = player2Coin.tierColor;
    }

    // drop the coin (change bg or img in .cell div)
    const cells = Array.from(
        targetCol.getElementsByClassName("cell") as HTMLCollectionOf<HTMLDivElement>
    );
    const targetedCell = cells.find(
        cell => cell.dataset.row == currentStackPtr + ""
    ) as HTMLDivElement;
    targetedCell.style.backgroundImage = `url("${imgPath}")`; // or backgroundImage
    targetedCell.style.borderColor = borderColor;
    targetedCell.dataset.ownedBy = player1Turn ? player1signature : player2signature; // update ownership
    player1Turn = !player1Turn; // change the turn to the second player
    player1Turn ? highlightPlayer(player1signature) : highlightPlayer(player2signature);

    const turnsToCheckFromNowOn = 7; // at least 7 turns to win
    if (passedTurns < turnsToCheckFromNowOn) {
        moveStackPointer(targetCol);
        ++passedTurns;
        return;
    }

    // ? use requestAnimationFrame for the use of loop within isWin ???
    const { winner, alignedCells } = isWin(targetedCell, targetCol);
    if (winner !== null) {
        gameActive = false;
        // use setTimeout to show popup after repainting
        highlightPlayer(winner);
        highlightAlignedCellsOffline(table, alignedCells);
        setTimeout(() => {
            alert("Player " + winner + " wins!");
            window.location.reload();
        }, 1000);
    }
    moveStackPointer(targetCol);
    passedTurns += 1;
};

const moveStackPointer = (col: HTMLDivElement) => {
    // move up the stack pointer to the above empty cell
    const newStackPtr = parseInt(col.dataset.stackPointer as string) + 1;
    if (newStackPtr === rows) ++fullyFilledCols; // this col is just fully filled
    col.dataset.stackPointer = newStackPtr + "";
};

const popupTie = () => {
    alert("TIE");
};

const isWin = (targetCell: HTMLDivElement, targetCol: HTMLDivElement) => {
    // * check for winning conditions
    // * return { winner, Array(Those 4 aligned cells) }

    // assume a player wins
    const result = {
        winner: <string | null>targetCell.dataset.ownedBy,
        alignedCells: <HTMLDivElement[]>[],
    };
    // * note: target col's stack pointer _hasn't_ been moved up
    const cellsCheckedOnce = 4;

    const areOwnedByTheSamePlayer = (cells: HTMLDivElement[]) => {
        // check memberships of each 4 cells
        // return true if they share common owner else false
        const distinctCellOwnerships = new Set(cells.map(cell => cell.dataset.ownedBy));
        // data-owned-by="" signals empty cell
        if (distinctCellOwnerships.has("")) return false;
        // Having one member in the set signals 4 cells owned by the same player
        if (distinctCellOwnerships.size === 1) return true;
        return false;
    };

    const getVerticalCells = (row: number, col: number) => {
        let cells = [];
        for (let rowOffset = 0; rowOffset < cellsCheckedOnce; ++rowOffset) {
            cells.push(twoDimensionTable[row + rowOffset][col]);
        }
        return cells;
    };

    {
        // * vertically check 4 cells at a time
        const colToCheck = parseInt(targetCol.dataset.col as string);
        // offset upwards
        for (
            // " + 1" because if there are 6 rows and we check 4 cells at once
            // we need to loop 6 - 4 + 1 = 3 times
            let rowToCheck = 0;
            rowToCheck < rows - cellsCheckedOnce + 1;
            ++rowToCheck
        ) {
            // rowToCheck starts from the top
            const verticalCells = getVerticalCells(rowToCheck, colToCheck);

            if (areOwnedByTheSamePlayer(verticalCells)) {
                // We found the winner!
                result.alignedCells = verticalCells;
                return result;
            }
        }
    }

    const getHorizontalCells = (row: number, col: number) => {
        let cells = [];
        for (let colOffset = 0; colOffset < cellsCheckedOnce; ++colOffset) {
            cells.push(twoDimensionTable[row][col + colOffset]);
        }
        return cells;
    };

    {
        // * horizontal check
        const rowToCheck = parseInt(targetCell.dataset.row as string);
        for (
            let colToCheck = 0;
            colToCheck < cols - cellsCheckedOnce + 1; // for " + 1" see comment on vertical check
            ++colToCheck
        ) {
            // left to right
            const horizontalCells = getHorizontalCells(rowToCheck, colToCheck);

            if (areOwnedByTheSamePlayer(horizontalCells)) {
                // We found the winner!
                result.alignedCells = horizontalCells;
                return result;
            }
        }
    }

    // get the coordinate of the targeted cell in conventional xy plane
    const targetedCellCoord = {
        x: parseInt(targetCol.dataset.col as string),
        y: parseInt(targetCell.dataset.row as string),
    };

    const getDiagCells = (slope: number, justDroppedCellCoord: CellCoordinate, xOffset: number) => {
        // * return 4 cells in a diagonal line with a given slope, including the targeted cell OR
        // ! return null if we use invalid index
        let cells = [];
        for (let i = 0; i < cellsCheckedOnce; ++i) {
            const x = justDroppedCellCoord.x + xOffset + i; // we know this
            if (x < 0 || x > cols - 1) return null;
            // y = m(x - xp) + yp
            const y = slope * (x - justDroppedCellCoord.x) + justDroppedCellCoord.y; // find this
            if (y < 0 || y > rows - 1) return null;
            const cell = twoDimensionTable[y][x]; // y represents row, x represents col
            cells.push(cell);
        }
        return cells;
    };

    {
        // * diagonal check
        // * checking with the idea of line equation with slope -1, 1
        const possibleXOffsets = [-3, -2, -1, 0]; // designed for getDiagCells
        const slopes = [-1, 1]; // for "\" and "/" respectively
        for (const xOffset of possibleXOffsets) {
            for (const slope of slopes) {
                const diagCells = getDiagCells(slope, targetedCellCoord, xOffset);
                if (diagCells === null) continue;
                if (areOwnedByTheSamePlayer(diagCells)) {
                    // We found the winner!
                    result.alignedCells = diagCells;
                    return result;
                }
            }
        }
    }

    result.winner = null; // no winning conditions have been met
    return result;
};

// * create table in memory
const twoDimensionTable: OfflineTable = {}; // { (nthRow: int): (row: <div class="cell">[]) }
for (let row = 0; row < rows; ++row) {
    const emptyRow: HTMLDivElement[] = [];
    twoDimensionTable[row] = emptyRow;
}

const tableColumns = Array.from(document.getElementsByClassName("col"));
for (const col of tableColumns) {
    col.addEventListener("click", e => handleColOnClick(e, twoDimensionTable));
    for (const cell of col.getElementsByClassName("cell")) {
        const rowOfThisCell = parseInt((<HTMLDivElement>cell).dataset.row as string); // data-row in .cell div
        twoDimensionTable[rowOfThisCell].push(<HTMLDivElement>cell);
    }
}
// * twoDimensionTable should look like this by now
// twoDimensionTable = {
//     5: [cell0, cell1, cell2, ..., cell6],
//     4: [cell0, cell1, cell2, ..., cell6],
//     ...,
//     0: [cell0, cell1, cell2, ..., cell6]
// }
