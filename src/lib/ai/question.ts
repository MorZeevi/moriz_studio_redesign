// Shared by the chat and the API route.
export const MAX_QUESTION_LENGTH = 500;
export const MAX_ANSWER_LENGTH = 1500;
// Earlier turns sent with each question: three question-and-answer pairs.
export const MAX_HISTORY_TURNS = 6;

export type ChatTurn = { role: "user" | "assistant"; content: string };
