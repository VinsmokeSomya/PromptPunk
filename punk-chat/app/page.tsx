"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Download, Trash2, BarChart3, Info, Settings } from "lucide-react"
import { cn, saveConversationLogic, type Message, type SaveConversationOptions } from "@/lib/utils"
import { countTokens } from "@/lib/tokenizer"
import ConfigModal from "@/components/config-modal"
import { useOpenAI } from "@/lib/use-openai"
import PromptManager, { type Prompt } from "@/components/prompt-manager"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ThemeToggle } from "@/components/theme-toggle"

type TokenRates = {
  inputPrice: number
  outputPrice: number
  model: string
}

// Add this loading dots animation component
const LoadingDots = () => (
  <div className="flex space-x-2 p-4 bg-gray-800/50 dark:bg-gray-800/50 rounded-lg w-24">
    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
  </div>
)

export default function Home() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [fileName, setFileName] = useState("conversation")
  const [tokenRates, setTokenRates] = useState<TokenRates>({
    inputPrice: 0.1 / 1_000_000,  // $0.0000001 per token
    outputPrice: 0.4 / 1_000_000, // $0.0000004 per token
    model: "gemini-2.0-flash",
  })
  const [showTokenInfo, setShowTokenInfo] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.")
  const [systemPromptTokens, setSystemPromptTokens] = useState(countTokens("You are a helpful assistant."))
  const [activeTemplate, setActiveTemplate] = useState<Prompt | null>(null)
  // Track the last user input for saving in metadata
  const [lastUserInput, setLastUserInput] = useState("")

  // Get the OpenAI hook values
  const {
    sendMessage,
    isConfigured,
    currentModel,
    setApiKey,
    setModel,
    apiKey,
    baseUrl,
    setBaseUrl,
    currentProvider,
    setProvider,
    fetchAvailableModels,
  } = useOpenAI()

  // Calculate total tokens and costs
  const tokenStats = messages.reduce(
    (stats, message) => {
      const tokens = message.tokens || 0
      if (message.role === "user") {
        stats.inputTokens += tokens
        stats.inputCost += tokens * tokenRates.inputPrice
      } else if (message.role === "assistant") {
        stats.outputTokens += tokens
        stats.outputCost += tokens * tokenRates.outputPrice
      }
      return stats
    },
    { 
      inputTokens: systemPromptTokens, 
      outputTokens: 0,
      inputCost: systemPromptTokens * tokenRates.inputPrice,
      outputCost: 0 
    }
  )

  const totalTokens = tokenStats.inputTokens + tokenStats.outputTokens
  const totalCost = tokenStats.inputCost + tokenStats.outputCost

  // Calculate tokens for current input (for preview)
  const currentInputTokens = input ? countTokens(input) : 0

  // Auto-resize textarea when content changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto"
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [input])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Update model in token rates when it changes
  useEffect(() => {
    if (currentModel) {
      handleModelChange(currentModel)
    }
  }, [currentModel])

  // Load system prompt from localStorage on mount
  useEffect(() => {
    const savedSystemPrompt = localStorage.getItem("llm_system_prompt")
    if (savedSystemPrompt) {
      try {
        const parsedPrompt = JSON.parse(savedSystemPrompt)
        setSystemPrompt(parsedPrompt.content)
        setSystemPromptTokens(parsedPrompt.tokens)
        console.log("Loaded system prompt from storage:", parsedPrompt.content)
      } catch (e) {
        console.error("Failed to parse saved system prompt:", e)
        // Set default if parsing fails
        setSystemPrompt("You are a helpful assistant.")
        setSystemPromptTokens(countTokens("You are a helpful assistant."))
      }
    } else {
      // Set default if no saved prompt
      console.log("No saved system prompt found, using default")
      setSystemPrompt("You are a helpful assistant.")
      setSystemPromptTokens(countTokens("You are a helpful assistant."))
    }
  }, [])

  // Add a debug log when system prompt changes
  useEffect(() => {
    console.log("System prompt changed:", systemPrompt)
  }, [systemPrompt])

  // Handle selecting a prompt
  const handleSelectPrompt = (prompt: Prompt) => {
    console.log("Selecting prompt:", prompt)

    if (prompt.id === "system") {
      // Update system prompt
      setSystemPrompt(prompt.content)
      setSystemPromptTokens(prompt.tokens)
      setActiveTemplate(null)

      // Save to localStorage
      localStorage.setItem("llm_system_prompt", JSON.stringify(prompt))

      console.log("System prompt updated:", prompt.content)
    } else {
      // Set the input to the prompt content
      setInput(prompt.content)
      setActiveTemplate(null)
      console.log("Input prompt set:", prompt.content)

      // Focus and resize the input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.style.height = "auto"
          inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
        }
      }, 0)
    }
  }

  // Handle selecting a template prompt
  const handleSelectTemplate = (template: Prompt, userInput: string) => {
    console.log("Selecting template:", template)

    // Store the template for later use
    setActiveTemplate(template)

    // If there's already input, process it immediately
    if (userInput.trim()) {
      // Replace {query} with user input
      const processedContent = template.content.replace(/{query}/g, userInput)
      setInput(processedContent)
    } else {
      // Just show the template with placeholder
      const processedContent = template.content.replace(/{query}/g, "[Your input will appear here]")
      setInput(processedContent)
    }

    console.log("Template activated:", template.name)

    // Focus and resize the input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.style.height = "auto"
        inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
      }
    }, 0)
  }

  // Process the input with active template if needed
  const processInputWithTemplate = (rawInput: string): string => {
    if (activeTemplate && activeTemplate.isTemplate) {
      // Replace {query} with the user's input
      return activeTemplate.content.replace(/{query}/g, rawInput.trim())
    }
    return rawInput
  }

  // Add debug logging to the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Get the raw user input (what they typed)
    const rawUserInput = input.trim()

    // Store the raw user input for metadata
    setLastUserInput(rawUserInput)

    // Process the input with template if needed
    let processedInput = rawUserInput
    let displayInput = rawUserInput

    if (activeTemplate && activeTemplate.isTemplate) {
      // For display in the UI, show what the user typed
      displayInput = rawUserInput

      // For sending to the API, process with the template
      processedInput = processInputWithTemplate(rawUserInput)
      console.log("Processed template input:", processedInput)
    }

    const userTokens = countTokens(processedInput)

    // Add user message to UI (showing what they typed)
    const userMessage: Message = {
      role: "user",
      content: displayInput,
      timestamp: new Date().toISOString(),
      tokens: countTokens(displayInput),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      if (isConfigured) {
        // Use the actual API with the current system prompt from state
        console.log("Using system prompt:", systemPrompt)

        const systemMessage = {
          role: "system" as const,
          content: systemPrompt,
        }

        // Create message history with system prompt first
        const messageHistory = [
          systemMessage,
          ...messages
            .filter((m) => m.role !== "system")
            .map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          // Use the processed input for the API
          { role: "user" as const, content: processedInput },
        ]

        console.log("Sending messages to API:", messageHistory)
        console.log("Current provider:", currentProvider)
        console.log("Current model:", currentModel)

        const response = await sendMessage(messageHistory)

        if (response) {
          console.log("API response:", response)

          const assistantMessage: Message = {
            role: "assistant",
            content: response.content,
            timestamp: new Date().toISOString(),
            tokens: response.tokens || countTokens(response.content),
          }

          setMessages((prev) => [...prev, assistantMessage])
        } else {
          throw new Error("Failed to get response from API")
        }
      } else {
        // Display an error message when the LLM model is not configured
        const errorMessage: Message = {
          role: "assistant",
          content: "Configuration Required: Please enter your API key in the configuration settings to enable the LLM model.",
          timestamp: new Date().toISOString(),
          tokens: countTokens("Configuration Required: Please enter your API key in the configuration settings to enable the LLM model."),
        }

        setMessages((prev) => [...prev, errorMessage])
      }

      // Reset active template after sending
      setActiveTemplate(null)
    } catch (error) {
      console.error("Error sending message:", error)

      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content: "Configuration Required: Please enter your API key in the configuration settings to enable the LLM model.",
        timestamp: new Date().toISOString(),
        tokens: countTokens("Configuration Required: Please enter your API key in the configuration settings to enable the LLM model."),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveConversation = () => {
    try {
      // Prepare metadata for saving
      const saveOptions: SaveConversationOptions = {
        modelName: currentModel || "Not specified",
        promptTemplate: activeTemplate
          ? {
              name: activeTemplate.name,
              content: activeTemplate.content,
            }
          : null,
        userInput: lastUserInput || "No input",
        cost: formatCost(totalCost),
      }

      // Call the client-side function
      const result = saveConversationLogic(messages, fileName, saveOptions)
      
      if (result.success && result.content && result.fileName) {
        // Ensure result.content is a string
        const content = result.content
        
        // Ensure result.fileName is a string
        const fName = result.fileName
        
        // Create blob and download link from the returned content
        const blob = new Blob([content], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        
        link.href = url
        link.download = fName
        document.body.appendChild(link)
        link.click()
        
        // Cleanup
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        console.log("Conversation saved:", fName)
      } else {
        throw new Error(result.error || "Failed to prepare conversation for saving")
      }
    } catch (error) {
      console.error("Failed to save conversation:", error)
      alert(`Failed to save conversation: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const clearConversation = () => {
    if (window.confirm("Are you sure you want to clear the chat?")) {
      setMessages([])
      setActiveTemplate(null)
      setLastUserInput("")
      // Focus back on the input field after clearing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }
  }

  const handleModelChange = (model: string) => {
    // Set rates based on model selection (example rates)
    switch (model) {
      case "gpt-3.5-turbo":
        setTokenRates({
            inputPrice: 0.0005 / 1000, // $0.5 per 1M tokens -> 0.0000005 per token
            outputPrice: 0.0015 / 1000, // $0.15 per 1M tokens -> 0.0000015 per token
            model: "gpt-3.5-turbo",
        })
        break
        case "gemini-2.0-flash":
          setTokenRates({
              inputPrice: 0.1 / 1_000_000,  // $0.1 per 1M tokens -> 0.0000001 per token
              outputPrice: 0.4 / 1_000_000, // $0.4 per 1M tokens -> 0.0000004 per token
              model: "gemini-2.0-flash",
          })      
        break
      default:
        setTokenRates({
          inputPrice: 0.1 / 1_000_000, // Default to Gemini pricing
          outputPrice: 0.4 / 1_000_000,
          model: "gemini-2.0-flash",
        })
    }

    // Update the model in the OpenAI hook
    setModel(model)
  }

  // When displaying the cost, format it to 6 decimal places
  const formatCost = (cost: number) => `$${cost.toFixed(6)}`

  return (
    <main className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Config Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        model={currentModel}
        setModel={setModel}
        baseUrl={baseUrl}
        setBaseUrl={setBaseUrl}
        provider={currentProvider || "google"}
        setProvider={setProvider}
        fetchAvailableModels={fetchAvailableModels}
      />

      {/* Header */}
      <div className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-b-0 shadow-sm">
        <header className="p-5">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">PromptPunk</span>
              <span className="ml-2">🚀🤖</span>
            </h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />

              <button
                onClick={() => setIsConfigOpen(true)}
                className={cn(
                  "flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all duration-200 h-10 border",
                  isConfigured
                    ? "bg-green-600/20 text-green-400 border-green-700 hover:bg-green-600/30"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700",
                )}
                aria-label="Configure API"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">{isConfigured ? "API Configured" : "API Config"}</span>
              </button>

              <div className="relative flex items-center group">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-l-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-100 w-40 h-10"
                  placeholder="conversation"
                />
                <button
                  onClick={handleSaveConversation}
                  className="flex items-center justify-center h-10 px-3 bg-pink-500 hover:bg-pink-600 text-white rounded-r-md transition-colors duration-200 border border-pink-600"
                  aria-label="Save conversation"
                >
                  <Download className="h-4 w-4" />
                </button>
                <span className="absolute -top-8 left-0 bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  Save conversation
                </span>
              </div>

              <button
                onClick={clearConversation}
                className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2.5 rounded-md transition-all duration-200 h-10 border border-gray-300 dark:border-gray-700"
                aria-label="Clear chat"
              >
                <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                <span className="text-sm font-medium">Clear Chat</span>
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Main Content - Side by Side Layout */}
      <div className="w-full flex flex-col md:flex-row border-x border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex-1">
        {/* Left Side - Prompt Manager (1/3) */}
        <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-800">
          <PromptManager
            onSelectPrompt={handleSelectPrompt}
            onSelectTemplate={handleSelectTemplate}
            systemPromptTokens={systemPromptTokens}
            userInput={input}
          />

          {/* Template Status Indicator */}
          {activeTemplate && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="bg-pink-500/10 rounded-lg border border-pink-500/30 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                    <h3 className="text-sm font-medium text-pink-500">Active Template</h3>
                  </div>
                  <button
                    onClick={() => setActiveTemplate(null)}
                    className="text-xs text-pink-500 hover:text-pink-400"
                  >
                    Clear
                  </button>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">{activeTemplate.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Type your input and it will be processed with this template.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Chat Area (2/3) */}
        <div className="w-full md:w-2/3 flex flex-col">
          {/* Token Usage Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-pink-500" />
                <h3 className="text-sm font-medium">Token Usage</h3>
                <button
                  onClick={() => setShowTokenInfo(!showTokenInfo)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  aria-label="Token information"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <span>
                    Input:{" "}
                    <span className="text-gray-800 dark:text-gray-200">{tokenStats.inputTokens.toLocaleString()}</span>
                  </span>
                  <span className="mx-1">|</span>
                  <span>
                    Output:{" "}
                    <span className="text-gray-800 dark:text-gray-200">{tokenStats.outputTokens.toLocaleString()}</span>
                  </span>
                  <span className="mx-1">|</span>
                  <span>
                    Total: <span className="text-pink-500 font-medium">{totalTokens.toLocaleString()}</span>
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Cost: <span className="text-pink-500 font-medium">{formatCost(totalCost)}</span>
                </div>
              </div>
            </div>

            {showTokenInfo && (
              <div className="mt-2 p-2 bg-gray-200 dark:bg-gray-750 rounded-md text-xs text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
                <p className="mb-1">
                  <strong>OpenAI Tokenization:</strong> 1 token ≈ 4 chars or ¾ of a word | Model:{" "}
                  <span className="text-gray-900 dark:text-gray-200">{currentModel}</span> | System prompt:{" "}
                  <span className="text-gray-900 dark:text-gray-200">{systemPromptTokens}</span> tokens
                </p>
              </div>
            )}
          </div>

          {/* Chat container */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 min-h-[60vh] max-h-[70vh] bg-gray-50 dark:bg-gray-900">
            <div className="p-5 space-y-5">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center space-y-3">
                    <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                      <Send className="h-7 w-7 text-pink-500" />
                    </div>
                    <p className="text-xl">Welcome to PromptPunk! Let's get started.</p>
                    <p className="text-lg">Your AI Playground Awaits!</p>
                    <p className="text-base">
                      {isConfigured ? `Using ${currentModel} API` : "Configure API key to use real LLM models"}
                    </p>
                    {activeTemplate && (
                      <p className="text-sm mt-2 text-pink-500">
                        Template "{activeTemplate.name}" is active. Your input will be processed with this template.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                      "transition-opacity duration-300 ease-in-out",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[90%] rounded-2xl px-5 py-4 shadow-md animate-fadeIn",
                        message.role === "user"
                          ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700",
                      )}
                    >
                      <div className="prose dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2" {...props} />,
                            h4: ({ node, ...props }) => <h4 className="text-base font-bold mb-2" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold text-pink-500" {...props} />,
                            em: ({ node, ...props }) => (
                              <em className="italic text-gray-700 dark:text-gray-300" {...props} />
                            ),
                            blockquote: ({ node, ...props }) => (
                              <blockquote className="border-l-4 border-pink-500 pl-4 italic my-4" {...props} />
                            ),
                            code: ({ node, inline, ...props }: { node?: any; inline?: boolean; className?: string; children?: React.ReactNode }) =>
                              inline ? (
                                <code className="bg-gray-200 dark:bg-gray-700 rounded px-1 py-0.5 text-sm" {...props} />
                              ) : (
                                <code
                                  className="block bg-gray-200 dark:bg-gray-700 rounded p-4 my-4 text-sm overflow-x-auto"
                                  {...props}
                                />
                              ),
                            a: ({ node, ...props }) => (
                              <a className="text-pink-500 hover:text-pink-400 underline" {...props} />
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                      <div className="flex justify-between items-center mt-2 space-x-6">
                        <div className="text-xs opacity-70">{new Date(message.timestamp).toLocaleTimeString()}</div>
                        {message.tokens && <div className="text-xs opacity-70">{message.tokens} tokens</div>}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 max-w-[80%] shadow-md">
                    <LoadingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            {activeTemplate && (
              <div className="mb-2 px-3 py-2 bg-pink-500/10 border border-pink-500/30 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-pink-500">Template: {activeTemplate.name}</span>
                  <button
                    onClick={() => setActiveTemplate(null)}
                    className="text-xs text-pink-500 hover:text-pink-400"
                  >
                    Clear Template
                  </button>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="flex-1 flex flex-col">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    activeTemplate ? "Type your input to use with the template..." : "Type your message here..."
                  }
                  className="min-h-[70px] bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus-visible:ring-pink-500 resize-none text-base text-gray-900 dark:text-gray-100"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                  style={{ overflow: "hidden" }}
                />
                <div className="flex justify-between mt-1">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {activeTemplate && <span>Template mode: Your input will be processed with the template</span>}
                  </div>
                  {input && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 self-end">{currentInputTokens} tokens</div>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 transition-all duration-300 px-5 self-start text-white"
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
