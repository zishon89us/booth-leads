// Everything a non-developer needs to change lives in this file.

// Asked on both forms.
var TIMELINE = {
  name: "timeline",
  label: "Do you have budget and a timeline for this, and when do you expect to move forward?",
  type: "choice",
  options: [
    "Funded, and moving within 0–3 months",
    "Funded, and moving within 3–6 months",
    "Budget request planned for the next fiscal cycle",
    "Still building the business case",
  ],
};
var TELL_US_MORE = [
  { type: "section", label: "Tell us more", hint: "For all visitors" },
  { name: "first_process", label: "Which single process would you modernize first if you could?", type: "text" },
  { name: "systems", label: "Which systems would it need to work with?", type: "text" },
  { name: "decision_criteria", label: "What has to be true for you to say yes?", type: "text" },
  { name: "referrals", label: "Who else on your team should hear from us?", type: "text" },
];

window.FORMS_CONFIG = {
  // Paste the Apps Script web app URL here (see README, step 1).
  endpoint: "https://script.google.com/macros/s/AKfycbxsoYiChcjRKtbbuHtm_sk70QIwsdArlIukdA6p4JsWDb_dWyfuws7cdEFFPD9O3n8_Wg/exec",

  brand: "Zaavya",
  // Saved with every lead, and shown as the heading in booth staff mode.
  event: "DIR Connect 2026",
  thanks: "Thank you! We’ll follow up with ideas that fit.",
  // Small line under every form.
  footer: "Zaavya · DIR DBITS Contract DIR-CPO-6227",
  consent: "By submitting, you agree to be contacted about your enquiry.",

  // Booth app: tick documents on a lead and Save opens a ready-to-send email in the phone's mail app.
  // Placeholders: {first_name} {name} {company} {event} {sender} {documents}
  email: {
    subject: "Zaavya: the information you asked for at {event}",
    body: [
      "Hi {first_name},",
      "",
      "It was great meeting you at {event}. As promised, here is the information we talked about:",
      "",
      "{documents}",
      "",
      "I'm happy to answer any questions or set up a call.",
      "",
      "Best regards,",
      "{sender}",
      "Zaavya | www.zaavya.com",
    ].join("\n"),
    // Put each PDF in the docs/ folder and list it here. Empty list = the option is hidden.
    documents: [
      // { name: "Zaavya overview", url: "docs/zaavya-overview.pdf" },
    ],
  },

  // Contact fields shared by both forms.
  contact: [
    { name: "name", label: "Full name", type: "text", required: true, autocomplete: "name" },
    { name: "email", label: "Work email", type: "email", required: true, autocomplete: "email" },
    { name: "phone", label: "Phone", type: "tel", required: false, autocomplete: "tel" },
    { name: "company", label: "Organization", type: "text", required: false, autocomplete: "organization" },
    { name: "title", label: "Job title", type: "text", required: false, autocomplete: "organization-title" },
  ],

  // Question types: "choice" (pick one), "multi" (pick any), "select" (dropdown), "text" (free text),
  // and "section" (a heading between groups of questions).
  // Source: DIR-Connect-2026-Survey.docx. "name" becomes the column heading in the sheet.
  forms: {
    general: {
      label: "Public sector",
      title: "Technology Priorities Survey",
      intro: "Two minutes. Tell us where your organization is headed, and we’ll follow up with ideas that fit.",
      questions: [
        { type: "section", label: "Public sector", hint: "For all state and local government visitors" },
        {
          name: "priority",
          label: "What is your top technology priority for the next 12 months?",
          type: "choice",
          options: [
            "Putting AI to work safely, with governance, approvals and audit trails",
            "Modernizing or replacing aging platforms and applications",
            "Getting data governed, integrated and ready for analytics and AI",
            "Consolidating systems and moving workloads to the cloud",
          ],
        },
        {
          name: "barrier",
          label: "What is the biggest barrier holding that priority back?",
          type: "choice",
          options: [
            "Budget pressure: doing more with less, or federal funding uncertainty",
            "Manual, paper-based workflows across departments",
            "Data that is poor quality, duplicated or locked in silos",
            "No clear governance or policy framework for adopting AI",
          ],
        },
        TIMELINE,
      ].concat(TELL_US_MORE),
    },

    healthcare: {
      label: "Healthcare",
      title: "Technology Priorities Survey",
      intro: "Two minutes. Tell us where your organization is headed, and we’ll follow up with ideas that fit.",
      // Shown under the form — this is a lead form, not a place for patient data.
      notice: "Please don't include any patient information.",
      questions: [
        {
          type: "section",
          label: "Healthcare",
          hint: "For hospitals, public health, health & human services, Medicaid programs and clinics",
        },
        {
          name: "priority",
          label: "What is your organization’s top technology priority for the next 12 months?",
          type: "choice",
          options: [
            "Adopting AI responsibly, with governance, clinical and operational use cases, and staff readiness",
            "Modernizing aging clinical, administrative or financial systems",
            "Improving data sharing and analytics across the organization and with partners",
            "Moving to the cloud and consolidating systems to lower costs",
          ],
        },
        {
          name: "challenge",
          label: "What is the biggest challenge your organization faces today?",
          type: "choice",
          options: [
            "Rising costs, staffing shortages and funding pressure",
            "Manual, paper-based or fragmented workflows that slow down staff",
            "Data spread across systems that don’t share information in real time",
            "Keeping up with changing regulations, reporting and audit requirements",
          ],
        },
        TIMELINE,
      ].concat(TELL_US_MORE),
    },
  },
};
