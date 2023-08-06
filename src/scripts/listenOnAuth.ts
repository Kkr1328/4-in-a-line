import { auth } from "./firebase";

/// Except on login page, offline page, and rule page, if no user, redirect to login page.
auth.onAuthStateChanged(function (user) {
    if (!user) {
        window.location.href = "/";
    }
});
