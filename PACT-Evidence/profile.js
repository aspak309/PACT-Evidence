// PACT Evidence
// Private Profile Dashboard
// Firebase Authentication + Firestore

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
  auth
} from "./app.js";


// --------------------------------------------------
// Firebase
// --------------------------------------------------

const db = getFirestore();


// --------------------------------------------------
// DOM
// --------------------------------------------------

const userName =
  document.getElementById("userName");

const userEmail =
  document.getElementById("userEmail");

const logoutBtn =
  document.getElementById("logoutBtn");

const recordsLoading =
  document.getElementById("recordsLoading");

const recordsEmpty =
  document.getElementById("recordsEmpty");

const recordsError =
  document.getElementById("recordsError");

const recordsList =
  document.getElementById("recordsList");


// --------------------------------------------------
// Helpers
// --------------------------------------------------

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatTimestamp(timestamp) {

  if (!timestamp) {
    return "Not available";
  }

  try {

    if (
      typeof timestamp.toDate === "function"
    ) {

      return timestamp
        .toDate()
        .toLocaleString(
          "en-IN",
          {
            dateStyle: "medium",
            timeStyle: "short"
          }
        );
    }

    return new Date(timestamp)
      .toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "short"
        }
      );

  } catch {

    return "Not available";
  }
}


function showError(message) {

  recordsError.hidden = false;
  recordsError.textContent = message;
}


// --------------------------------------------------
// Record Card
// --------------------------------------------------

function createRecordCard(record) {

  const pactId =
    escapeHTML(record.pactId || "Unknown");

  const description =
    escapeHTML(
      record.event?.description ||
      "No description provided."
    );

  const eventDate =
    escapeHTML(
      record.event?.reportedDate ||
      "Not provided"
    );

  const status =
    escapeHTML(
      record.status ||
      "RECORDED"
    );

  const createdAt =
    formatTimestamp(
      record.createdAt
    );

  const evidenceCount =
    Array.isArray(record.evidence)
      ? record.evidence.length
      : 0;


  const card =
    document.createElement("article");

  card.className = "card";


  card.innerHTML = `

    <div
      style="
        display:flex;
        justify-content:space-between;
        gap:16px;
        align-items:flex-start;
        flex-wrap:wrap;
      "
    >

      <div>

        <span class="badge">
          ${status}
        </span>

        <h3 style="margin-top:14px;">
          ${pactId}
        </h3>

      </div>

      <div
        style="
          font-size:13px;
          color:var(--muted);
        "
      >
        ${evidenceCount} evidence item${evidenceCount === 1 ? "" : "s"}
      </div>

    </div>


    <p
      style="
        margin-top:16px;
        white-space:pre-wrap;
      "
    >
      ${description}
    </p>


    <div
      class="grid grid-2"
      style="margin-top:20px;"
    >

      <div>

        <span class="form-label">
          PACT Created At
        </span>

        <div class="result-value">
          ${escapeHTML(createdAt)}
        </div>

      </div>


      <div>

        <span class="form-label">
          Reported Event Date
        </span>

        <div class="result-value">
          ${eventDate || "Not provided"}
        </div>

      </div>

    </div>


    <div
      class="actions"
      style="margin-top:24px;"
    >

      <a
        href="verify.html?id=${encodeURIComponent(record.pactId || "")}"
        class="btn btn-primary"
      >
        View Record
      </a>

      <a
        href="receipt.html?id=${encodeURIComponent(record.pactId || "")}"
        class="btn btn-ghost"
      >
        Receipt
      </a>

    </div>

  `;


  return card;
}


// --------------------------------------------------
// Load Records
// --------------------------------------------------

async function loadRecords(user) {

  recordsLoading.hidden = false;
  recordsEmpty.hidden = true;
  recordsList.hidden = true;
  recordsError.hidden = true;


  try {

    const recordsQuery =
      query(
        collection(db, "pactRecords"),
        where(
          "ownerUid",
          "==",
          user.uid
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(recordsQuery);


    recordsLoading.hidden = true;


    if (snapshot.empty) {

      recordsEmpty.hidden = false;

      return;
    }


    recordsList.innerHTML = "";


    snapshot.forEach(
      documentSnapshot => {

        const record =
          documentSnapshot.data();

        const card =
          createRecordCard(record);

        recordsList.appendChild(card);
      }
    );


    recordsList.hidden = false;


  } catch (error) {

    console.error(
      "Profile records error:",
      error
    );


    recordsLoading.hidden = true;


    if (
      error.code ===
      "failed-precondition"
    ) {

      showError(
        "Firestore needs an index for this query. " +
        "Open the Firebase console and create the index " +
        "suggested by the Firebase error."
      );

    } else if (
      error.code ===
      "permission-denied"
    ) {

      showError(
        "You do not have permission to access these records."
      );

    } else {

      showError(
        "Unable to load your PACT records.\n\n" +
        (error.message || "Unknown error.")
      );
    }
  }
}


// --------------------------------------------------
// Authentication
// --------------------------------------------------

auth.onAuthStateChanged(
  async user => {

    if (!user) {

      userName.textContent =
        "Not signed in";

      userEmail.textContent =
        "Please sign in with Google.";

      recordsLoading.hidden = true;
      recordsEmpty.hidden = true;
      recordsList.hidden = true;

      showError(
        "Please sign in with Google to access your private PACT records."
      );

      return;
    }


    userName.textContent =
      user.displayName ||
      "PACT User";


    userEmail.textContent =
      user.email ||
      "Email unavailable";


    await loadRecords(user);
  }
);


// --------------------------------------------------
// Sign Out
// --------------------------------------------------

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      logoutBtn.disabled = true;

      logoutBtn.textContent =
        "Signing out...";


      try {

        await window.pactLogout();

        window.location.href =
          "index.html";

      } catch (error) {

        console.error(
          "Sign out error:",
          error
        );

        logoutBtn.disabled = false;

        logoutBtn.textContent =
          "Sign Out";
      }

    }
  );
}
