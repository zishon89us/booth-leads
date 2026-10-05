// Everything a non-developer needs to change lives in this file.
window.FORMS_CONFIG = {
  // Paste the Apps Script web app URL here (see README, step 1).
  endpoint: "https://script.google.com/macros/s/AKfycbxsoYiChcjRKtbbuHtm_sk70QIwsdArlIukdA6p4JsWDb_dWyfuws7cdEFFPD9O3n8_Wg/exec",

  brand: "Zaavya",
  // Saved with every lead, and shown as the heading in booth staff mode.
  event: "DIR Connect 2026",
  thanks: "Thanks! We'll be in touch shortly.",
  consent: "By submitting, you agree to be contacted about your enquiry.",

  // Contact fields shared by both forms.
  contact: [
    { name: "name", label: "Full name", type: "text", required: true, autocomplete: "name" },
    { name: "email", label: "Work email", type: "email", required: true, autocomplete: "email" },
    { name: "phone", label: "Phone", type: "tel", required: false, autocomplete: "tel" },
    { name: "company", label: "Organization", type: "text", required: false, autocomplete: "organization" },
    { name: "title", label: "Job title", type: "text", required: false, autocomplete: "organization-title" },
  ],

  // Question types: "select" (pick one), "multi" (pick any), "text" (free text).
  // PLACEHOLDER QUESTIONS — replace once the real ones arrive.
  forms: {
    general: {
      label: "General",
      title: "Let's stay in touch",
      intro: "Tell us a little about what you're looking for. Takes 30 seconds.",
      questions: [
        {
          name: "interest",
          label: "What are you most interested in?",
          type: "select",
          required: true,
          options: ["Custom software", "AI & automation", "Data & analytics", "Just exploring"],
        },
        {
          name: "timeline",
          label: "When are you looking to get started?",
          type: "select",
          required: false,
          options: ["Within 3 months", "3–6 months", "6+ months", "Not sure yet"],
        },
        { name: "notes", label: "Anything else we should know?", type: "text", required: false },
      ],
    },

    healthcare: {
      label: "Healthcare",
      title: "Healthcare solutions",
      intro: "Tell us about your organization and we'll follow up. Takes 30 seconds.",
      // Shown under the form — this is a lead form, not a place for patient data.
      notice: "Please don't include any patient information.",
      questions: [
        {
          name: "org_type",
          label: "What type of organization are you with?",
          type: "select",
          required: true,
          options: ["Hospital / health system", "Clinic / practice", "Payer", "Health tech / vendor", "Other"],
        },
        {
          name: "interest",
          label: "Which areas are you interested in?",
          type: "multi",
          required: false,
          options: ["EHR integration", "Revenue cycle & billing", "Patient engagement", "AI & automation", "Compliance"],
        },
        { name: "notes", label: "Anything else we should know?", type: "text", required: false },
      ],
    },
  },
};
