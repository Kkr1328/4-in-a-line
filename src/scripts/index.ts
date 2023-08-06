// <script defer src="...path/to/main.js"></script>

import { auth, db, firestore, googleProvider, usersCollection } from "./firebase";
import { UserDoc } from "./types";
import { redirectToHomeOnLogin } from "./utils";

const DEFAULT_SKIN = "Gold Default";
const DEFAULT_SKIN2 = "Silver Default";
// current money is from when an anonymous player clicked purchase and he sees the popup, see market.ts
let currentMoney: number | string = sessionStorage.getItem("currentMoney") as string;
const baseMoney = 100;
let money = baseMoney;
if (currentMoney !== null) {
    sessionStorage.clear(); // We said RIGHT NOW ONLY in market.ts, so only one time use, so we clear it.
    currentMoney = parseInt(currentMoney);
    if (currentMoney > baseMoney) {
        money = currentMoney;
    }
}
const NEW_USER: UserDoc = {
    email: "",
    equippedSkin: DEFAULT_SKIN,
    history: [],
    money,
    point: 0,
    skins: [DEFAULT_SKIN, DEFAULT_SKIN2],
    username: "",
    isAnonymous: false,
    numGames: 0,
    numWins: 0,
    createdAt: firestore.FieldValue.serverTimestamp(),
};

// Get Element
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

const signupEmail = document.getElementById("signupEmail") as HTMLInputElement;
const signupName = document.getElementById("signupName") as HTMLInputElement;
const signupPassword = document.getElementById("signupPass") as HTMLInputElement;
const signupRePassword = document.getElementById("confirmedPass") as HTMLInputElement;

const btnLogin = document.getElementsByClassName("login-btn")[0] as HTMLButtonElement;
const anonymousLogin = document.getElementById("anonymous-btn") as HTMLButtonElement;
const btnSignUp = document.getElementsByClassName("overlay-button")[0] as HTMLButtonElement;

const googleButton = document.getElementById("google-login-area") as HTMLDivElement;

async function LoginWithEmail(email: string, password: string) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        // Redirect to home page
        if (userCredential.user) redirectToHomeOnLogin(userCredential.user.uid);
        else console.log("User is not found. wtf?");
    } catch (error) {
        console.log(error.message);
    }
}

btnLogin.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    LoginWithEmail(email, password);
});

anonymousLogin.addEventListener("click", async () => {
    try {
        const userCredential = await auth.signInAnonymously();
        const userId = (await userCredential.user?.uid) as string;

        // Create temporary user data in database
        const anonymousUser = NEW_USER;
        anonymousUser.username = "Annie-" + userId.slice(0, 5);
        anonymousUser.isAnonymous = true;

        // sessionStorage.setItem("userId", userId);
        await db.collection("users").doc(userId).set(anonymousUser);

        if (userCredential.user) redirectToHomeOnLogin(userCredential.user.uid);
        else console.log("User is not found. wtf?");
    } catch (error) {
        console.log(error.message);
    }
});

btnSignUp.addEventListener("click", () => {
    const email = signupEmail.value;
    const username = signupName.value;
    const password = signupPassword.value;
    const confirmedPassword = signupRePassword.value;

    if (password != confirmedPassword) {
        alert("Passwords do not match");
        return;
    }
    const promise = auth.createUserWithEmailAndPassword(email, password);
    promise
        .then(userCredential => {
            let user = userCredential.user;

            const newUserDoc = NEW_USER;
            newUserDoc.email = email;
            newUserDoc.username = username;

            db.collection("users").doc(user?.uid).set(newUserDoc);
        })
        .then(() => LoginWithEmail(email, password))
        .catch(e => alert(e.message));
});

const loginWithGoogle = async () => {
    const provider = new googleProvider();
    try {
        const userCredential = await auth.signInWithPopup(provider);
        const user = userCredential.user;
        if (user) {
            // check if exists in users collection?
            const validUserSnaps = await db
                .collection(usersCollection)
                .where("isAnonymous", "==", false)
                .get();
            validUserSnaps.forEach(snap => {
                // if already created by below lines
                if (snap.id === user!.uid) redirectToHomeOnLogin(snap.id);
            });
            // still doesn't get redirected, not saved in users collection
            // create new user
            const newUserDoc = NEW_USER;
            newUserDoc.email = user.email as string;
            newUserDoc.username = user.displayName!.split(" ")[0] as string;
            await db.doc(`${usersCollection}/${user.uid}`).set(newUserDoc);
            redirectToHomeOnLogin(user.uid);
        } else console.log("User is not found.");
    } catch (error) {
        // login failed on auth sign in
        console.log(error);
    }
};

googleButton.onclick = loginWithGoogle;
