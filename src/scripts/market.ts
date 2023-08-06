// * This script is for the market page

import { db, firestore, usersCollection } from "./firebase";
import { Coin, UserDoc, Visibility } from "./types";
import { getUserID, saveToSession } from "./utils";

const userId = getUserID(); // we are sure that we have a logged in user, at least an anonymous user

// Possible innerText values of the card buttons
const buttonInnerText: {
    equipped: string;
    purchase: string;
    equip: string;
} = {
    equipped: "Equipped",
    purchase: "Purchase",
    equip: "Equip",
};

let hasWarnedAboutAnonymouslyBuy = false;

const ul = document.getElementById("skins-ul") as HTMLUListElement;

const personalize = (userDoc: UserDoc) => {
    // change some skin card button innerTexts to match user's data
    // and also your coins
    // we know all user's skins and equipped skin and we can only change these

    const allLis = ul.getElementsByTagName("li");

    // change the li button innerTexts
    const equippedSkinName = userDoc.equippedSkin;
    const ownedFirestoreSkinNames = userDoc.skins;
    for (const li of allLis) {
        const firestoreNameOfLi = li.dataset.firestoreSkinName as string;
        if (firestoreNameOfLi === equippedSkinName) {
            changeButtonInnerTextInLi(li, buttonInnerText.equipped);
            li.style.backgroundColor = "lightpink";
        } else if (ownedFirestoreSkinNames.includes(firestoreNameOfLi)) {
            changeButtonInnerTextInLi(li, buttonInnerText.equip);
            li.style.backgroundColor = "lightblue";
        }
    }
    // display your coins at the top of the page
    const yourCoinP = document.querySelector("#your-coin") as HTMLParagraphElement;
    yourCoinP.innerText = `Your coins: ${Math.round(userDoc.money)}`;
};

const handleCardButtonOnClick = async (event: Event) => {
    // respond to click and handle appropriately
    // see what button is clicked
    // see the structure of the li in renderDefaultList function

    const button = event.target as HTMLButtonElement;
    const clickedLi = <HTMLLIElement>button.parentElement;
    const firestoreSkinNameOfLi = clickedLi.dataset.firestoreSkinName;

    // if the user is already equipped this coin, return
    // shown as "Equipped"
    // This should not be important because the button should be disabled in the first place by function personalize
    if (userDoc.equippedSkin === firestoreSkinNameOfLi) return;

    // if the user owns it but hasn't equipped it,
    // shown as "Equip"
    // then equip it 🤣🤣😂 lmao
    if (button.innerText === buttonInnerText.equip) {
        // const previouslyEquippedSkinId = userDoc.equippedSkin.id;

        /// 😎 update the user doc that we equip it ///
        db.doc(`${usersCollection}/${userId}`)
            .update({
                equippedSkin: firestoreSkinNameOfLi,
            })
            .then(async () => (userDoc = await getUpdatedUserDocAndRepaint()));
        return;
    }

    // if the user hasn't owned it, tries to purchase
    // shown as the price of the skin at the button innerText

    // get the price of the clicked coin skin
    const beingPurchasedCoin = allCoins.find(
        coin => coin.firestoreName === firestoreSkinNameOfLi
    ) as Coin;
    if (beingPurchasedCoin.price > userDoc.money) {
        alert("Not enough money bro xd 🤣🤣🤣");
        return;
    }

    if (userDoc.isAnonymous) {
        saveToSession("currentMoney", userDoc.money + "");
        if (!hasWarnedAboutAnonymouslyBuy) {
            alert("You need to login to keep your purchased coins ⚠⚠⚠");
            alert("You can sign up RIGHT NOW ONLY to keep your money. 😉");
            hasWarnedAboutAnonymouslyBuy = true;
            const displayName = (clickedLi.querySelector("#skin-name") as HTMLParagraphElement)
                .innerText;
            if (confirm(`Do you wish to purchase ${displayName} anyway?`) === false) return;
        }
    }

    // update user doc, add new skin and reduce money, THEN getUpdatedUserDocAndRepaint()
    userRef
        .update({
            skins: firestore.FieldValue.arrayUnion(firestoreSkinNameOfLi),
            money: firestore.FieldValue.increment(-beingPurchasedCoin.price),
            equippedSkin: beingPurchasedCoin.firestoreName, // auto equip
        })
        .then(async () => (userDoc = await getUpdatedUserDocAndRepaint()));
};

const getUpdatedUserDocAndRepaint = async () => {
    // return an updated user document with fresh new data from firestore
    const doc = (await userRef.get()).data() as UserDoc;
    personalize(doc); // apply the update to the UI
    return doc;
};

const changeButtonInnerTextInLi = (li: HTMLLIElement, toWhat: string) => {
    li.querySelector("button")!.innerText = toWhat;
};

/// --- (p≧w≦q) MAIN PART (p≧w≦q) --- ///

// 1. get skins
import { allCoins } from "./coins";

// 2. populate the ul with default skin cards
const renderDefaultList = (ul: HTMLUListElement, allCoins: Coin[]) => {
    // render default cards for the user to see first
    // const defaultText = buttonInnerText.purchase; // show this before we personalize the page with user data
    allCoins.forEach(coin => {
        if (coin.visibility === Visibility.HIDE) return; // don't render this

        let li: string;
        li = `<li class="skin-li" data-firestore-skin-name="${coin.firestoreName}"> <img src="${coin.path}" alt="${coin.displayName}" style="border-radius: 50%; border: ${coin.tierColor} solid 5px;" /> <p id="skin-name" style="font-weight: bold; color: ${coin.tierColor}">${coin.displayName}</p> <p id="skin-price" style="color: ${coin.tierColor}; font-size: smaller;">${coin.tierName}</p><button id="skin-selection" data-price="${coin.price}" style="width: 10ch; padding: 0; margin: 0 auto; border: ${coin.tierColor} solid 1px;">${coin.price}</button> </li>`;

        // append a li to the ul
        ul.insertAdjacentHTML("beforeend", li); // beforeend tells where to put the li, which is after the ul's last child
    });
};

renderDefaultList(ul, allCoins);

// 3. get the user purchased and equipped coin skins
const userRef = db.doc(`${usersCollection}/${userId}`);
let userDoc: UserDoc; // This will be updated with fresh new data when getUpdatedUserDoc is called
userRef.get().then(snap => {
    userDoc = snap.data() as UserDoc;
    // 4. apply changes to cards, such as change "purchase" to "equipped"
    personalize(userDoc); // call this to actually apply
});

// 5. Add listener to all buttons
Array.from(ul.getElementsByTagName("button")).forEach(
    button => (button.onclick = handleCardButtonOnClick)
);
/// --- ◑﹏◐ END MAIN PART ◑﹏◐ --- ///
