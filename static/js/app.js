let currentProjects = JSON.parse(localStorage.getItem('user_projects') || '[]');
let activeProjectId = null;
let currentProvider = 'gemini';

// Função utilitária para converter texto em Title Case (Primeiras Letras Maiúsculas)
function toTitleCase(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s|-)\S/g, function(a) {
    return a.toUpperCase();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderProjectsNav();
  loadApiKeysIntoInputs();

  // Gerenciador do formulário de novo projeto
  document.getElementById('formNewProject').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = toTitleCase(document.getElementById('projTitle').value);
    const niche = toTitleCase(document.getElementById('projNiche').value);
    const description = document.getElementById('projDesc').value;

    const newProject = {
      id: Date.now().toString(),
      title,
      description,
      niche,
      results: null,
      createdAt: new Date().toLocaleDateString()
    };

    currentProjects.push(newProject);
    saveProjects();
    renderProjectsNav();
    switchProject(newProject.id);

    document.getElementById('formNewProject').reset();
    bootstrap.Modal.getInstance(document.getElementById('modalNewProject')).hide();
    showToast('Projeto criado com sucesso!', 'success');
  });

  // Guardar chaves de API
  document.getElementById('btnSaveKeys').addEventListener('click', () => {
    const geminiKey = document.getElementById('keyGemini').value;
    const groqKey = document.getElementById('keyGroq').value;
    const openaiKey = document.getElementById('keyOpenAI').value;

    APIManager.saveKey('gemini', geminiKey);
    APIManager.saveKey('groq', groqKey);
    APIManager.saveKey('openai', openaiKey);

    showToast('Chaves de API guardadas com segurança!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('modalApiKeys')).hide();
  });
});

function setProvider(provider) {
  currentProvider = provider;
  showToast(`Provedor alterado para ${provider.toUpperCase()}`, 'info');
}

function showToast(message, type = 'info') {
  const toastEl = document.getElementById('liveToast');
  const toastMsg = document.getElementById('toastMessage');
  
  const icon = type === 'success' ? '<i class="bi bi-check-circle-fill text-success fs-5"></i>' : 
               type === 'warning' ? '<i class="bi bi-exclamation-triangle-fill text-warning fs-5"></i>' :
               '<i class="bi bi-info-circle-fill text-primary fs-5"></i>';

  toastMsg.innerHTML = `${icon} <span>${message}</span>`;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

function saveProjects() {
  localStorage.setItem('user_projects', JSON.stringify(currentProjects));
}

function renderProjectsNav() {
  const container = document.getElementById('projectsTabs');
  container.innerHTML = '';

  if (currentProjects.length === 0) {
    container.innerHTML = `<li class="nav-item"><span class="nav-link disabled text-muted border-0">Nenhum projeto cadastrado</span></li>`;
    return;
  }

  currentProjects.forEach(proj => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.innerHTML = `
      <button class="nav-link ${proj.id === activeProjectId ? 'active' : ''}" onclick="switchProject('${proj.id}')">
        ${toTitleCase(proj.title)}
      </button>
    `;
    container.appendChild(li);
  });
}

function switchProject(id) {
  activeProjectId = id;
  renderProjectsNav();
  const proj = currentProjects.find(p => p.id === id);
  if (!proj) return;

  document.getElementById('projectDetailCard').classList.remove('d-none');
  document.getElementById('displayTitle').innerText = toTitleCase(proj.title);
  document.getElementById('displayNiche').innerText = toTitleCase(proj.niche);
  document.getElementById('displayDesc').innerText = proj.description;

  if (proj.results) {
    renderResults(proj.results);
  } else {
    document.getElementById('resultsContainer').innerHTML = `
      <div class="card custom-card py-5 text-center">
        <div class="card-body">
          <i class="bi bi-search display-5 text-muted mb-3 d-block"></i>
          <p class="text-muted mb-3">Nenhuma pesquisa realizada para este projeto ainda.</p>
          <button class="btn btn-primary-custom" onclick="runAnalysis('${proj.id}')">
            <i class="bi bi-magic me-2"></i> Executar Análise de Soluções
          </button>
        </div>
      </div>
    `;
  }
}

function deleteActiveProject() {
  if (!activeProjectId) return;
  currentProjects = currentProjects.filter(p => p.id !== activeProjectId);
  saveProjects();
  activeProjectId = null;
  document.getElementById('projectDetailCard').classList.add('d-none');
  renderProjectsNav();
  document.getElementById('resultsContainer').innerHTML = `
    <div class="card custom-card py-5 text-center">
      <div class="card-body">
        <p class="text-muted mb-0">Projeto removido. Selecione ou crie outro projeto.</p>
      </div>
    </div>
  `;
  showToast('Projeto removido', 'warning');
}

function loadApiKeysIntoInputs() {
  document.getElementById('keyGemini').value = APIManager.getKey('gemini') || '';
  document.getElementById('keyGroq').value = APIManager.getKey('groq') || '';
  document.getElementById('keyOpenAI').value = APIManager.getKey('openai') || '';
}

async function runAnalysis(projectId) {
  const proj = currentProjects.find(p => p.id === projectId);
  const apiKey = APIManager.getKey(currentProvider);

  if (!apiKey) {
    showToast(`Adicione a sua chave de API para o ${currentProvider.toUpperCase()}`, 'warning');
    new bootstrap.Modal(document.getElementById('modalApiKeys')).show();
    return;
  }

  const container = document.getElementById('resultsContainer');
  container.innerHTML = `
    <div class="card custom-card py-5 text-center">
      <div class="card-body">
        <div class="spinner-border text-primary mb-3" role="status"></div>
        <p class="lead fw-semibold text-white mb-1">Mapeando problemas e oportunidades...</p>
        <p class="text-muted small mb-0">Aguarde enquanto a IA analisa o mercado e gera os métodos.</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({
        title: proj.title,
        description: proj.description,
        niche: proj.niche,
        provider: currentProvider
      })
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Resposta do servidor (${response.status}): ${responseText || 'Sem conteúdo'}`);
    }

    if (!response.ok || data.error) {
      throw new Error(data.error || `Erro HTTP (${response.status})`);
    }

    proj.results = data;
    saveProjects();
    renderResults(data);
    showToast('Análise concluída com sucesso!', 'success');

  } catch (err) {
    container.innerHTML = `
      <div class="card custom-card p-4 border-danger">
        <div class="text-center">
          <i class="bi bi-exclamation-octagon text-danger display-5 mb-2 d-block"></i>
          <h5 class="text-white fw-bold">Erro ao processar</h5>
          <p class="text-muted small">${err.message}</p>
          <button class="btn btn-outline-light btn-sm rounded-3 mt-2" onclick="runAnalysis('${projectId}')">Tentar Novamente</button>
        </div>
      </div>
    `;
  }
}

function renderResults(data) {
  const container = document.getElementById('resultsContainer');
  
  let methodsHtml = (data.methods || []).map(m => `
    <div class="col-md-6 mb-4">
      <div class="card custom-card h-100 p-2">
        <div class="card-body">
          <span class="badge bg-primary rounded-pill mb-3 px-3 py-2">${toTitleCase(m.type)}</span>
          <h4 class="fw-bold text-white mb-3">${toTitleCase(m.title)}</h4>
          <p class="small text-muted mb-2"><strong class="text-light">Como Fazer:</strong> ${m.how_to}</p>
          <p class="small text-muted mb-2"><strong class="text-light">Plataformas:</strong> <code class="text-info">${m.platforms}</code></p>
          <p class="small text-muted mb-2"><strong class="text-light">Por quê:</strong> ${m.why}</p>
          <div class="p-2 rounded-3 mt-3" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2);">
            <p class="small text-warning mb-0"><strong>Melhor Abordagem:</strong> ${m.best_approach}</p>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  let adversitiesHtml = (data.adversities || []).map(a => `
    <div class="p-3 mb-2 rounded-4 custom-card border-0">
      <div class="d-flex align-items-start gap-2 mb-1">
        <i class="bi bi-exclamation-diamond text-danger mt-1"></i>
        <div><strong class="text-white">Obstáculo:</strong> <span class="text-muted">${a.obstacle}</span></div>
      </div>
      <div class="d-flex align-items-start gap-2">
        <i class="bi bi-check-circle text-success mt-1"></i>
        <div><strong class="text-white">Solução:</strong> <span class="text-muted">${a.solution}</span></div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="card custom-card p-4 mb-4" style="background: linear-gradient(135deg, #1e293b, #0f172a);">
      <h4 class="fw-bold text-warning mb-2"><i class="bi bi-lightbulb me-2"></i> Visão Geral das Dores</h4>
      <p class="lead text-light mb-0 fs-6">${data.overview || ''}</p>
    </div>

    <h4 class="fw-bold text-white mb-3"><i class="bi bi-tools me-2 text-primary"></i> Métodos de Solução Recomendados</h4>
    <div class="row mb-4">
      ${methodsHtml}
    </div>

    <h4 class="fw-bold text-white mb-3"><i class="bi bi-shield-exclamation me-2 text-danger"></i> Mapeamento de Riscos e Obstáculos</h4>
    <div class="mb-4">
      ${adversitiesHtml}
    </div>
    
    <div class="text-end">
      <button class="btn btn-outline-secondary rounded-3 btn-sm" onclick="runAnalysis('${activeProjectId}')">
        <i class="bi bi-arrow-clockwise me-1"></i> Atualizar Análise
      </button>
    </div>
  `;
}