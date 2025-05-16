"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { ModelListItem } from "@/lib/use-openai"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ConfigModalProps {
  isOpen: boolean
  onClose: () => void
  apiKey: string
  setApiKey: (key: string) => void
  model: string
  setModel: (model: string) => void
  baseUrl: string
  setBaseUrl: (url: string) => void
  provider: "openai" | "google"
  setProvider: (provider: "openai" | "google") => void
  fetchAvailableModels: (apiKey: string, provider: "openai" | "google") => Promise<ModelListItem[]>
}

const ConfigModal = ({
  isOpen,
  onClose,
  apiKey,
  setApiKey,
  model,
  setModel,
  baseUrl,
  setBaseUrl,
  provider,
  setProvider,
  fetchAvailableModels,
}: ConfigModalProps) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey)
  const [localModel, setLocalModel] = useState(model || "")
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl)
  const [localProvider, setLocalProvider] = useState<"openai" | "google">(provider || "openai")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  // State for dynamic models
  const [dynamicModels, setDynamicModels] = useState<ModelListItem[]>([])
  const [isFetchingModels, setIsFetchingModels] = useState(false)
  const [fetchModelsError, setFetchModelsError] = useState("")

  useEffect(() => {
    if (isOpen) {
      setLocalApiKey(apiKey)
      setLocalModel(model || (dynamicModels.length > 0 ? dynamicModels[0].id : ""))
      setLocalBaseUrl(baseUrl)
      setLocalProvider(provider || "openai")
      setError("")
      setFetchModelsError("")
      // Don't reset dynamicModels here, let it persist if already fetched for the provider
      // Or, refetch if provider changed and API key is present
      if (apiKey && provider && provider === localProvider) {
        // Optionally auto-fetch if key and provider are already set and match
        // handleFetchModels(); 
      }
    }
  }, [isOpen, apiKey, model, baseUrl, provider])

  const handleSave = () => {
    setIsSaving(true)
    setError("")

    try {
      // Validate API key
      if (!localApiKey.trim()) {
        throw new Error("API key is required")
      }

      // Set the base URL based on provider
      let finalBaseUrl = localBaseUrl
      if (localProvider === "openai") {
        finalBaseUrl = "https://api.openai.com/v1"
      } else if (localProvider === "google") {
        finalBaseUrl = "https://generativelanguage.googleapis.com/v1beta"
      }

      // Set the model based on provider if not already set
      let finalModel = localModel
      if (localProvider === "openai" && !finalModel) {
        finalModel = "gpt-4o"
      } else if (localProvider === "google" && !finalModel) {
        finalModel = "gemini-2.0-flash"
      }

      // Save configuration
      setProvider(localProvider)
      setApiKey(localApiKey)
      setModel(finalModel)
      setBaseUrl(finalBaseUrl)

      // Close modal
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const handleProviderChange = (newProvider: "openai" | "google") => {
    setLocalProvider(newProvider)
    setDynamicModels([]) // Clear previously fetched models for the old provider
    setLocalModel("") // Clear selected model
    setFetchModelsError("") // Clear fetch error

    // Set default model based on provider (initial placeholder before fetching)
    if (newProvider === "openai") {
      // setLocalModel("gpt-4o") // Or keep empty until fetched
      setLocalBaseUrl("https://api.openai.com/v1")
    } else if (newProvider === "google") {
      // setLocalModel("gemini-2.0-flash") // Or keep empty until fetched
      setLocalBaseUrl("https://generativelanguage.googleapis.com/v1beta")
    }
  }

  const handleFetchModels = async () => {
    if (!localApiKey.trim()) {
      setFetchModelsError("API Key is required to fetch models.")
      return
    }
    setIsFetchingModels(true)
    setFetchModelsError("")
    setDynamicModels([]) // Clear previous models

    // The setApiKey and setProvider calls are still useful here to update the hook's general state
    // if the user intends to save this key/provider combination later, even if fetch uses direct params.
    setApiKey(localApiKey)
    setProvider(localProvider)

    try {
      // Pass localApiKey and localProvider directly to the fetch function
      const models = await fetchAvailableModels(localApiKey, localProvider)
      setDynamicModels(models)
      if (models.length > 0) {
        setLocalModel(models[0].id) // Select the first model by default
      } else {
        setLocalModel("")
        setFetchModelsError("No models found for this provider or API key.")
      }
    } catch (err) {
      setFetchModelsError(err instanceof Error ? err.message : "Failed to fetch models")
      setLocalModel("")
    } finally {
      setIsFetchingModels(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">API Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange("openai")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  localProvider === "openai"
                    ? "bg-pink-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600",
                )}
              >
                OpenAI
              </button>
              <button
                type="button"
                onClick={() => handleProviderChange("google")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  localProvider === "google"
                    ? "bg-pink-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600",
                )}
              >
                Google
              </button>
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300">
              API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Enter your API key"
            />
            <p className="text-xs text-gray-400">
              Your API key is stored only in your browser session and is never sent to our servers.
            </p>
          </div>

          {/* Fetch Models Button */}
          {localApiKey && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isFetchingModels || !localApiKey.trim()}
                className="w-full px-3 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isFetchingModels ? "Fetching Models..." : "Fetch Available Models"}
              </button>
              {fetchModelsError && (
                <p className="text-xs text-red-400">{fetchModelsError}</p>
              )}
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-2">
            <label htmlFor="model" className="block text-sm font-medium text-gray-300">
              Model
            </label>
            <select
              id="model"
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
              disabled={isFetchingModels || dynamicModels.length === 0}
            >
              {dynamicModels.length === 0 && !isFetchingModels && (
                <option value="" disabled>
                  {localApiKey ? "Fetch models or no models found" : "Enter API Key & Fetch Models"}
                </option>
              )}
              {isFetchingModels && <option value="" disabled>Loading models...</option>}
              {dynamicModels.map((modelItem) => (
                <option key={modelItem.id} value={modelItem.id}>
                  {modelItem.name}
                </option>
              ))}
            </select>
          </div>

          {/* Base URL */}
          <div className="space-y-2">
            <label htmlFor="baseUrl" className="block text-sm font-medium text-gray-300">
              Base URL (Optional for OpenAI)
            </label>
            <input
              type="text"
              id="baseUrl"
              value={localBaseUrl || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalBaseUrl(e.target.value)}
              placeholder="e.g. https://api.openai.com/v1"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 sm:text-sm disabled:opacity-50"
              disabled={localProvider !== "openai"}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-300 text-sm">{error}</div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <Button
            onClick={handleSave}
            disabled={isFetchingModels}
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingModels ? "Fetching..." : "Save Configuration"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfigModal

