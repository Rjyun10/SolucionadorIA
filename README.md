# 🚀 Plataforma de Inteligência de Mercado e Análise de Nicho

Uma aplicação Web progressiva (PWA) desenvolvida em **Flask (Python)** que utiliza modelos avançados de Inteligência Artificial para realizar pesquisas de mercado em tempo real, identificar dores do público e gerar estratégias de produtos digitais (SaaS, Infoprodutos, Ferramentas) de forma automatizada.

---

## 🌟 Funcionalidades

- **Análise Inteligente de Nicho:** Avaliação profunda de oportunidades e desafios de mercado com base no título, descrição e nicho fornecidos.
- **Integração Multi-Provedores de IA:**
  - **Groq API** (suporte otimizado para o modelo `qwen/qwen3.8-27b`).
  - **Google Gemini API** (`gemini-1.5-flash`).
  - **OpenAI API** (`gpt-4o-mini`).
- **Enriquecimento em Tempo Real:** Pesquisa integrada via DuckDuckGo para injetar contexto recente sobre o mercado no prompt do modelo.
- **Suporte a PWA (Progressive Web App):** Pode ser instalado em dispositivos móveis e desktops como um aplicativo nativo.
- **Interface Otimizada:** Design responsivo e moderno com suporte a temas e ícone personalizado (`favicon`).

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Python 3, Flask, Requests.
- **Frontend:** HTML5, CSS3, JavaScript (Fetch API, PWA Service Worker).
- **Processamento de IA:** Groq SDK / API REST, Google Generative AI, OpenAI API.
- **Geração de Ícones:** Pillow (PIL).