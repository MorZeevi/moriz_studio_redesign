/** All public chat entry points open the single dialog owned by FloatingActions. */
export const AI_CHAT_DIALOG_ID = "moriz-ai-dialog";
export const AI_CHAT_OPEN_EVENT = "moriz:open-ai-chat";

export type AiChatOpenEvent = CustomEvent<{ trigger: HTMLElement }>;

export function openAiChat(trigger: HTMLElement) {
  window.dispatchEvent(
    new CustomEvent(AI_CHAT_OPEN_EVENT, { detail: { trigger } }),
  );
}
