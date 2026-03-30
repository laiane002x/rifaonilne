const API_URL = 'https://script.google.com/macros/s/AKfycbzd-6wroxc4ZZHJUakN_780wF6TdA0n6ojSnsY7FDrJnai9pf3NfU1ezyzaiccvTlUx/exec';
const TOTAL_NUMBERS = 1000;

// Estrutura: { numero: { status, comprador, vendedor } }
let numbersData = {};

const grid = document.getElementById('numbers-grid');
const modalOverlay = document.getElementById('info-modal');
const closeModalBtn = document.getElementById('close-modal');

// Inicializa o app
async function init() {
    await fetchNumbers();
    renderGrid();
}

// Processa os dados da planilha
function processSheetData(data) {
    numbersData = {};

    // Estrutura da planilha:
    // Coluna A (índice 0): Número
    // Coluna B (índice 1): Situação ("Comprado" / "Reservado")
    // Coluna C (índice 2): Comprador
    // Coluna D (índice 3): Turma / filiação
    // Coluna E (índice 4): Contato
    // Coluna F (índice 5): Vendedor
    data.forEach((row) => {
        const numVal = parseInt(row[0]);
        if (!isNaN(numVal) && numVal > 0 && numVal <= TOTAL_NUMBERS) {
            const situacao = row[1] ? row[1].toString().trim().toLowerCase() : '';
            const comprador = row[2] ? row[2].toString().trim() : '';
            const vendedor = row[5] ? row[5].toString().trim() : '';

            let status = 'disponivel';
            if (situacao === 'comprado') status = 'ocupado';
            else if (situacao === 'reservado') status = 'reservado';

            numbersData[numVal] = { status, comprador, vendedor };
        }
    });
}

// Busca os dados da API (com fallback via proxy CORS)
async function fetchNumbers() {
    const PROXY = 'https://api.allorigins.win/get?url=' + encodeURIComponent(API_URL);

    try {
        let data = null;

        // Tentativa 1: fetch direto
        try {
            const resp = await fetch(API_URL, { redirect: 'follow' });
            const text = await resp.text();
            data = JSON.parse(text);
        } catch (_) {}

        // Tentativa 2: proxy CORS
        if (!data || !Array.isArray(data)) {
            const proxyResp = await fetch(PROXY);
            const proxyJson = await proxyResp.json();
            data = JSON.parse(proxyJson.contents);
        }

        if (Array.isArray(data)) {
            processSheetData(data);
        }
    } catch (error) {
        grid.innerHTML = '<div class="loading" style="color: #EF4444;">Erro ao carregar os números. Recarregue a página.</div>';
    }
}

// Renderiza a grade de números — todos são clicáveis
function renderGrid() {
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    for (let i = 1; i <= TOTAL_NUMBERS; i++) {
        const btn = document.createElement('button');
        btn.className = 'number-btn';
        btn.textContent = i;

        const info = numbersData[i] || { status: 'disponivel', comprador: '', vendedor: '' };

        if (info.status === 'ocupado') {
            btn.classList.add('occupied');
        } else if (info.status === 'reservado') {
            btn.classList.add('reserved');
        } else {
            btn.classList.add('available');
        }

        btn.addEventListener('click', () => openModal(i, info));
        fragment.appendChild(btn);
    }

    grid.appendChild(fragment);
}

// Abre o modal com informações do número
function openModal(number, info) {
    document.getElementById('modal-number').textContent = `#${number}`;

    const statusEl = document.getElementById('modal-status');
    const statusMap = {
        ocupado:    { label: 'Comprado',   cls: 'badge-occupied' },
        reservado:  { label: 'Reservado',  cls: 'badge-reserved' },
        disponivel: { label: 'Disponível', cls: 'badge-available' },
    };
    const s = statusMap[info.status] || statusMap.disponivel;
    statusEl.textContent = s.label;
    statusEl.className = 'modal-badge ' + s.cls;

    const compradorRow = document.getElementById('row-comprador');
    const vendedorRow  = document.getElementById('row-vendedor');
    const emptyRow     = document.getElementById('row-empty');
    const compradorVal = document.getElementById('modal-comprador');
    const vendedorVal  = document.getElementById('modal-vendedor');

    if (info.comprador) {
        compradorVal.textContent = info.comprador;
        compradorRow.style.display = 'flex';
    } else {
        compradorRow.style.display = 'none';
    }

    if (info.vendedor) {
        vendedorVal.textContent = info.vendedor;
        vendedorRow.style.display = 'flex';
    } else {
        vendedorRow.style.display = 'none';
    }

    // Mostra mensagem de "disponível" somente se não houver nenhuma info
    const hasInfo = info.comprador || info.vendedor;
    emptyRow.style.display = hasInfo ? 'none' : 'block';

    modalOverlay.classList.add('active');
}

// Fecha o modal
function closeModal() {
    modalOverlay.classList.remove('active');
}

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

init();
