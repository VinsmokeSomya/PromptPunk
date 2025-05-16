import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Types from actions.ts (can be moved to a dedicated types file later if needed)
export type Message = {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  tokens?: number;
};

export type SaveConversationOptions = {
  modelName: string;
  promptTemplate?: {
    name: string;
    content: string;
  } | null;
  userInput: string;
  cost: string;
};

// Refactored saveConversation function (no longer async as it doesn't need to be)
export function saveConversationLogic( // Renamed to avoid conflict if old import is cached by dev server temporarily
  messages: Message[], 
  fileName: string, 
  options: SaveConversationOptions
): { success: boolean; error?: string; fileName?: string; content?: string } {
  if (messages.length === 0) {
    return { success: false, error: "No messages to save" };
  }

  // Format the metadata section
  const metadataSection = `--- Metadata ---\nModel Name: ${options.modelName}\n${
  options.promptTemplate
    ? `Prompt Template:  \n${options.promptTemplate.name}\n${options.promptTemplate.content}`
    : "Prompt Template: None"
}\n\nUser Input: ${options.userInput}  \nCost: ${options.cost}  \n\n`;

  // Format the conversation section
  const conversationSection = `--- Conversation ---\n${messages
  .map((msg) => {
    const time = new Date(msg.timestamp).toLocaleString();
    return `[${time}] ${msg.role.toUpperCase()}:\n${msg.content}\n`;
  })
  .join("\n---\n\n")}`;

  // Combine metadata and conversation
  const fullContent = metadataSection + conversationSection;

  return {
    success: true,
    fileName: `${fileName}.txt`,
    content: fullContent,
  };
}
