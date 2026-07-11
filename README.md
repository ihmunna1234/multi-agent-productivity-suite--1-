<div align="center">
  <div style="background-color: #1e1e1e; padding: 20px; border-radius: 12px; display: inline-block; margin-bottom: 20px;">
    <h1 style="color: #ffffff; margin: 0; font-size: 2.5em;">🧠 Injamus's AI Workspace</h1>
    <p style="color: #a0a0a0; font-size: 1.2em; margin-top: 10px;">A Comprehensive Multi-Agent Productivity Suite</p>
  </div>
</div>

Welcome to **Injamus's AI Workspace**, a powerful, local-first web application designed to automate your workflow. This suite brings together cutting-edge AI processing and robust document utilities into a single, seamless, SEO-optimized React application.

---

## ✨ Features

### 📄 Document & PDF Utilities
*   **PDF to Image (Slicer):** Instantly slice multi-page PDFs into high-quality JPEGs/PNGs.
*   **Image to PDF (Binder):** Combine scattered images and receipts into optimized PDF documents.
*   **PDF to Word:** Deconstruct and convert PDFs into editable Word documents.
*   **Merge & Split:** Combine multiple PDFs into one, or extract specific pages.
*   **Organize PDF:** Rearrange, rotate, and manage pages visually.
*   **Watermark Remover:** Erase stamps, overlays, and background artifacts using smart filtering.

### 🤖 AI Systems & Extractors
*   **Iqama & ID Extractor (AI OCR):** Surgically extract structured names, DOBs, and ID numbers from official identity documents using multimodal AI.
*   **Product Trend Scout:** Analyze current e-commerce trends, generate wholesale cost estimates, and discover supplier leads.
*   **AI Resume Studio:** Build professional, layout-perfect resumes tailored to specific roles.
*   **G-Maps Lead Extractor:** Compile business coordinates, phone numbers, and listings directly from map data.

### 🚀 Technical Highlights
*   **Full SEO & AEO Optimization:** Built-in dynamic routing via `react-router-dom`, dynamic meta tags via `react-helmet-async`, and auto-generated `sitemap.xml`.
*   **Secure Client Sandboxing:** Document processing happens entirely in-memory—your data never leaves your device unless explicitly sent to the AI backend.
*   **Responsive & Dynamic Theming:** Beautiful UI powered by Tailwind CSS with smooth Light, Dark, and Night mode toggles.

---

## 🛠️ Built With

*   [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [React Router](https://reactrouter.com/) & [React Helmet Async](https://github.com/staylor/react-helmet-async)
*   [Lucide React](https://lucide.dev/) (Icons)
*   Express / Node.js Backend (for AI integration)

---

## 💻 Getting Started (Local Development)

Follow these steps to run the application on your local machine.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation

1.  **Clone the repository** (if you haven't already).
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    *   Rename `.env.example` to `.env` (or create a new `.env` file).
    *   Add your OpenAI API key (which is used to power the intelligent features like OCR and the Product Scout):
        ```env
        OPENAI_API_KEY="your_api_key_here"
        ```
4.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
5.  **Open your browser:**
    Navigate to `http://localhost:3000` to start using the workspace.

---

## 🌐 Production Build

To compile the application for production deployment (e.g., Vercel, Netlify):

```bash
npm run build
```
This will bundle your React app and compile your Node.js backend (`server.ts`) into a standalone `dist/server.cjs` file.

---

## 🔒 Security Notice

> [!WARNING]
> If any API keys, credentials, or tokens were previously hardcoded in the codebase, they remain visible in the repository's git history. You must **rotate all previously hardcoded keys/secrets immediately** to prevent unauthorized access. Always define sensitive variables inside the `.env` file (which is git-ignored) and never commit secrets to source control.

---
*Built with precision to enhance productivity.*

