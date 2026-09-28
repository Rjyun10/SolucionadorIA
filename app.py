import os
import json
import re
import requests
from flask import Flask, render_template, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='static', template_folder='templates')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/manifest.json')
def manifest():
    return send_from_directory('.', 'manifest.json')

@app.route('/service-worker.js')
def service_worker():
    return send_from_directory('.', 'service-worker.js')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
@app.route('/api/analyze/', methods=['POST', 'OPTIONS'])
def analyze():
    if request.method == 'OPTIONS':
        return '', 200

    data = request.json or {}
    title = data.get('title', '')
    description = data.get('description', '')
    niche = data.get('niche', '')
    provider = data.get('provider', 'gemini')
    api_key = request.headers.get('X-API-Key') or data.get('apiKey')

    if not api_key:
        return jsonify({'error': 'Chave de API não fornecida. Configure no menu de APIs.'}), 400

    search_context = ""
    try:
        ddg_url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(niche + ' ' + title + ' problemas')}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(ddg_url, headers=headers, timeout=5)
        if res.status_code == 200:
            search_context = f"Resultados recentes na web sobre {niche}: {res.text[:1200]}"
    except Exception:
        search_context = "Busca web indisponível no momento."

    prompt = f"""
    Você é um especialista em análise de negócios digitais e arquitetura de soluções.
    
    DADOS DO PROJETO:
    - Título: {title}
    - Descrição: {description}
    - Nicho: {niche}
    - Contexto Web: {search_context}
    
    Retorne EXCLUSIVAMENTE um objeto JSON estruturado com o esquema abaixo. Seja direto, denso e prático:
    {{
      "overview": "Resumo objetivo e profundo (2 a 3 frases) sobre as principais necessidades do público.",
      "methods": [
        {{
          "title": "Nome da Solução",
          "type": "Formato",
          "how_to": "Passos práticos de construção",
          "platforms": "Ferramentas sugeridas",
          "why": "Por que esta solução funciona",
          "best_approach": "Melhor estratégia de produto/conversão"
        }}
      ],
      "adversities": [
        {{
          "obstacle": "Obstáculo/Desafio",
          "solution": "Como superar com plano de ação"
        }}
      ]
    }}
    Forneça exatamente 2 itens no array 'methods' e 2 itens no array 'adversities'.
    """

    try:
        raw_text = ""
        
        if provider == 'gemini':
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "maxOutputTokens": 2000
                }
            }
            res = requests.post(url, json=payload, timeout=30)
            if res.status_code != 200:
                return jsonify({'error': f'Erro na API Gemini: {res.text}'}), res.status_code
            
            raw_text = res.json()['candidates'][0]['content']['parts'][0]['text']

        elif provider in ['groq', 'openai']:
            endpoint = "https://api.groq.com/openai/v1/chat/completions" if provider == 'groq' else "https://api.openai.com/v1/chat/completions"
            
            # Utiliza o modelo autorizado na sua conta Groq
            model = "qwen/qwen3.8-27b" if provider == 'groq' else "gpt-4o-mini"
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": "Você é um consultor de negócios. Responda estritamente em JSON válido e conciso."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "response_format": {"type": "json_object"},
                "max_tokens": 1200
            }
            res = requests.post(endpoint, headers=headers, json=payload, timeout=30)
            if res.status_code != 200:
                return jsonify({'error': f'Erro na API {provider.upper()}: {res.text}'}), res.status_code
                
            raw_text = res.json()['choices'][0]['message']['content']

        else:
            return jsonify({'error': 'Provedor de API não suportado.'}), 400

        cleaned_text = re.sub(r'```json\s*|\s*```', '', raw_text).strip()
        response_json = json.loads(cleaned_text)

        return jsonify(response_json)

    except Exception as e:
        return jsonify({'error': f'Falha no processamento: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)