// admin.js - Lógica da área administrativa

// Configuração do Firebase agora está em firebaseConfig.js (adicione <script src="firebaseConfig.js"></script> antes deste script)
firebase.initializeApp(window.firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const adminUid = "XnmSXFBdiYMsnpdwyWjfH3xYBg52";

let roteiros = [];
let editando = null;
let passeiosCount = 1;
let usuarioId = null;

function showApp() {
    document.getElementById('entradaAnimacao').style.display = 'flex';
    document.getElementById('appBox').style.display = 'none';
    setTimeout(() => {
        document.getElementById('entradaAnimacao').style.opacity = 1;
    }, 100);
    setTimeout(() => {
        document.getElementById('entradaAnimacao').style.opacity = 0;
        setTimeout(() => {
            document.getElementById('entradaAnimacao').style.display = 'none';
            document.getElementById('appBox').style.display = 'block';
            const publicBtn = document.getElementById('publicPageBtn');
            if (publicBtn) {
                publicBtn.onclick = function () {
                    window.open('roteiros_publicos.html', '_blank');
                };
            }
        }, 900);
    }, 2600);
}
function renderRoteiros() {
    const container = document.getElementById('roteiro');
    container.innerHTML = '';
    let totalGeral = 0;
    roteiros.forEach((roteiro, idx) => {
        let html = `<div class='dia' data-idx='${idx}'>`;
        html += `<h3>${roteiro.cidade} - ${roteiro.data}</h3><ul>`;
        roteiro.passeios.forEach(p => {
            html += `<li>Passeio: <strong>${p.nome}</strong>`;
            if (p.link) {
                html += ` <a href='${p.link}' target='_blank' style='color:#1976d2;font-size:0.95em;'>(link)</a>`;
            }
            html += ` - R$ ${p.custo.toFixed(2)}</li>`;
        });
        html += `<li><strong>Total dos passeios:</strong> R$ ${roteiro.totalPasseios.toFixed(2)}</li>`;
        let totalDia = roteiro.totalPasseios;
        if (roteiro.combustivel && roteiro.combustivel > 0) {
            html += `<li><strong>Combustível:</strong> R$ ${roteiro.combustivel.toFixed(2)}</li>`;
            totalDia += roteiro.combustivel;
        }
        if (roteiro.hospedagem) {
            html += `<li>Hospedagem: <strong>${roteiro.hospedagem.hotel}</strong>`;
            if (roteiro.hospedagem.link) {
                html += ` <a href='${roteiro.hospedagem.link}' target='_blank' style='color:#1976d2;font-size:0.95em;'>(link)</a>`;
            }
            html += ` - Diária: R$ ${roteiro.hospedagem.diaria.toFixed(2)} | Café incluso: ${roteiro.hospedagem.cafe} | Total hospedagem: R$ ${roteiro.hospedagem.total.toFixed(2)}</li>`;
            totalDia += roteiro.hospedagem.total;
        }
        if (typeof roteiro.alimentacao !== 'undefined' && roteiro.alimentacao > 0) {
            html += `<li><strong>Alimentação:</strong> R$ ${roteiro.alimentacao.toFixed(2)}</li>`;
            totalDia += roteiro.alimentacao;
        }
        html += `<li style='color:#1a3c5d;'><strong>Total do passeio:</strong> R$ ${totalDia.toFixed(2)}</li>`;
        html += `</ul><div style='text-align:right; margin-top:10px;'>`;
        html += `<a href='admin_edit.html?idx=${idx}' style='background:#ffd54f; color:#333; border:none; border-radius:4px; padding:7px 14px; margin-right:8px; cursor:pointer; text-decoration:none; display:inline-block;'>Editar</a>`;
        html += `<button type='button' onclick='apagarRoteiro(${idx})' style='background:#e57373; color:#fff; border:none; border-radius:4px; padding:7px 14px; cursor:pointer;'>Apagar</button>`;
        html += `</div></div>`;
        container.innerHTML += html;
        totalGeral += totalDia;
    });
    if (roteiros.length > 0) {
        container.innerHTML += `<div style='background:#e0eafc;padding:18px 24px;border-radius:12px;margin-top:18px;font-size:1.2em;color:#1a3c5d;text-align:right;'><strong>Total geral das despesas:</strong> R$ ${totalGeral.toFixed(2)}</div>`;
    }
}
function carregarRoteirosNuvem() {
    db.collection('roteiros').doc(adminUid).onSnapshot((doc) => {
        let novosRoteiros = [];
        if (doc.exists) {
            novosRoteiros = doc.data().roteiros || [];
        }
        roteiros = novosRoteiros;
        renderRoteiros();
    });
}
function salvarRoteirosNuvem() {
    db.collection('roteiros').doc(adminUid).set({ roteiros });
}
function adicionarPasseio() {
    passeiosCount++;
    const area = document.getElementById('passeiosArea');
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.alignItems = 'flex-end';
    div.innerHTML = `
        <label style="flex:2;">Passeio:<br><input type="text" class="passeio-nome" required></label>
        <label style="flex:2;">Link do passeio:<br><input type="url" class="passeio-link" placeholder="https://..."></label>
        <label style="flex:1;">Custo (R$):<br><input type="number" class="passeio-custo" min="0" step="0.01" required></label>
        <button type="button" onclick="this.parentElement.remove()" style="background:#e57373; color:#fff; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:1.2em; margin-bottom:6px; margin-left:4px; cursor:pointer;" title="Remover passeio">&times;</button>
    `;
    area.appendChild(div);
}
function toggleHospedagem() {
    const select = document.getElementById('hospedar');
    document.getElementById('hospedagemArea').style.display = (select.value === 'true') ? 'block' : 'none';
}
function apagarRoteiro(idx) {
    roteiros.splice(idx, 1);
    renderRoteiros();
    salvarRoteirosNuvem();
}
function editarRoteiro(idx) {
    // Preenche o formulário com os dados do roteiro selecionado para edição
    const r = roteiros[idx];
    document.getElementById('cidade').value = r.cidade;
    document.getElementById('data').value = r.data;
    document.getElementById('combustivel').value = r.combustivel || '';
    document.getElementById('alimentacao').value = r.alimentacao || '';
    document.getElementById('hospedar').value = r.hospedagem ? 'true' : 'false';
    toggleHospedagem();
    if (r.hospedagem) {
        document.getElementById('hotel').value = r.hospedagem.hotel || '';
        document.getElementById('hotelLink').value = r.hospedagem.link || '';
        document.getElementById('diaria').value = r.hospedagem.diaria || '';
        document.getElementById('cafe').value = r.hospedagem.cafe || 'Sim';
        document.getElementById('totalHospedagem').value = r.hospedagem.total || '';
    } else {
        document.getElementById('hotel').value = '';
        document.getElementById('hotelLink').value = '';
        document.getElementById('diaria').value = '';
        document.getElementById('cafe').value = 'Sim';
        document.getElementById('totalHospedagem').value = '';
    }
    // Passeios
    const passeiosArea = document.getElementById('passeiosArea');
    passeiosArea.innerHTML = '';
    r.passeios.forEach(p => {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.alignItems = 'flex-end';
        div.innerHTML = `
            <label style="flex:2;">Passeio:<br><input type="text" class="passeio-nome" required value="${p.nome}"></label>
            <label style="flex:2;">Link do passeio:<br><input type="url" class="passeio-link" placeholder="https://..." value="${p.link ? p.link : ''}"></label>
            <label style="flex:1;">Custo (R$):<br><input type="number" class="passeio-custo" min="0" step="0.01" required value="${p.custo}"></label>
            <button type="button" onclick="this.parentElement.remove()" style="background:#e57373; color:#fff; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:1.2em; margin-bottom:6px; margin-left:4px; cursor:pointer;" title="Remover passeio">&times;</button>
        `;
        passeiosArea.appendChild(div);
    });
    editando = idx;
    document.getElementById('btnAdicionarRoteiro').style.display = 'none';
    document.getElementById('btnAtualizarRoteiro').style.display = 'inline-block';
}
document.getElementById('logoutBtn').onclick = function () {
    auth.signOut().then(() => {
        window.location.href = 'roteiro_ferias.html';
    });
};
// Autenticação: só permite admin
const emailAdmin = "marcelo.salmeron@om30.com.br";
auth.onAuthStateChanged(function (user) {
    if (!user || user.email.toLowerCase() !== emailAdmin) {
        window.location.href = 'roteiro_ferias.html';
        return;
    }
    showApp();
    carregarRoteirosNuvem();
});
// Formulário de adicionar roteiro

// Lógica para salvar roteiro (adicionar ou editar)

function limparFormularioRoteiro() {
    document.getElementById('formRoteiro').reset();
    document.getElementById('passeiosArea').innerHTML = `
        <label>Passeio:<br>
            <input type="text" class="passeio-nome" required style="width:100%;max-width:320px;padding:10px 12px;border:1.5px solid #b2dfdb;border-radius:6px;font-size:1em;background:#f7fafd;box-sizing:border-box;">
        </label>
        <label>Link do passeio:<br>
            <input type="url" class="passeio-link" placeholder="https://..." style="width:100%;max-width:320px;padding:10px 12px;border:1.5px solid #b2dfdb;border-radius:6px;font-size:1em;background:#f7fafd;box-sizing:border-box;">
        </label>
        <label> Custo (R$):
            <input type="number" class="passeio-custo" min="0" step="0.01" required style="width:100%;max-width:320px;padding:10px 12px;border:1.5px solid #b2dfdb;border-radius:6px;font-size:1em;background:#f7fafd;box-sizing:border-box;">
        </label>
    `;
    document.getElementById('btnAdicionarRoteiro').style.display = 'inline-block';
    document.getElementById('btnAtualizarRoteiro').style.display = 'none';
    editando = null;
}

document.getElementById('formRoteiro').onsubmit = function (e) {
    e.preventDefault();
    if (editando !== null) return false; // Não permite submit padrão se está editando
    salvarOuAtualizarRoteiro();
    return false;
};

document.getElementById('btnAtualizarRoteiro').onclick = function () {
    salvarOuAtualizarRoteiro();
};

function salvarOuAtualizarRoteiro() {
    // Coleta dados do formulário
    const cidade = document.getElementById('cidade').value;
    const data = document.getElementById('data').value;
    const combustivel = parseFloat(document.getElementById('combustivel').value) || 0;
    const alimentacao = parseFloat(document.getElementById('alimentacao').value) || 0;
    // Passeios
    const passeioNomes = document.querySelectorAll('.passeio-nome');
    const passeioCustos = document.querySelectorAll('.passeio-custo');
    const passeioLinks = document.querySelectorAll('.passeio-link');
    let passeios = [];
    let totalPasseios = 0;
    for (let i = 0; i < passeioNomes.length; i++) {
        const nome = passeioNomes[i].value;
        const custo = parseFloat(passeioCustos[i].value) || 0;
        const link = passeioLinks[i].value ? passeioLinks[i].value : '';
        passeios.push({ nome, custo, link });
        totalPasseios += custo;
    }
    // Hospedagem
    let hospedagem = null;
    if (document.getElementById('hospedar').value === 'true') {
        hospedagem = {
            hotel: document.getElementById('hotel').value,
            link: document.getElementById('hotelLink').value,
            diaria: parseFloat(document.getElementById('diaria').value) || 0,
            cafe: document.getElementById('cafe').value,
            total: parseFloat(document.getElementById('totalHospedagem').value) || 0
        };
    }
    const roteiro = {
        cidade,
        data,
        combustivel,
        alimentacao,
        passeios,
        totalPasseios,
        hospedagem
    };
    if (editando !== null) {
        roteiros[editando] = roteiro;
    } else {
        roteiros.push(roteiro);
    }
    renderRoteiros();
    salvarRoteirosNuvem();
    limparFormularioRoteiro();
}

// Limpar formulário ao carregar página
window.addEventListener('DOMContentLoaded', limparFormularioRoteiro);
