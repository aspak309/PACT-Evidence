// PACT Evidence
// Firebase Authentication + Google Sign-In

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { firebaseConfig } from "./firebase-config.js";


// --------------------------------------------------
// Firebase Initialization
// --------------------------------------------------

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();


// --------------------------------------------------
// Google Login
// --------------------------------------------------

const loginBtn = document.getElementById("loginBtn");

if (loginBtn) {

  loginBtn.addEventListener("click", async () => {

    try {

      loginBtn.disabled = true;
      loginBtn.textContent = "Signing in...";

      const result = await signInWithPopup(
        auth,
        googleProvider
      );

      console.log(
        "Google login successful:",
        result.user.email
      );

    } catch (error) {

      console.error(
        "Google Sign-In Error:",
        error
      );

      loginBtn.disabled = false;
      loginBtn.textContent = "Continue with Google";


      if (error.code === "auth/popup-closed-by-user") {

        alert("Google sign-in was cancelled.");

        return;
      }


      if (error.code === "auth/popup-blocked") {

        alert(
          "Google sign-in popup was blocked by your browser.\n\n" +
          "Please allow popups for this website and try again."
        );

        return;
      }


      if (error.code === "auth/cancelled-popup-request") {

        return;
      }


      if (
        error.code ===
        "auth/account-exists-with-different-credential"
      ) {

        alert(
          "An account already exists with this email " +
          "using a different sign-in method."
        );

        return;
      }


      alert(
        "Google login failed.\n\n" +
        (error.message || "Unknown authentication error.")
      );

    }

  });

}


// --------------------------------------------------
// Authentication State
// --------------------------------------------------

onAuthStateChanged(auth, (user) => {

  if (user) {

    console.log(
      "PACT user signed in:",
      user.email
    );

    if (loginBtn) {

      loginBtn.classList.add("hidden");

    }

  } else {

    console.log(
      "No PACT user signed in."
    );

    if (loginBtn) {

      loginBtn.classList.remove("hidden");

      loginBtn.disabled = false;

      loginBtn.textContent =
        "Continue with Google";

    }

  }

});


// --------------------------------------------------
// Logout
// --------------------------------------------------

window.pactLogout = async function () {

  try {

    await signOut(auth);

    console.log(
      "PACT user signed out."
    );

  } catch (error) {

    console.error(
      "Logout Error:",
      error
    );

    alert(
      "Logout failed.\n\n" +
      (error.message || "Unknown logout error.")
    );

  }

};


// --------------------------------------------------
// Exports
// --------------------------------------------------

export {
  app,
  auth
};
