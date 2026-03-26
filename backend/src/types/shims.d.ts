declare module "uuid" {
  export const v4: () => string;
}

declare module "pdf-parse" {
  interface PdfParseResult {
    text: string;
    numpages: number;
  }
  const pdfParse: (buffer: Buffer) => Promise<PdfParseResult>;
  export default pdfParse;
}

declare module "node-telegram-bot-api" {
  // Minimal typing to keep the project strict and compilable.
  // node-telegram-bot-api is used operationally; runtime correctness is handled by integration tests/manual runs.
  type Chat = { id: number };
  type Document = { file_id: string; mime_type?: string; file_name?: string };
  type Message = { chat: Chat; document?: Document; text?: string };
  type CallbackQuery = { id: string; data?: string; message?: Message };

  export default class TelegramBot {
    constructor(token: string, opts?: unknown);
    on(event: string, handler: (...args: any[]) => void): void;
    onText(regexp: RegExp, handler: (msg: Message, match: RegExpExecArray | null) => void): void;
    answerCallbackQuery(callbackQueryId: string, options?: { text?: string }): Promise<void>;
    sendMessage(chatId: number, text: string, extra?: unknown): Promise<void>;
    sendDocument(chatId: number, document: any, extra?: unknown): Promise<void>;
    getFile(fileId: string): Promise<{ file_path: string }>;
    getMe(): Promise<{ username?: string }>;
  }
  export type { Message, CallbackQuery };
}

