<h1 align="center" id="top">PromptPunk 🚀🤖</h1>

<p align="center">
    <em>
        Welcome to PromptPunk! Your ultimate AI Playground for crafting, testing, and managing LLM prompts with ease. This tool is designed to help you test and evaluate prompts for various language models, providing insights into performance and cost, allowing you to optimize your usage effectively.
    </em>
</p>


## ✨ Features

*   **Interactive Chat Interface**: Test your prompts directly and see responses from AI models.
*   **Multi-Provider Support**:
    *   OpenAI (e.g., GPT-3.5-turbo, GPT-4)
    *   Google (e.g., Gemini Pro, Gemini Flash)
*   **Dynamic Model Fetching**: Automatically fetches available models from your configured provider once an API key is entered.
*   **Prompt Management**:
    *   Create, save, and edit prompts.
    *   Organize prompts, including system prompts and template prompts.
    *   Use preset system prompts to get started quickly.
*   **Template Prompts**: Define prompts with `{'{\query}'}` placeholders for dynamic user input.
*   **Token Usage & Cost Estimation**: Keep track of your input/output tokens and estimated costs.
*   **Configuration Modal**: Easily configure API keys, select models, and providers.
*   **Conversation Export**: Save your chat conversations as `.txt` files.
*   **Dark/Light Mode**: Comfortable viewing in any lighting.
*   **Persistent Configuration**: API settings are saved in `localStorage` for your convenience.
*   **Responsive Design**: Adapts to different screen sizes.
*   **Security First**: API keys stored locally in browser storage (as mentioned in original).

## 📂 Project Structure (Main Application - `punk-chat` directory)

If your repository contains the Next.js application within the `punk-chat` subdirectory, the relevant structure is:

```
PromptPunk/ (Your Git Repository Root)
└── punk-chat/
    ├── .next/                  # Next.js build output (generated)
    ├── app/                    # Next.js App Router (pages, layouts, actions)
    │   ├── layout.tsx          # Main layout
    │   ├── page.tsx            # Main page component
    │   └── actions.ts          # Server Actions (e.g., saveConversation)
    ├── components/             # React components
    │   ├── config-modal.tsx    # API configuration modal
    │   ├── prompt-manager.tsx  # Prompt management UI
    │   ├── theme-toggle.tsx    # Dark/Light mode toggle
    │   └── ui/                 # UI primitives (e.g., button, textarea from shadcn/ui)
    ├── lib/                    # Utility functions and hooks
    │   ├── tokenizer.ts        # Token counting logic
    │   ├── use-openai.ts       # Custom hook for LLM API interaction & state
    │   └── utils.ts            # General utility functions (e.g., cn for classnames)
    ├── public/                 # Static assets (e.g., images, favicons)
    ├── .gitignore
    ├── components.json         # shadcn/ui configuration
    ├── eslint.config.mjs       # ESLint configuration
    ├── next-env.d.ts           # Next.js TypeScript declarations
    ├── next.config.js          # Next.js configuration for GitHub Pages
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.mjs      # PostCSS configuration
    ├── tailwind.config.js      # Tailwind CSS configuration (JavaScript version, potentially older)
    ├── tailwind.config.ts      # Tailwind CSS configuration (TypeScript version, primary)
    └── tsconfig.json           # TypeScript configuration
```

## 🚀 Getting Started

### Live Demo

Access the production deployment directly:
👉 [PromptPunk](https://dumb-kid-root.github.io/PromptPunk/)

*(Note: The Vercel demo might not reflect the latest changes aimed at GitHub Pages deployment unless updated separately.)*

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/VinsmokeSomya/PromptPunk.git
    cd PromptPunk
    ```

2.  **Navigate to the application directory:**
    ```bash
    cd punk-chat
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```
    *(Or `yarn install`)*

4.  **Set up API Keys:**
    *   You'll need API keys from OpenAI and/or Google AI Studio to use the respective models.
    *   Once the application is running (see next step), click on the "API Config" button in the app to enter your keys.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    *(Or `yarn dev`)*

6.  Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal, usually 3000) in your browser to see the application.

## ⚙️ Configuration (In-App)

1.  Once the app is running, click the "API Config" button (previously "Config").
2.  Select your provider (OpenAI or Google).
3.  Enter your API Key.
4.  Click "Fetch Available Models" to populate the model list.
5.  Select your target model from the dropdown.
6.  (Optional) For OpenAI, the Base URL is typically pre-filled but can be adjusted if needed.
7.  Save configuration.



## 🌍 Deployment to GitHub Pages

This project can be deployed as a static site to GitHub Pages.

1.  **Configuration**: The `punk-chat/next.config.js` file has been configured for static export with `output: 'export'`, `basePath: '/PromptPunk'`, and `assetPrefix: '/PromptPunk'`.
2.  **Build**: Navigate to the `punk-chat` directory and run `npm run build`. This will create an `out` folder.
3.  **Deploy**: Push the contents of the `punk-chat/out` folder to the `gh-pages` branch of your `VinsmokeSomya/PromptPunk` repository. You can use the `gh-pages` npm package or a GitHub Action for this.
    *   Example using `gh-pages` package (run from `punk-chat` directory):
        ```bash
        npm install --save-dev gh-pages
        # Add to package.json scripts: "deploy": "gh-pages -d out -t true"
        npm run deploy
        ```
4.  Your site should be available at `https://VinsmokeSomya.github.io/PromptPunk`.

*The "Save Conversation" feature works by generating a file for download in the browser, so it's compatible with static hosting.*

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository (`VinsmokeSomya/PromptPunk`)
2.  Create a feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit changes (`git commit -m 'Add amazing feature'`)
4.  Push to branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

---

Happy Prompting! 🎉

