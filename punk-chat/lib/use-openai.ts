"use client"

import { useState, useEffect } from "react"
import { countTokens } from "./tokenizer"

type Message = {
  role: "system" | "user" | "assistant"
  content: string
}

type ApiResponse = {
  content: string
  tokens?: number
}

type Provider = "openai" | "google"

// Define a type for the model list items
export type ModelListItem = {
  id: string; // ID used for API calls
  name: string; // Name for display in UI
};

export function useOpenAI() {
  // Initialize state with null or empty until loaded
  const [apiKey, setApiKey] = useState<string>("")
  const [model, setModel] = useState<string>("")
  const [baseUrl, setBaseUrl] = useState<string>("")
  const [currentProvider, setCurrentProvider] = useState<Provider | null>(null)
  const [isConfigured, setIsConfigured] = useState<boolean>(false)

  // Effect for initial load from localStorage
  useEffect(() => {
    console.log("[useOpenAI] Initial load effect running...");
    const savedProvider = localStorage.getItem("llm_provider") as Provider | null;
    const effectiveProvider = savedProvider || "google"; // Default to google if nothing saved

    console.log("[useOpenAI] Effective provider for initial load:", effectiveProvider);
    setCurrentProvider(effectiveProvider); // Set this first

    const savedApiKey = localStorage.getItem(`llm_api_key_${effectiveProvider}`);
    const savedModel = localStorage.getItem(`llm_model_${effectiveProvider}`);
    const savedBaseUrl = localStorage.getItem(`llm_base_url_${effectiveProvider}`);

    console.log(`[useOpenAI] For ${effectiveProvider} - API Key: ${savedApiKey ? "SET" : "NOT SET"}, Model: ${savedModel}, BaseUrl: ${savedBaseUrl}`);

    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsConfigured(true);
      console.log("[useOpenAI] API Key found, isConfigured: true");
    } else {
      setApiKey(""); // Ensure apiKey is cleared if not found for the provider
      setIsConfigured(false);
      console.log("[useOpenAI] No API Key found, isConfigured: false");
    }

    // Set model and baseUrl, falling back to provider-specific defaults if not found in localStorage
    setModel(savedModel || (effectiveProvider === "openai" ? "gpt-4o" : "gemini-2.0-flash"));
    setBaseUrl(savedBaseUrl || (effectiveProvider === "openai" ? "https://api.openai.com/v1" : "https://generativelanguage.googleapis.com/v1beta"));
    
  }, []) // Runs once on mount

  // Effect to save settings WHEN they change AFTER initial load
  useEffect(() => {
    if (currentProvider) { // Only save if provider is set (i.e., after initial load or explicit change)
      console.log(`[useOpenAI] Saving provider to localStorage: ${currentProvider}`);
      localStorage.setItem("llm_provider", currentProvider);
      
      if (apiKey) { // Only save/set configured if apiKey has a value
        console.log(`[useOpenAI] Saving API key for ${currentProvider} to localStorage.`);
        localStorage.setItem(`llm_api_key_${currentProvider}`, apiKey);
        setIsConfigured(true);
      } else {
        // If apiKey is empty, remove it from storage and set isConfigured to false
        console.log(`[useOpenAI] Removing API key for ${currentProvider} from localStorage as it's empty.`);
        localStorage.removeItem(`llm_api_key_${currentProvider}`);
        setIsConfigured(false);
      }

      if (model) {
        console.log(`[useOpenAI] Saving model for ${currentProvider} to localStorage: ${model}`);
        localStorage.setItem(`llm_model_${currentProvider}`, model);
      } else {
        // If model is empty, remove it. Or consider setting a default if that's desired.
        localStorage.removeItem(`llm_model_${currentProvider}`);
      }

      if (baseUrl) {
        console.log(`[useOpenAI] Saving baseUrl for ${currentProvider} to localStorage: ${baseUrl}`);
        localStorage.setItem(`llm_base_url_${currentProvider}`, baseUrl);
      } else {
        localStorage.removeItem(`llm_base_url_${currentProvider}`);
      }
    }
  }, [currentProvider, apiKey, model, baseUrl]); // React to changes in these primary values

  // The setProvider function called by ConfigModal when user changes provider
  const handleSetProvider = (newProvider: Provider) => {
    console.log(`[useOpenAI] handleSetProvider called with: ${newProvider}`);
    
    // Load settings for the new provider or set defaults
    const newApiKey = localStorage.getItem(`llm_api_key_${newProvider}`) || "";
    const newModel = localStorage.getItem(`llm_model_${newProvider}`) || (newProvider === "openai" ? "gpt-4o" : "gemini-2.0-flash");
    const newBaseUrl = localStorage.getItem(`llm_base_url_${newProvider}`) || (newProvider === "openai" ? "https://api.openai.com/v1" : "https://generativelanguage.googleapis.com/v1beta");
    
    // Update all related states together
    setCurrentProvider(newProvider); // This will trigger the save effect eventually
    setApiKey(newApiKey);
    setModel(newModel);
    setBaseUrl(newBaseUrl);
    setIsConfigured(!!newApiKey); // isConfigured depends on the loaded/default apiKey for the newProvider

    console.log(`[useOpenAI] After provider switch to ${newProvider} - API Key: ${newApiKey ? "SET" : "NOT SET"}, Model: ${newModel}, BaseUrl: ${newBaseUrl}, Configured: ${!!newApiKey}`);
  };
  
  const fetchAvailableModels = async (key: string, prov: Provider): Promise<ModelListItem[]> => {
    if (!key) { 
      throw new Error("API key is not configured to fetch models.");
    }

    let models: ModelListItem[] = [];
    let effectiveBaseUrl = ""; 

    if (prov === "openai") {
      effectiveBaseUrl = "https://api.openai.com/v1";
    } else if (prov === "google") {
      effectiveBaseUrl = "https://generativelanguage.googleapis.com/v1beta";
    } else {
      // Should not happen with current Provider type
      throw new Error("Unsupported provider for fetching models.");
    }

    try {
      if (prov === "openai") {
        const response = await fetch(`${effectiveBaseUrl}/models`, { 
          headers: {
            Authorization: `Bearer ${key}`, 
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch OpenAI models: ${response.status} ${JSON.stringify(errorData)}`);
        }
        const data = await response.json();
        models = data.data.map((model: any) => ({ id: model.id, name: model.id })).sort((a: ModelListItem,b: ModelListItem) => a.name.localeCompare(b.name));
      } else if (prov === "google") {
        const response = await fetch(`${effectiveBaseUrl}/models?key=${key}`); 
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch Google models: ${response.status} ${JSON.stringify(errorData)}`);
        }
        const data = await response.json();
        // Filter out models that don't support 'generateContent' if possible, or handle their specific display names
        models = data.models.filter((model: any) => model.supportedGenerationMethods?.includes('generateContent'))
                           .map((model: any) => ({ id: model.name, name: model.displayName || model.name }))
                           .sort((a: ModelListItem,b: ModelListItem) => a.name.localeCompare(b.name));
        if (models.length === 0) {
          console.warn("[useOpenAI] No Google models supporting 'generateContent' found. Listing all models.");
          // Fallback to listing all models if none support generateContent, though this might lead to issues later.
           models = data.models.map((model: any) => ({ id: model.name, name: model.displayName || model.name })).sort((a: ModelListItem,b: ModelListItem) => a.name.localeCompare(b.name));
        }
      }
    } catch (error) {
      console.error("Error fetching available models:", error);
      throw error; 
    }
    return models;
  };

  const sendMessage = async (messages: Message[]): Promise<ApiResponse | null> => {
    if (!isConfigured || !apiKey) { // Rely on isConfigured and ensure apiKey is present
      throw new Error("API key is not configured");
    }

    // Ensure currentProvider, model, and baseUrl are valid before sending.
    // They should be set by initial load or handleSetProvider.
    if (!currentProvider || !model || !baseUrl) {
        throw new Error("Provider, model, or base URL is not properly set.");
    }

    try {
      const isOpenAI = currentProvider === "openai";
      const isGoogle = currentProvider === "google";

      let endpoint = "";
      let headers: Record<string, string> = {};
      let bodyObj: any = {}; // Renamed to avoid conflict with body tag

      if (isOpenAI) {
        endpoint = `${baseUrl}/chat/completions`;
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        };
        bodyObj = {
          model,
          messages,
          temperature: 0.7,
        };
      } else if (isGoogle) {
        const modelName = model.startsWith("models/") ? model : `models/${model}`;
        endpoint = `${baseUrl}/${modelName}:generateContent?key=${apiKey}`;
        headers = {
          "Content-Type": "application/json",
        };
        
        const systemMessage = messages.find(m => m.role === "system")?.content || "";
        const conversationParts = messages
          .filter(m => m.role !== "system")
          .map(m => ({
            role: m.role === "user" ? "user" : "model", 
            parts: [{ text: m.content }]
          }));
        
        bodyObj = {
          contents: conversationParts.length > 0 ? conversationParts : [{ parts: [{ text: "Hello" }] }],
          ...(systemMessage && { systemInstruction: { parts: [{ text: systemMessage }] } }), // Conditionally add systemInstruction
          generationConfig: {
            temperature: 0.7,
          }
        };
      } else {
         // This case should ideally not be reached if currentProvider is strictly "openai" | "google"
        console.error("Unsupported provider in sendMessage:", currentProvider);
        throw new Error("Unsupported provider configured.");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyObj),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();

      let content = "";
      let tokens = 0;

      if (isOpenAI) {
        content = data.choices[0].message.content;
        tokens = data.usage?.completion_tokens || countTokens(content);
      } else if (isGoogle) {
        if (data.candidates && data.candidates.length > 0 && 
            data.candidates[0].content && 
            data.candidates[0].content.parts && 
            data.candidates[0].content.parts.length > 0) {
          content = data.candidates[0].content.parts[0].text || "";
        }
        tokens = countTokens(content); 
      }

      return {
        content,
        tokens,
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  return {
    apiKey,
    setApiKey,
    model,
    setModel,
    baseUrl,
    setBaseUrl,
    isConfigured,
    sendMessage,
    currentModel: model,
    currentProvider,
    setProvider: handleSetProvider,
    fetchAvailableModels,
  };
}

