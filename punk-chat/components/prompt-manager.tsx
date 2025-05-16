"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Pencil, Trash2, Plus, Save, X, Copy, Code, ChevronDown, Shield, Code2, Check, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { countTokens } from "@/lib/tokenizer"
import { cn } from "@/lib/utils"

export type Prompt = {
  id: string
  name: string
  content: string
  tokens: number
  isTemplate?: boolean
}

interface PromptManagerProps {
  onSelectPrompt: (prompt: Prompt) => void
  onSelectTemplate: (template: Prompt, userInput: string) => void
  systemPromptTokens: number
  userInput: string
}

// Define preset system prompts
const presetSystemPrompts = [
  { name: "Helpful Assistant", content: "You are a helpful assistant." },
  { name: "Code Explainer", content: "You are an expert programmer. Explain the following code clearly and concisely. Provide examples where helpful." },
  { name: "Sarcastic Bot", content: "You are a witty and sarcastic chatbot. Respond to user queries with a touch of humor and irony, but still try to be helpful in your own unique way." },
  { name: "ELI5 Explainer", content: "Explain complex topics like I'm 5 years old, using simple language and analogies." },
  { name: "Creative Storyteller", content: "You are a master storyteller. Weave engaging narratives based on user prompts." },
]

const PromptManager = ({ onSelectPrompt, onSelectTemplate, systemPromptTokens, userInput }: PromptManagerProps) => {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [isExpanded, setIsExpanded] = useState(true) // Default to expanded in the new layout
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [newPromptName, setNewPromptName] = useState("")
  const [newPromptContent, setNewPromptContent] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState<Prompt>({
    id: "system",
    name: "System Prompt",
    content: "You are a helpful assistant.",
    tokens: systemPromptTokens || countTokens("You are a helpful assistant."),
  })
  const [isEditingSystem, setIsEditingSystem] = useState(false)
  const [isTemplate, setIsTemplate] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load prompts from localStorage on mount
  useEffect(() => {
    const savedPrompts = localStorage.getItem("llm_prompts")
    if (savedPrompts) {
      try {
        setPrompts(JSON.parse(savedPrompts))
      } catch (e) {
        console.error("Failed to parse saved prompts:", e)
      }
    }

    const savedSystemPrompt = localStorage.getItem("llm_system_prompt")
    if (savedSystemPrompt) {
      try {
        setSystemPrompt(JSON.parse(savedSystemPrompt))
      } catch (e) {
        console.error("Failed to parse saved system prompt:", e)
      }
    }
  }, [])

  // Update system prompt tokens when they change from parent
  useEffect(() => {
    setSystemPrompt((prev) => ({
      ...prev,
      tokens: systemPromptTokens,
    }))
  }, [systemPromptTokens])

  // Save prompts to localStorage when they change
  useEffect(() => {
    localStorage.setItem("llm_prompts", JSON.stringify(prompts))
  }, [prompts])

  // Save system prompt to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("llm_system_prompt", JSON.stringify(systemPrompt))
  }, [systemPrompt])

  // Auto-resize textarea when content changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [newPromptContent, editingPrompt?.content])

  // Auto-resize textarea when editing
  useEffect(() => {
    if (editingPrompt && textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [editingPrompt])

  const handleCreatePrompt = () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return

    const newPrompt: Prompt = {
      id: Date.now().toString(),
      name: newPromptName.trim(),
      content: newPromptContent.trim(),
      tokens: countTokens(newPromptContent.trim()),
      isTemplate: isTemplate,
    }

    setPrompts([...prompts, newPrompt])
    setNewPromptName("")
    setNewPromptContent("")
    setIsTemplate(false)
    setIsCreating(false)
  }

  const handleUpdatePrompt = () => {
    if (!editingPrompt || !editingPrompt.name.trim() || !editingPrompt.content.trim()) return

    const updatedPrompt = {
      ...editingPrompt,
      name: editingPrompt.name.trim(),
      content: editingPrompt.content.trim(),
      tokens: countTokens(editingPrompt.content.trim()),
    }

    setPrompts(prompts.map((p) => (p.id === updatedPrompt.id ? updatedPrompt : p)))
    setEditingPrompt(null)
  }

  const handleUpdateSystemPrompt = () => {
    if (!systemPrompt.content.trim()) return

    const updatedSystemPrompt = {
      ...systemPrompt,
      content: systemPrompt.content.trim(),
      tokens: countTokens(systemPrompt.content.trim()),
    }

    setSystemPrompt(updatedSystemPrompt)
    setIsEditingSystem(false)

    // Notify parent component about the system prompt update
    onSelectPrompt(updatedSystemPrompt)
  }

  const handlePresetSelect = (selectedName: string) => {
    const selectedPreset = presetSystemPrompts.find(p => p.name === selectedName)
    if (selectedPreset) {
      const updatedSystemPrompt = {
        ...systemPrompt, // Keep id and name (name is "System Prompt")
        content: selectedPreset.content,
        tokens: countTokens(selectedPreset.content),
      }
      setSystemPrompt(updatedSystemPrompt)
      // Automatically apply/save this new system prompt
      // This will also trigger onSelectPrompt to notify the parent (page.tsx)
      onSelectPrompt(updatedSystemPrompt)
      setIsEditingSystem(false) // Close editing mode if it was open
    }
  }

  const handleDeletePrompt = (id: string) => {
    if (window.confirm("Are you sure you want to delete this prompt?")) {
      setPrompts(prompts.filter((p) => p.id !== id))
    }
  }

  const handleSelectPrompt = (prompt: Prompt, e?: React.MouseEvent) => {
    // Prevent event bubbling if event is provided
    if (e) {
      e.stopPropagation()
    }

    console.log("Selected prompt:", prompt)

    if (prompt.id === "system") {
      onSelectPrompt(prompt)
    } else if (prompt.isTemplate) {
      // For templates, we need to replace {query} with the user input
      onSelectTemplate(prompt, userInput)
    } else {
      // For regular prompts
      onSelectPrompt(prompt)
    }
  }

  const handleCopyPrompt = (content: string) => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        // Show a temporary success message or toast
        alert("Prompt copied to clipboard")
      })
      .catch((err) => {
        console.error("Failed to copy prompt:", err)
      })
  }

  // Preview template with current user input
  const previewTemplate = (template: string, input: string) => {
    if (!input) return template.replace(/{query}/g, "[Your input will appear here]")
    return template.replace(/{query}/g, input)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 flex justify-between items-center">
        <h3 className="text-base font-medium flex items-center gap-2">
          <span className="bg-pink-500 h-4 w-4 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{isExpanded ? "-" : "+"}</span>
          </span>
          Prompt Manager
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {isExpanded && (
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          {/* System Prompt Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">System Prompt</h4>
              <div className="flex items-center gap-2">
                {/* Preset Selector Dropdown */}
                <div className="relative">
                  <select
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md px-2 py-1 appearance-none focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer pr-6"
                    value="" // Controlled by selection, reset to placeholder
                  >
                    <option value="" disabled className="text-gray-500">Presets...</option>
                    {presetSystemPrompts.map(preset => (
                      <option key={preset.name} value={preset.name}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400" />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">{systemPrompt.tokens} tokens</span>
                {!isEditingSystem ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setIsEditingSystem(true)}
                      className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopyPrompt(systemPrompt.content)}
                      className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button
                      onClick={handleUpdateSystemPrompt}
                      className="p-1 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                    >
                      <Save className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setIsEditingSystem(false)}
                      className="p-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isEditingSystem ? (
              <textarea
                value={systemPrompt.content}
                onChange={(e) =>
                  setSystemPrompt({
                    ...systemPrompt,
                    content: e.target.value,
                    tokens: countTokens(e.target.value),
                  })
                }
                className="w-full min-h-[80px] px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                placeholder="Enter system prompt..."
              />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded p-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                {systemPrompt.content}
              </div>
            )}

            {!isEditingSystem && (
              <button
                onClick={(e) => handleSelectPrompt(systemPrompt, e)}
                className="mt-2 px-2 py-1 bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded text-xs hover:bg-pink-500/30 transition-colors"
              >
                Apply System Prompt
              </button>
            )}
          </div>

          {/* User Prompts List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Saved Prompts</h4>
                <span className="text-xs text-gray-600 dark:text-gray-400">{prompts.length} prompts</span>
              </div>
            </div>

            {prompts.length === 0 && !isCreating ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No saved prompts. Create one to get started.
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                {prompts.map((prompt) => (
                  <li key={prompt.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    {editingPrompt?.id === prompt.id ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <input
                            type="text"
                            value={editingPrompt.name}
                            onChange={(e) =>
                              setEditingPrompt({
                                ...editingPrompt,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                            placeholder="Prompt name"
                          />
                          <div className="flex items-center ml-2">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingPrompt.isTemplate}
                                onChange={(e) =>
                                  setEditingPrompt({
                                    ...editingPrompt,
                                    isTemplate: e.target.checked,
                                  })
                                }
                                className="sr-only"
                              />
                              <div
                                className={cn(
                                  "w-9 h-5 rounded-full transition-colors flex items-center px-1",
                                  editingPrompt.isTemplate ? "bg-pink-500" : "bg-gray-300 dark:bg-gray-600",
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-3 h-3 rounded-full bg-white transition-transform",
                                    editingPrompt.isTemplate ? "translate-x-4" : "translate-x-0",
                                  )}
                                ></div>
                              </div>
                              <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">Template</span>
                            </label>
                          </div>
                        </div>
                        <textarea
                          ref={textareaRef}
                          value={editingPrompt.content}
                          onChange={(e) =>
                            setEditingPrompt({
                              ...editingPrompt,
                              content: e.target.value,
                              tokens: countTokens(e.target.value),
                            })
                          }
                          className="w-full min-h-[100px] px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                          placeholder="Enter prompt content..."
                        />
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {editingPrompt.tokens} tokens
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdatePrompt}
                              className="px-2 py-1 bg-pink-600/30 text-pink-600 dark:text-pink-400 rounded text-xs hover:bg-pink-600/50 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPrompt(null)}
                              className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">{prompt.name}</h4>
                            {prompt.isTemplate && (
                              <span className="ml-2 px-1.5 py-0.5 bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded text-xs">
                                Template
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">{prompt.tokens} tokens</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setEditingPrompt(prompt)}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePrompt(prompt.id)}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleCopyPrompt(prompt.content)}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {prompt.isTemplate ? (
                          <div className="mt-2 space-y-2">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                              {prompt.content}
                            </div>
                            <div className="bg-gray-100/50 dark:bg-gray-900/50 rounded p-2 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
                              <div className="flex items-center mb-1">
                                <Code className="h-3 w-3 mr-1 text-pink-500" />
                                <span className="text-pink-600 dark:text-pink-400 font-medium">
                                  Preview with current input:
                                </span>
                              </div>
                              {previewTemplate(prompt.content, userInput)}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                            {prompt.content}
                          </div>
                        )}

                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={(e) => handleSelectPrompt(prompt, e)}
                            className="px-2 py-1 bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded text-xs hover:bg-pink-500/30 transition-colors"
                          >
                            {prompt.isTemplate ? "Use Template" : "Use Prompt"}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Create New Prompt Form */}
            {isCreating && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Create New Prompt</h4>
                <div className="flex justify-between">
                  <input
                    type="text"
                    value={newPromptName}
                    onChange={(e) => setNewPromptName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Prompt name"
                  />
                  <div className="flex items-center ml-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isTemplate}
                        onChange={(e) => setIsTemplate(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "w-9 h-5 rounded-full transition-colors flex items-center px-1",
                          isTemplate ? "bg-pink-500" : "bg-gray-300 dark:bg-gray-600",
                        )}
                      >
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full bg-white transition-transform",
                            isTemplate ? "translate-x-4" : "translate-x-0",
                          )}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs text-gray-700 dark:text-gray-300">Template</span>
                    </label>
                  </div>
                </div>

                {isTemplate && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                    <p>
                      Use <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{"{query}"}</code> in your
                      template to insert the user's input.
                    </p>
                  </div>
                )}

                <textarea
                  ref={textareaRef}
                  value={newPromptContent}
                  onChange={(e) => setNewPromptContent(e.target.value)}
                  className="w-full min-h-[100px] px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  placeholder={
                    isTemplate ? "Enter prompt template with {query} placeholder..." : "Enter prompt content..."
                  }
                />

                {isTemplate && userInput && (
                  <div className="bg-gray-100/50 dark:bg-gray-900/50 rounded p-2 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
                    <div className="flex items-center mb-1">
                      <Code className="h-3 w-3 mr-1 text-pink-500" />
                      <span className="text-pink-600 dark:text-pink-400 font-medium">
                        Preview with current input:
                      </span>
                    </div>
                    {previewTemplate(newPromptContent, userInput)}
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {countTokens(newPromptContent)} tokens
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreatePrompt}
                      className="px-2 py-1 bg-pink-600/30 text-pink-600 dark:text-pink-400 rounded text-xs hover:bg-pink-600/50 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsCreating(false)
                        setIsTemplate(false)
                        setNewPromptName("")
                        setNewPromptContent("")
                      }}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Prompt Button */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 mt-auto bg-white dark:bg-gray-900">
        <Button
          onClick={() => setIsCreating(true)}
          className="w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Prompt
        </Button>
      </div>
    </div>
  )
}

export default PromptManager

