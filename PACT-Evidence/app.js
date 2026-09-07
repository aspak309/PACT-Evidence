// PACT Evidence
// Firebase Authentication + Google Sign-In (Single File)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// --------------------------------------------------
// Firebase Configuration (API Keys)
// --------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyA08bM4tDz0P9tl2ATlvgf1ATtJ8wgz9CQ",
  authDomain: "pact-evidence.firebaseapp.com",
  projectId: "pact-evidence",
  storageBucket: "pact-evidence.firebasestorage.app",
  messagingSenderId: "967496265313",
  appId: "1:967496265313:web:ea088afab5b8d79cd34420",
  measurementId: "G-EDYPG70WC3"
};

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

      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google login successful:", result.user.email);
      
      // लॉगिन होने के बाद प्रोफाइल पेज पर भेजें
      window.location.href = "profile.html";

    } catch (error) {
      console.error("Google Sign-In Error:", error);
      loginBtn.disabled = false;
      loginBtn.textContent = "Continue with Google";

      if (error.code === "auth/popup-closed-by-user") {
        alert("Google sign-in was cancelled.");
        return;
      }
      if (error.code === "auth/popup-blocked") {
        alert("Google sign-in popup was blocked by your browser.\n\nPlease allow popups for this website and try again.");
        return;
      }
      if (error.code === "auth/cancelled-popup-request") {
        return;
      }
      if (error.code === "auth/account-exists-with-different-credential") {
        alert("An account already exists with this email using a different sign-in method.");
        return;
      }
      alert("Google login failed.\n\n" + (error.message || "Unknown authentication error."));
    }
  });
}

// --------------------------------------------------
// Authentication State
// --------------------------------------------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("PACT user signed in:", user.email);
    if (loginBtn) {
      loginBtn.classList.add("hidden");
    }
  } else {
    console.log("No PACT user signed in.");
    if (loginBtn) {
      loginBtn.classList.remove("hidden");
      loginBtn.disabled = false;
      loginBtn.textContent = "Continue with Google";
    }
  }
});

// --------------------------------------------------
// Logout
// --------------------------------------------------
window.pactLogout = async function () {
  try {
    await signOut(auth);
    console.log("PACT user signed out.");
  } catch (error) {
    console.error("Logout Error:", error);
    alert("Logout failed.\n\n" + (error.message || "Unknown logout error."));
  }
};

// --------------------------------------------------
// Exports
// --------------------------------------------------
export { app, auth };
