// get ref to the button
const signUpButton = document.getElementById("signup-btn") as HTMLButtonElement;
// ref to backdrop filter
const blurOverlay = document.getElementById("blur-overlay-filter") as HTMLDivElement;
// ref to sign up overlay
const signUpOverlay = document.getElementById("sign-up-overlay") as HTMLElement;

// click sign up button to show overlays
signUpButton.onclick = () => {
    // display overlays, sign up form and backdrop filter
    blurOverlay.style.visibility = "visible";
    blurOverlay.style.opacity = "1";
    signUpOverlay.style.visibility = "visible";
    signUpOverlay.style.opacity = "1";
};

// click backdrop filter overlay to hide all overlays
blurOverlay.onclick = () => {
    blurOverlay.style.visibility = "hidden";
    blurOverlay.style.opacity = "0";
    signUpOverlay.style.visibility = "hidden";
    signUpOverlay.style.opacity = "0";
};
