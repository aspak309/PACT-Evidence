// app.js (Firebase Config + Login Logic सब एक ही जगह)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// 1. Firebase Config (यहीं पर अपना असली API Key और डिटेल्स डाल लेना)
const firebaseConfig = {
  apiKey: "AIzaSyB...", // अपनी API Key यहाँ डालो
  authDomain: "pact-evidence.firebaseapp.com",
  projectId: "pact-evidence",
  storageBucket: "pact-evidence.appspot.com",
  messagingSenderId: "...", // अपना सेंडर ID डालो
  appId: "..." // अपना App ID डालो
};

// 2. Firebase चालू करो
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 3. लॉगिन बटन को पहचानो
const loginBtn = document.getElementById("loginBtn");

// 4. बटन पर क्लिक करने का सिस्टम
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    try {
      // क्लिक होते ही लोडिंग दिखाओ
      loginBtn.textContent = "Signing in...";
      loginBtn.style.opacity = "0.7";
      loginBtn.style.pointerEvents = "none"; // डबल क्लिक से बचने के लिए

      // गूगल लॉगिन का पॉप-अप खोलो
      const result = await signInWithPopup(auth, provider);
      console.log("Login Success:", result.user.email);

      // लॉगिन सक्सेसफुल होते ही सीधा Profile पेज पर भेज दो
      window.location.href = "profile.html";

    } catch (error) {
      console.error("Login Error:", error);
      alert("Google Login Failed: " + error.message);
      
      // अगर एरर आए तो बटन वापस नॉर्मल कर दो
      loginBtn.textContent = "Continue with Google";
      loginBtn.style.opacity = "1";
      loginBtn.style.pointerEvents = "auto";
    }
  });
}

// 5. अगर यूज़र पहले से लॉगिन है (तो बटन को 'Go to Profile' बना दो)
onAuthStateChanged(auth, (user) => {
  if (user && loginBtn) {
    loginBtn.textContent = "Go to Profile";
    loginBtn.onclick = (e) => {
      e.preventDefault(); 
      window.location.href = "profile.html"; // प्रोफाइल पर भेजो
    };
  }
});
