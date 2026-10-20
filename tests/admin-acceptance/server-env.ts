// D4: a verification server that can receive a contact submission must never
// send mail or spend AI tokens. notifyNewLead() checks only LEAD_NOTIFY_ENABLED
// (it does not skip test leads), so these are forced on the dev server the suite
// starts; setup asserts the same values in the test process before any write.
export const FORCED_SERVER_ENV: Record<string, string> = {
  LEAD_NOTIFY_ENABLED: "false",
  RESEND_API_KEY: "",
  AI_PERSONALIZATION_ENABLED: "false",
  LEAD_BRIEF_AI_ENABLED: "false",
  MOONSHOT_API_KEY: "",
};
