// PACT Evidence
// Create PACT Record
// Firebase Authentication + Firestore + SHA-256 Evidence Fingerprints

import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
  auth
} from "./app.js";


// --------------------------------------------------
// Firebase Firestore
// --------------------------------------------------

const db = getFirestore();


// --------------------------------------------------
// DOM Elements
// --------------------------------------------------

const form = document.getElementById("createRecordForm");
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");

const eventDescription =
  document.getElementById("eventDescription");

const instructor =
  document.getElementById("instructor");

const agent =
  document.getElementById("agent");

const organization =
  document.getElementById("organization");

const eventDate =
  document.getElementById("eventDate");

const eventTime =
  document.getElementById("eventTime");

const purpose =
  document.getElementById("purpose");

const authority =
  document.getElementById("authority");

const outcome =
  document.getElementById("outcome");

const evidenceFiles =
  document.getElementById("evidenceFiles");

const userDeclaration =
  document.getElementById("userDeclaration");


// --------------------------------------------------
// Helpers
// --------------------------------------------------

function showStatus(message, type = "info") {

  if (!formStatus) return;

  formStatus.hidden = false;

  formStatus.textContent = message;

  formStatus.className = "notice";

  if (type === "error") {
    formStatus.classList.add("error");
  }

  if (type === "success") {
    formStatus.classList.add("success");
  }

  if (type === "warn") {
    formStatus.classList.add("warn");
  }
}


function hideStatus() {

  if (!formStatus) return;

  formStatus.hidden = true;

  formStatus.textContent = "";
}


// --------------------------------------------------
// Generate PACT ID
// --------------------------------------------------

function generatePACTId() {

  const randomId =
    crypto.randomUUID()
      .replaceAll("-", "")
      .toUpperCase();

  return `PACT-${randomId}`;
}


// --------------------------------------------------
// SHA-256 Hash
// --------------------------------------------------

async function calculateSHA256(file) {

  const buffer = await file.arrayBuffer();

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      buffer
    );

  const hashArray =
    Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map(byte =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}


// --------------------------------------------------
// Evidence Processing
// --------------------------------------------------

async function processEvidence(files) {

  const evidence = [];

  if (!files || files.length === 0) {
    return evidence;
  }

  for (const file of files) {

    try {

      const sha256 =
        await calculateSHA256(file);

      evidence.push({

        fileName: file.name,

        fileType:
          file.type || "application/octet-stream",

        fileSize:
          file.size,

        sha256,

        lastModified:
          file.lastModified

      });

    } catch (error) {

      console.error(
        "Evidence hashing error:",
        error
      );

      throw new Error(
        `Could not fingerprint evidence file: ${file.name}`
      );
    }
  }

  return evidence;
}


// --------------------------------------------------
// Input Validation
// --------------------------------------------------

function validateForm() {

  const description =
    eventDescription.value.trim();

  if (!description) {

    showStatus(
      "Please describe what happened.",
      "error"
    );

    eventDescription.focus();

    return false;
  }


  if (!userDeclaration.checked) {

    showStatus(
      "You must accept the user declaration before creating a PACT record.",
      "error"
    );

    userDeclaration.focus();

    return false;
  }


  return true;
}


// --------------------------------------------------
// Create Firestore Record
// --------------------------------------------------

async function createPACTRecord(user) {

  const pactId =
    generatePACTId();


  // Process evidence before creating record.
  // Only metadata + SHA-256 fingerprints are stored.

  const evidence =
    await processEvidence(
      evidenceFiles.files
    );


  const record = {

    // Identity
    pactId,

    ownerUid:
      user.uid,

    submittedBy: {

      uid:
        user.uid,

      name:
        user.displayName || "",

      email:
        user.email || ""

    },


    // Event information
    event: {

      description:
        eventDescription.value.trim(),

      reportedDate:
        eventDate.value || "",

      reportedTime:
        eventTime.value || ""

    },


    // Instruction information
    instruction: {

      instructor:
        instructor.value.trim(),

      agent:
        agent.value.trim(),

      organization:
        organization.value.trim()

    },


    // Purpose
    purpose:
      purpose.value.trim(),


    // Authority / limitations
    authority:
      authority.value.trim(),


    // Actual outcome
    outcome:
      outcome.value.trim(),


    // Evidence fingerprints
    evidence,


    // Record status
    status:
      "RECORDED",


    // Declaration
    declarationAccepted:
      true,


    // IMPORTANT:
    // Firestore serverTimestamp is used.
    // The browser cannot choose this value.

    createdAt:
      serverTimestamp()

  };


  // Use PACT ID as Firestore document ID.
  // This makes verification deterministic.

  const recordRef =
    doc(
      collection(db, "pactRecords"),
      pactId
    );


  await setDoc(
    recordRef,
    record
  );


  return pactId;
}


// --------------------------------------------------
// Form Submit
// --------------------------------------------------

if (form) {

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      hideStatus();


      // Authentication check

      const user =
        auth.currentUser;


      if (!user) {

        showStatus(
          "Please sign in with Google before creating a PACT record.",
          "error"
        );

        return;
      }


      // Validation

      if (!validateForm()) {
        return;
      }


      // Disable button

      submitBtn.disabled = true;

      submitBtn.textContent =
        "Creating PACT Record...";


      try {

        showStatus(
          "Processing evidence and creating your record...",
          "info"
        );


        const pactId =
          await createPACTRecord(user);


        showStatus(
          `PACT record created successfully: ${pactId}`,
          "success"
        );


        // Short delay so the success message is visible.

        setTimeout(() => {

          window.location.href =
            `verify.html?id=${encodeURIComponent(pactId)}`;

        }, 900);


      } catch (error) {

        console.error(
          "PACT creation error:",
          error
        );


        let message =
          "Unable to create the PACT record.";


        if (
          error.code ===
          "permission-denied"
        ) {

          message =
            "Permission denied by Firestore security rules.";
        }


        if (
          error.code ===
          "unavailable"
        ) {

          message =
            "Firebase is temporarily unavailable. Please try again.";
        }


        showStatus(
          `${message}\n\n${error.message || ""}`,
          "error"
        );


        submitBtn.disabled = false;

        submitBtn.textContent =
          "Create PACT Record";
      }

    }
  );

}


// --------------------------------------------------
// Authentication State
// --------------------------------------------------

auth.onAuthStateChanged?.(
  (user) => {

    if (!user) {

      showStatus(
        "You are not signed in. Please sign in with Google before creating a record.",
        "warn"
      );

    }

  }
);
