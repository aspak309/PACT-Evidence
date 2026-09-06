// PACT Evidence
// Evidence Receipt
// Firebase Authentication + Firestore + PDF Export

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

const receiptLoading =
  document.getElementById("receiptLoading");

const receiptSection =
  document.getElementById("receiptSection");

const receiptErrorSection =
  document.getElementById("receiptErrorSection");

const receiptError =
  document.getElementById("receiptError");

const receiptDocument =
  document.getElementById("receiptDocument");

const receiptStatus =
  document.getElementById("receiptStatus");

const receiptPactId =
  document.getElementById("receiptPactId");

const receiptCreatedAt =
  document.getElementById("receiptCreatedAt");

const receiptSubmittedName =
  document.getElementById("receiptSubmittedName");

const receiptSubmittedEmail =
  document.getElementById("receiptSubmittedEmail");

const receiptDescription =
  document.getElementById("receiptDescription");

const receiptEventDate =
  document.getElementById("receiptEventDate");

const receiptEventTime =
  document.getElementById("receiptEventTime");

const receiptInstructor =
  document.getElementById("receiptInstructor");

const receiptAgent =
  document.getElementById("receiptAgent");

const receiptOrganization =
  document.getElementById("receiptOrganization");

const receiptPurpose =
  document.getElementById("receiptPurpose");

const receiptAuthority =
  document.getElementById("receiptAuthority");

const receiptOutcome =
  document.getElementById("receiptOutcome");

const receiptEvidence =
  document.getElementById("receiptEvidence");

const receiptHash =
  document.getElementById("receiptHash");

const receiptDeclaration =
  document.getElementById("receiptDeclaration");

const downloadPdfBtn =
  document.getElementById("downloadPdfBtn");

const copyReceiptLinkBtn =
  document.getElementById("copyReceiptLinkBtn");

const backToRecordBtn =
  document.getElementById("backToRecordBtn");


// --------------------------------------------------
// URL
// --------------------------------------------------

const params =
  new URLSearchParams(
    window.location.search
  );

const pactId =
  (params.get("id") || "")
    .trim()
    .toUpperCase();


// --------------------------------------------------
// Helpers
// --------------------------------------------------

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function setText(element, value) {

  if (!element) return;

  element.textContent =
    value || "Not provided";
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


function showError(message) {

  receiptLoading.hidden = true;
  receiptSection.hidden = true;

  receiptErrorSection.hidden = false;

  receiptError.textContent =
    message;
}


// --------------------------------------------------
// Evidence Fingerprint
// --------------------------------------------------

async function calculateRecordFingerprint(
  evidence = []
) {

  if (
    !Array.isArray(evidence) ||
    evidence.length === 0
  ) {

    return "No evidence fingerprint available";
  }


  const hashes =
    evidence
      .map(item => item?.sha256)
      .filter(Boolean)
      .sort();


  if (hashes.length === 0) {

    return "No SHA-256 fingerprints available";
  }


  const data =
    new TextEncoder().encode(
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
// Render Evidence
// --------------------------------------------------

function renderEvidence(evidence) {

  if (!receiptEvidence) return;

  receiptEvidence.innerHTML = "";


  if (
    !Array.isArray(evidence) ||
    evidence.length === 0
  ) {

    receiptEvidence.textContent =
      "No evidence attached.";

    return;
  }


  const list =
    document.createElement("div");

  list.style.display = "grid";
  list.style.gap = "12px";


  evidence.forEach(
    (item, index) => {

      const row =
        document.createElement("div");

      row.style.padding = "14px";
      row.style.border = "1px solid #e5e7eb";
      row.style.borderRadius = "10px";
      row.style.background = "#f9fafb";


      const name =
        escapeHTML(
          item?.fileName ||
          `Evidence ${index + 1}`
        );

      const type =
        escapeHTML(
          item?.fileType ||
          "Unknown type"
        );

      const size =
        Number(item?.fileSize || 0);

      const sha256 =
        escapeHTML(
          item?.sha256 ||
          "Not available"
        );


      row.innerHTML = `

        <div
          style="
            font-weight:800;
            color:#111827;
            word-break:break-word;
          "
        >
          ${name}
        </div>

        <div
          style="
            margin-top:6px;
            font-size:12px;
            color:#6b7280;
          "
        >
          Type: ${type}
          ·
          Size: ${formatFileSize(size)}
        </div>

        <div
          style="
            margin-top:8px;
            font-family:monospace;
            font-size:11px;
            line-height:1.5;
            word-break:break-all;
            color:#374151;
          "
        >
          SHA-256:
          ${sha256}
        </div>

      `;


      list.appendChild(row);
    }
  );


  receiptEvidence.appendChild(list);
}


function formatFileSize(bytes) {

  if (!bytes) {
    return "0 B";
  }

  const units =
    ["B", "KB", "MB", "GB"];

  const index =
    Math.min(
      Math.floor(
        Math.log(bytes) / Math.log(1024)
      ),
      units.length - 1
    );

  const value =
    bytes /
    Math.pow(1024, index);

  return `${value.toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;
}


// --------------------------------------------------
// Render Receipt
// --------------------------------------------------

async function renderReceipt(record) {

  setText(
    receiptStatus,
    record.status || "RECORDED"
  );

  setText(
    receiptPactId,
    record.pactId
  );

  setText(
    receiptCreatedAt,
    formatTimestamp(record.createdAt)
  );


  setText(
    receiptSubmittedName,
    record.submittedBy?.name
  );

  setText(
    receiptSubmittedEmail,
    record.submittedBy?.email
  );


  setText(
    receiptDescription,
    record.event?.description
  );

  setText(
    receiptEventDate,
    record.event?.reportedDate
  );

  setText(
    receiptEventTime,
    record.event?.reportedTime
  );


  setText(
    receiptInstructor,
    record.instruction?.instructor
  );

  setText(
    receiptAgent,
    record.instruction?.agent
  );

  setText(
    receiptOrganization,
    record.instruction?.organization
  );


  setText(
    receiptPurpose,
    record.purpose
  );

  setText(
    receiptAuthority,
    record.authority
  );

  setText(
    receiptOutcome,
    record.outcome
  );


  const evidence =
    Array.isArray(record.evidence)
      ? record.evidence
      : [];


  renderEvidence(evidence);


  const fingerprint =
    await calculateRecordFingerprint(
      evidence
    );


  setText(
    receiptHash,
    fingerprint
  );


  setText(
    receiptDeclaration,
    record.declarationAccepted
      ? "The user accepted the PACT user declaration when creating this record."
      : "User declaration was not recorded."
  );


  const recordId =
    encodeURIComponent(
      record.pactId
    );


  backToRecordBtn.href =
    `verify.html?id=${recordId}`;


  receiptLoading.hidden = true;
  receiptErrorSection.hidden = true;
  receiptSection.hidden = false;
}


// --------------------------------------------------
// Load Record
// --------------------------------------------------

async function loadReceipt(user) {

  if (!pactId) {

    showError(
      "No PACT ID was provided."
    );

    return;
  }


  if (!pactId.startsWith("PACT-")) {

    showError(
      "Invalid PACT ID."
    );

    return;
  }


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

      showError(
        "PACT record not found."
      );

      return;
    }


    const record =
      snapshot.data();


    // Extra privacy check.
    // Firestore Security Rules enforce this too.

    if (
      record.ownerUid !== user.uid
    ) {

      showError(
        "You do not have permission to view this PACT receipt."
      );

      return;
    }


    await renderReceipt(record);


  } catch (error) {

    console.error(
      "Receipt loading error:",
      error
    );


    if (
      error.code ===
      "permission-denied"
    ) {

      showError(
        "You do not have permission to access this record."
      );

    } else {

      showError(
        "Unable to load the PACT receipt.\n\n" +
        (error.message || "Unknown error.")
      );
    }
  }
}


// --------------------------------------------------
// Authentication
// --------------------------------------------------

auth.onAuthStateChanged(
  user => {

    if (!user) {

      showError(
        "Please sign in with Google to view this private PACT receipt."
      );

      return;
    }


    loadReceipt(user);
  }
);


// --------------------------------------------------
// Download PDF
// --------------------------------------------------

if (downloadPdfBtn) {

  downloadPdfBtn.addEventListener(
    "click",
    async () => {

      if (
        typeof window.html2pdf !==
        "function"
      ) {

        alert(
          "PDF generator is not available. Please check your internet connection and try again."
        );

        return;
      }


      downloadPdfBtn.disabled = true;

      downloadPdfBtn.textContent =
        "Generating PDF...";


      try {

        const filename =
          `${pactId || "PACT-Record"}-Receipt.pdf`;


        const options = {

          margin: 0.35,

          filename,

          image: {
            type: "jpeg",
            quality: 0.98
          },

          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false
          },

          jsPDF: {
            unit: "in",
            format: "a4",
            orientation: "portrait"
          },

          pagebreak: {
            mode: [
              "css",
              "legacy"
            ]
          }

        };


        await window.html2pdf()
          .set(options)
          .from(receiptDocument)
          .save();


      } catch (error) {

        console.error(
          "PDF generation error:",
          error
        );

        alert(
          "Unable to generate the PDF receipt.\n\n" +
          (error.message || "Unknown error.")
        );

      } finally {

        downloadPdfBtn.disabled = false;

        downloadPdfBtn.textContent =
          "Download PDF Receipt";
      }

    }
  );
}


// --------------------------------------------------
// Copy Verification Link
// --------------------------------------------------

if (copyReceiptLinkBtn) {

  copyReceiptLinkBtn.addEventListener(
    "click",
    async () => {

      if (!pactId) {

        return;
      }


      const verificationUrl =
        `${window.location.origin}` +
        `/verify.html?id=${encodeURIComponent(pactId)}`;


      try {

        await navigator.clipboard.writeText(
          verificationUrl
        );


        copyReceiptLinkBtn.textContent =
          "Link Copied";


        setTimeout(
          () => {

            copyReceiptLinkBtn.textContent =
              "Copy Verification Link";

          },
          1800
        );


      } catch (error) {

        console.error(
          "Clipboard error:",
          error
        );

        alert(
          "Could not copy the verification link."
        );
      }
    }
  );
            }
