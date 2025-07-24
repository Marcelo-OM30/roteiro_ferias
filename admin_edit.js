// admin_edit.js - Edição de roteiro individual

// Firebase config igual ao admin.js
// Configuração do Firebase agora está em firebaseConfig.js (adicione <script src="firebaseConfig.js"></script> antes deste script)
firebase.initializeApp(window.firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const adminUid = "XnmSXFBdiYMsnpdwyWjfH3xYBg52";

let roteiroIdx = null;
let roteiros = [];

function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

function carregarRoteiroParaEdicao() {
    roteiroIdx = parseInt(getQueryParam('idx'));
    if (isNaN(roteiroIdx)) {
        alert('Roteiro inválido.');
        window.location.href = 'admin.html';
        return;
    }
    db.collection('roteiros').doc(adminUid).get().then(doc => {
        if (!doc.exists || !doc.data().roteiros || !doc.data().roteiros[roteiroIdx]) {
            alert('Roteiro não encontrado.');
            window.location.href = 'admin.html';
            return;
        }
        roteiros = doc.data().roteiros;
        preencherFormulario(roteiros[roteiroIdx]);
    });
}

function preencherFormulario(r) {
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
}

function toggleHospedagem() {
    const select = document.getElementById('hospedar');
    document.getElementById('hospedagemArea').style.display = (select.value === 'true') ? 'block' : 'none';
}

document.getElementById('hospedar').onchange = toggleHospedagem;
document.getElementById('btnAddPasseio').onclick = function () {
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
};

document.getElementById('btnCancelar').onclick = function () {
    window.location.href = 'admin.html';
};

document.getElementById('formEditRoteiro').onsubmit = function (e) {
    e.preventDefault();
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
    roteiros[roteiroIdx] = roteiro;
    db.collection('roteiros').doc(adminUid).set({ roteiros }).then(() => {
        window.location.href = 'admin.html';
    });
};

auth.onAuthStateChanged(function (user) {
    if (!user || user.email.toLowerCase() !== 'marcelo.salmeron@om30.com.br') {
        window.location.href = 'roteiro_ferias.html';
        return;
    }
    carregarRoteiroParaEdicao();
});
