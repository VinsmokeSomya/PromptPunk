"use server"

type Message = {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  tokens?: number
}

type SaveConversationOptions = {
  modelName: string
  promptTemplate?: {
    name: string
    content: string
  } | null
  userInput: string
  cost: string
}

export async function saveConversation(messages: Message[], fileName: string, options: SaveConversationOptions) {
  if (messages.length === 0) {
    return { success: false, error: "No messages to save" }
  }

  // Format the metadata section
  const metadataSection = `--- Metadata ---
Model Name: ${options.modelName}
${
  options.promptTemplate
    ? `Prompt Template:  
${options.promptTemplate.name}
${options.promptTemplate.content}`
    : "Prompt Template: None"
}

User Input: ${options.userInput}  
Cost: ${options.cost}  

`

  // Format the conversation section
  const conversationSection = `--- Conversation ---
${messages
  .map((msg) => {
    const time = new Date(msg.timestamp).toLocaleString()
    return `[${time}] ${msg.role.toUpperCase()}:
${msg.content}
`
  })
  .join("\n---\n\n")}`

  // Combine metadata and conversation
  const fullContent = metadataSection + conversationSection

  return {
    success: true,
    fileName: `${fileName}.txt`,
    content: fullContent,
  }
}

