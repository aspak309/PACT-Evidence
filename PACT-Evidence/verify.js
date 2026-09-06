// PACT Evidence
// Verify PACT Record
// V1: Owner-authenticated verification

import {
  doc,
  getDoc,
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

const pactIdInput =
  document.getElementById("pactIdInput");

const verifyBtn =
  document.getElementById("verifyBtn");

const verifyStatus =
  document.getElementById("verifyStatus");

const verificationResult =
  document.getElementById("verificationResult");

const notFound =
  document.getElementById("notFound");

const resultPactId =
  document.getElementById("resultPactId");

const resultStatus =
  document.getElementById("resultStatus");

const resultCreatedAt =
  document.getElementById("resultCreatedAt");

const resultEventDate =
  document.getElementById("resultEventDate");

const resultEvidenceCount =
  document.getElementById("resultEvidenceCount");

const resultHash =
  document.getElementById("resultHash");

const viewReceiptBtn =
  document.getElementById("viewReceiptBtn");

const copyVerificationBtn =
  document.getElementById("copyVerificationBtn");


// --------------------------------------------------
// Helpers
// --------------------------------------------------

function showStatus(message, type = "info") {

  if (!verifyStatus) return;

  verifyStatus.hidden = false;

  verifyStatus.textContent = message;

  verifyStatus.className = "notice";

  if (type === "error") {
    verifyStatus.classList.add("error");
  }

  if (type === "success") {
    verifyStatus.classList.add("success");
  }

  if (type === "warn") {
    verifyStatus.classList.add("warn");
  }
}


function hideResults() {

  if (verificationResult) {
    verificationResult.hidden = true;
  }

  if (notFound) {
    notFound.hidden = true;
  }
}


function normalizePACTId(value) {

  return value
    .trim()
    .toUpperCase();
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
            timeStyle: "medium"
          }
        );
    }

    return new Date(timestamp)
      .toLocaleString(
        "en-IN",
        {
          dateStyle: "medium",
          timeStyle: "medium"
        }
      );

  } catch {

    return "Not available";
  }
}


// --------------------------------------------------
// Evidence Fingerprint
// --------------------------------------------------

async function calculateRecordFingerprint(
  evidence = []
) {

  if (!Array.isArray(evidence) ||
      evidence.length === 0) {

    return "No evidence fingerprint available";
  }


  const hashes = evidence
    .map(item => item.sha256)
    .filter(Boolean)
    .sort();


  if (hashes.length === 0) {
    return "No SHA-256 fingerprints available";
  }


  const encoder =
    new TextEncoder();

  const data =
    encoder.encode(
      hashes.join("")
    );


  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );


  return Array
    .from(new Uint8Array(digest))
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}


// --------------------------------------------------
// Display Record
// --------------------------------------------------

async function displayRecord(
  record
) {

  const evidence =
    Array.isArray(record.evidence)
      ? record.evidence
      : [];


  const fingerprint =
    await calculateRecordFingerprint(
      evidence
    );


  resultPactId.textContent =
    record.pactId || "—";


  resultStatus.textContent =
    record.status || "RECORDED";


  resultCreatedAt.textContent =
    formatTimestamp(record.createdAt);


  resultEventDate.textContent =
    record.event?.reportedDate || "Not provided";


  resultEvidenceCount.textContent =
    String(evidence.length);


  resultHash.textContent =
    fingerprint;


  viewReceiptBtn.href =
    `receipt.html?id=${encodeURIComponent(
      record.pactId
    )}`;


  verificationResult.hidden = false;

  notFound.hidden = true;
}


// --------------------------------------------------
// Verify Record
// --------------------------------------------------

async function verifyRecord() {

  hideResults();


  const pactId =
    normalizePACTId(
      pactIdInput.value
    );


  if (!pactId) {

    showStatus(
      "Please enter a PACT ID.",
      "error"
    );

    pactIdInput.focus();

    return;
  }


  if (
    !pactId.startsWith("PACT-")
  ) {

    showStatus(
      "Invalid PACT ID format.",
      "error"
    );

    pactIdInput.focus();

    return;
  }


  const user =
    auth.currentUser;


  // ------------------------------------------------
  // V1 Privacy Boundary
  // ------------------------------------------------
  //
  // PACT records are private in V1.
  // Only the authenticated owner can read
  // the underlying Firestore record.
  //
  // A future public verification layer can
  // expose safe metadata separately without
  // exposing private record information.
  // ------------------------------------------------

  if (!user) {

    showStatus(
      "Please sign in with Google to verify a PACT record.",
      "warn"
    );

    return;
  }


  verifyBtn.disabled = true;

  verifyBtn.textContent =
    "Verifying...";


  try {

    const recordRef =
      doc(
        db,
        "pactRecords",
        pactId
      );


    const snapshot =
      await getDoc(recordRef);


    if (!snapshot.exists()) {

      notFound.hidden = false;

      verificationResult.hidden = true;

      showStatus(
        "No accessible PACT record was found for this ID.",
        "error"
      );

      return;
    }


    const record =
      snapshot.data();


    // Extra privacy check.
    // Firestore rules also enforce this.

    if (
      record.ownerUid !== user.uid
    ) {

      notFound.hidden = false;

      verificationResult.hidden = true;

      showStatus(
        "This PACT record is not accessible from your account.",
        "error"
      );

      return;
    }


    await displayRecord(record);


    showStatus(
      "PACT record found and loaded.",
      "success"
    );


  } catch (error) {

    console.error(
      "PACT verification error:",
      error
    );


    if (
      error.code ===
      "permission-denied"
    ) {

      showStatus(
        "You do not have permission to access this record.",
        "error"
      );

    } else {

      showStatus(
        "Unable to verify this PACT record.\n\n" +
        (error.message || "Unknown error."),
        "error"
      );
    }

  } finally {

    verifyBtn.disabled = false;

    verifyBtn.textContent =
      "Verify Record";
  }
}


// --------------------------------------------------
// Button
// --------------------------------------------------

if (verifyBtn) {

  verifyBtn.addEventListener(
    "click",
    verifyRecord
  );
}


// --------------------------------------------------
// Enter Key
// --------------------------------------------------

if (pactIdInput) {

  pactIdInput.addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {

        event.preventDefault();

        verifyRecord();
      }

    }
  );
}


// --------------------------------------------------
// Copy Verification Link
// --------------------------------------------------

if (copyVerificationBtn) {

  copyVerificationBtn.addEventListener(
    "click",
    async () => {

      const pactId =
        normalizePACTId(
          pactIdInput.value
        );


      if (!pactId) {

        showStatus(
          "Enter a PACT ID first.",
          "error"
        );

        return;
      }


      const verificationUrl =
        `${window.location.origin}` +
        `${window.location.pathname}` +
        `?id=${encodeURIComponent(pactId)}`;


      try {

        await navigator.clipboard.writeText(
          verificationUrl
        );


        copyVerificationBtn.textContent =
          "Link Copied";


        setTimeout(() => {

          copyVerificationBtn.textContent =
            "Copy Verification Link";

        }, 1800);


      } catch (error) {

        console.error(
          "Clipboard error:",
          error
        );

        showStatus(
          "Could not copy the verification link.",
          "error"
        );
      }
    }
  );
}


// --------------------------------------------------
// Automatic ID From URL
// --------------------------------------------------

const urlParams =
  new URLSearchParams(
    window.location.search
  );


const urlPACTId =
  urlParams.get("id");


if (urlPACTId) {

  pactIdInput.value =
    normalizePACTId(urlPACTId);

}


// --------------------------------------------------
// Authentication State
// --------------------------------------------------

auth.onAuthStateChanged?.(
  user => {

    if (!user) {

      showStatus(
        "Sign in with Google to access your PACT records.",
        "warn"
      );

    }

  }
);
