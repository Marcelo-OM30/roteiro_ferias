// JavaScript separado do HTML para roteiro de férias

// COLE SUA CONFIGURAÇÃO DO FIREBASE ABAIXO
const firebaseConfig = {
    apiKey: "AIzaSyA-NYMCu5zgqLfskoi6Z-oDozt6By4o2bQ",
    authDomain: "roteiroferias-7c8b2.firebaseapp.com",
    projectId: "roteiroferias-7c8b2",
    storageBucket: "roteiroferias-7c8b2.appspot.com",
    messagingSenderId: "615965018645",
    appId: "1:615965018645:web:3dfcca31b9036a85aadc1c",
    measurementId: "G-R6Z9TC2GM8"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
// ID do usuário admin (deve ser igual ao usado na página pública)
const adminUid = "XnmSXFBdiYMsnpdwyWjfH3xYBg52";

let roteiros = [];
let editando = null;
let passeiosCount = 1;
let usuarioId = null;

function showLogin() {
    document.getElementById('loginBox').style.display = 'block';
    document.getElementById('appBox').style.display = 'none';
    const params = new URLSearchParams(window.location.search);
    if (params.get('cadastro') === 'secreto') {
        document.getElementById('registerArea').style.display = 'block';
    } else {
        document.getElementById('registerArea').style.display = 'none';
    }
}
function showApp() {
    document.getElementById('loginBox').style.display = 'none';
    const anim = document.getElementById('entradaAnimacao');
    anim.style.display = 'flex';
    anim.style.opacity = 0;
    setTimeout(() => {
        anim.style.transition = 'opacity 1.2s';
        anim.style.opacity = 1;
    }, 100);
    setTimeout(() => {
        anim.style.opacity = 0;
        setTimeout(() => {
            anim.style.display = 'none';
            document.getElementById('appBox').style.display = 'block';
            // Adiciona evento ao botão de página pública
            const publicBtn = document.getElementById('publicPageBtn');
            if (publicBtn) {
                publicBtn.onclick = function () {
                    window.open('roteiros_publicos.html', '_blank');
                };
            }
        }, 900);
    }, 2600);
}
document.getElementById('loginForm').onsubmit = async function (e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    try {
        await auth.signInWithEmailAndPassword(email, senha);
    } catch (err) {
        document.getElementById('loginMsg').innerText = 'Login inválido.';
    }
};
document.getElementById('registerForm').onsubmit = async function (e) {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const senha = document.getElementById('registerSenha').value;
    try {
        await auth.createUserWithEmailAndPassword(email, senha);
        document.getElementById('loginMsg').innerText = 'Cadastro realizado! Faça login.';
    } catch (err) {
        document.getElementById('loginMsg').innerText = 'Erro ao cadastrar.';
    }
};
document.getElementById('logoutBtn').onclick = function () {
    auth.signOut();
};
auth.onAuthStateChanged(async function (user) {
    if (user) {
        // Só permite acesso ao admin, outros são redirecionados para a página pública
        const emailAdmin = "marcelo.salmeron@om30.com.br"; // Substitua pelo seu e-mail
        if (user.email !== emailAdmin) {
            window.location.href = "roteiros_publicos.html";
            return;
        }
        usuarioId = adminUid; // Sempre usa o adminUid para salvar/ler roteiros
        showApp();
        await carregarRoteirosNuvem();
    } else {
        if (usuarioId !== null) {
            usuarioId = null;
            roteiros = [];
            renderRoteiros();
        }
        showLogin();
    }
});
// Redireciona admin para admin.html após login
// Listener ÚNICO de autenticação: redireciona admin, mostra app só para não-admins
auth.onAuthStateChanged(async function (user) {
    if (!user) {
        showLogin();
        return;
    }
    const emailAdmin = "marcelo.salmeron@om30.com.br";
    if (user.email && user.email.toLowerCase() === emailAdmin) {
        window.location.href = "admin.html";
        return;
    }
    // Usuário não-admin: pode acessar normalmente (exemplo: público, se quiser)
    usuarioId = null;
    roteiros = [];
    renderRoteiros();
    showLogin(); // Ou pode mostrar uma mensagem de acesso negado, se preferir
});

async function salvarRoteirosNuvem() {
    if (!usuarioId) return;
    // Sempre salva no documento do adminUid para garantir consistência com a página pública
    await db.collection('roteiros').doc(adminUid).set({ roteiros });
}
async function carregarRoteirosNuvem() {
    if (!usuarioId) return;
    // Listener em tempo real para o documento do adminUid
    db.collection('roteiros').doc(adminUid).onSnapshot((doc) => {
        let novosRoteiros = [];
        if (doc.exists) {
            novosRoteiros = doc.data().roteiros || [];
        }
        // Sempre sincroniza o array local com o banco
        roteiros = novosRoteiros;
        renderRoteiros();
    });
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
        <label style="flex:1;">Custo (R$):<br><input type="number" class="passeio-custo" min="0" step="0.01" required></label>
        <button type="button" onclick="this.parentElement.remove()" style="background:#e57373; color:#fff; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:1.2em; margin-bottom:6px; margin-left:4px; cursor:pointer;" title="Remover passeio">&times;</button>
    `;
    area.appendChild(div);
}
function toggleHospedagem() {
    const select = document.getElementById('hospedar');
    document.getElementById('hospedagemArea').style.display = (select.value === 'true') ? 'block' : 'none';
}
function renderRoteiros() {
    const container = document.getElementById('roteiro');
    container.innerHTML = '';
    let totalGeral = 0;
    roteiros.forEach((roteiro, idx) => {
        let html = `<div class='dia' data-idx='${idx}'>`;
        html += `<h3>${roteiro.cidade} - ${roteiro.data}</h3><ul>`;
        roteiro.passeios.forEach(p => {
            html += `<li>Passeio: <strong>${p.nome}</strong> - R$ ${p.custo.toFixed(2)}</li>`;
        });
        html += `<li><strong>Total dos passeios:</strong> R$ ${roteiro.totalPasseios.toFixed(2)}</li>`;
        let totalDia = roteiro.totalPasseios;
        if (roteiro.combustivel && roteiro.combustivel > 0) {
            html += `<li><strong>Combustível:</strong> R$ ${roteiro.combustivel.toFixed(2)}</li>`;
            totalDia += roteiro.combustivel;
        }
        if (roteiro.hospedagem) {
            html += `<li>Hospedagem: <strong>${roteiro.hospedagem.hotel}</strong> - Diária: R$ ${roteiro.hospedagem.diaria.toFixed(2)} | Café incluso: ${roteiro.hospedagem.cafe} | Total hospedagem: R$ ${roteiro.hospedagem.total.toFixed(2)}</li>`;
            totalDia += roteiro.hospedagem.total;
        }
        if (typeof roteiro.alimentacao !== 'undefined' && roteiro.alimentacao > 0) {
            html += `<li><strong>Alimentação:</strong> R$ ${roteiro.alimentacao.toFixed(2)}</li>`;
            totalDia += roteiro.alimentacao;
        }
        html += `<li style='color:#1a3c5d;'><strong>Total do passeio:</strong> R$ ${totalDia.toFixed(2)}</li>`;
        html += `</ul><div style='text-align:right; margin-top:10px;'>`;
        html += `<button type='button' onclick='editarRoteiro(${idx})' style='background:#ffd54f; color:#333; border:none; border-radius:4px; padding:7px 14px; margin-right:8px; cursor:pointer;'>Editar</button>`;
        html += `<button type='button' onclick='apagarRoteiro(${idx})' style='background:#e57373; color:#fff; border:none; border-radius:4px; padding:7px 14px; cursor:pointer;'>Apagar</button>`;
        html += `</div></div>`;
        container.innerHTML += html;
        totalGeral += totalDia;
    });
    if (roteiros.length > 0) {
        container.innerHTML += `<div style='background:#e0eafc;padding:18px 24px;border-radius:12px;margin-top:18px;font-size:1.2em;color:#1a3c5d;text-align:right;'><strong>Total geral das despesas:</strong> R$ ${totalGeral.toFixed(2)}</div>`;
    }
}
function apagarRoteiro(idx) {
    roteiros.splice(idx, 1);
    renderRoteiros();
    salvarRoteirosNuvem();
}
function editarRoteiro(idx) {
    const r = roteiros[idx];
    // Salva identificador único para edição (data+cidade)
    editando = { data: r.data, cidade: r.cidade };
    document.getElementById('cidade').value = r.cidade;
    document.getElementById('data').value = r.data;
    document.getElementById('combustivel').value = r.combustivel !== undefined ? r.combustivel : '';
    document.getElementById('alimentacao').value = r.alimentacao !== undefined ? r.alimentacao : '';
    document.getElementById('hospedar').value = r.hospedagem ? 'true' : 'false';
    toggleHospedagem();
    if (r.hospedagem) {
        document.getElementById('hotel').value = r.hospedagem.hotel;
        document.getElementById('diaria').value = r.hospedagem.diaria;
        document.getElementById('cafe').value = r.hospedagem.cafe;
        document.getElementById('totalHospedagem').value = r.hospedagem.total;
    } else {
        document.getElementById('hotel').value = '';
        document.getElementById('diaria').value = '';
        document.getElementById('cafe').value = 'Sim';
        document.getElementById('totalHospedagem').value = '';
    }
    // Limpa todos os campos de passeios
    const area = document.getElementById('passeiosArea');
    while (area.children.length > 2) area.removeChild(area.lastChild);
    const firstNome = area.querySelector('.passeio-nome');
    const firstCusto = area.querySelector('.passeio-custo');
    // Preenche os campos de passeios existentes
    if (r.passeios && r.passeios.length > 0) {
        for (let i = 0; i < r.passeios.length; i++) {
            if (i === 0) {
                if (firstNome) firstNome.value = r.passeios[0].nome;
                if (firstCusto) firstCusto.value = r.passeios[0].custo;
            } else {
                // Adiciona campos extras se houver mais passeios
                const div = document.createElement('div');
                div.style.display = 'flex';
                div.style.gap = '10px';
                div.style.alignItems = 'flex-end';
                div.innerHTML = `
                    <label style="flex:2;">Passeio:<br><input type="text" class="passeio-nome" required></label>
                    <label style="flex:1;">Custo (R$):<br><input type="number" class="passeio-custo" min="0" step="0.01" required></label>
                    <button type="button" onclick="this.parentElement.remove()" style="background:#e57373; color:#fff; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:1.2em; margin-bottom:6px; margin-left:4px; cursor:pointer;" title="Remover passeio">&times;</button>
                `;
                area.appendChild(div);
                const nomes = area.querySelectorAll('.passeio-nome');
                const custos = area.querySelectorAll('.passeio-custo');
                nomes[i].value = r.passeios[i].nome;
                custos[i].value = r.passeios[i].custo;
            }
        }
    } else {
        if (firstNome) firstNome.value = '';
        if (firstCusto) firstCusto.value = '';
    }
    // Mostra botão de adicionar passeio se estiver editando
    let btn = document.getElementById('btnAddPasseioEdicao');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'btnAddPasseioEdicao';
        btn.type = 'button';
        btn.innerText = 'Adicionar passeio ao roteiro';
        btn.style = 'background:#26a69a;color:#fff;border:none;border-radius:6px;padding:10px 0;font-size:1em;font-weight:600;width:100%;margin-bottom:8px;cursor:pointer;transition:background 0.2s;';
        btn.onclick = adicionarPasseioAoRoteiro;
        area.parentNode.insertBefore(btn, area.nextSibling);
    }
    btn.style.display = 'block';

    // Esconde o botão de submit padrão e mostra o botão de atualizar
    let btnSubmit = document.querySelector('#formRoteiro button[type="submit"]');
    if (btnSubmit) btnSubmit.style.display = 'none';
    let btnAtualizar = document.getElementById('btnAtualizarRoteiro');
    if (!btnAtualizar) {
        btnAtualizar = document.createElement('button');
        btnAtualizar.id = 'btnAtualizarRoteiro';
        btnAtualizar.type = 'button';
        btnAtualizar.innerText = 'Atualizar roteiro';
        btnAtualizar.style = 'background:#ffd54f;color:#333;border:none;border-radius:6px;padding:10px 0;font-size:1em;font-weight:600;width:100%;margin-bottom:8px;cursor:pointer;transition:background 0.2s;';
        btnAtualizar.onclick = atualizarRoteiro;
        btn.parentNode.insertBefore(btnAtualizar, btn.nextSibling);
    }
    btnAtualizar.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function atualizarRoteiro() {
    // Lógica igual ao submit, mas só atualiza o roteiro editado
    const cidade = document.getElementById('cidade').value;
    const data = document.getElementById('data').value;
    const combustivel = Number(document.getElementById('combustivel').value) || 0;
    const alimentacao = Number(document.getElementById('alimentacao').value) || 0;
    const passeioNomes = document.querySelectorAll('.passeio-nome');
    const passeioCustos = document.querySelectorAll('.passeio-custo');
    let passeios = [];
    let totalPasseios = 0;
    for (let i = 0; i < passeioNomes.length; i++) {
        if (passeioNomes[i].value) {
            passeios.push({ nome: passeioNomes[i].value, custo: Number(passeioCustos[i].value) });
            totalPasseios += Number(passeioCustos[i].value);
        }
    }
    let hospedagem = null;
    if (document.getElementById('hospedar').value === 'true') {
        hospedagem = {
            hotel: document.getElementById('hotel').value,
            diaria: Number(document.getElementById('diaria').value),
            cafe: document.getElementById('cafe').value,
            total: Number(document.getElementById('totalHospedagem').value)
        };
    }
    const roteiro = { cidade, data, passeios, totalPasseios, hospedagem, combustivel, alimentacao };
    if (editando !== null) {
        // Busca o índice correto pelo par data+cidade
        const idx = roteiros.findIndex(r => r.data === editando.data && r.cidade === editando.cidade);
        if (idx !== -1) {
            let novosRoteiros = roteiros.slice();
            novosRoteiros[idx] = roteiro;
            await db.collection('roteiros').doc(adminUid).set({ roteiros: novosRoteiros });
        }
        sairEdicao();
    }
    document.getElementById('formRoteiro').reset();
    document.getElementById('hospedagemArea').style.display = 'none';
    const area = document.getElementById('passeiosArea');
    while (area.children.length > 2) area.removeChild(area.lastChild);
    const firstNome = area.querySelector('.passeio-nome');
    const firstCusto = area.querySelector('.passeio-custo');
    if (firstNome) firstNome.value = '';
    if (firstCusto) firstCusto.value = '';
}
function adicionarPasseioAoRoteiro() {
    // Apenas adiciona um novo grupo de campos no formulário, não altera o array de passeios diretamente
    const area = document.getElementById('passeiosArea');
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.alignItems = 'flex-end';
    div.innerHTML = `
        <label style="flex:2;">Passeio:<br><input type="text" class="passeio-nome" required></label>
        <label style="flex:1;">Custo (R$):<br><input type="number" class="passeio-custo" min="0" step="0.01" required></label>
        <button type="button" onclick="this.parentElement.remove()" style="background:#e57373; color:#fff; border:none; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:1.2em; margin-bottom:6px; margin-left:4px; cursor:pointer;" title="Remover passeio">&times;</button>
    `;
    area.appendChild(div);
}
function sairEdicao() {
    let btn = document.getElementById('btnAddPasseioEdicao');
    if (btn) btn.style.display = 'none';
    let btnAtualizar = document.getElementById('btnAtualizarRoteiro');
    if (btnAtualizar) btnAtualizar.style.display = 'none';
    let btnSubmit = document.querySelector('#formRoteiro button[type="submit"]');
    if (btnSubmit) btnSubmit.style.display = 'block';
    editando = null;
}
document.getElementById('formRoteiro').onsubmit = function (e) {
    e.preventDefault();
    (async () => {
        // Só adiciona novo roteiro, não atualiza
        const cidade = document.getElementById('cidade').value;
        const data = document.getElementById('data').value;
        const combustivel = Number(document.getElementById('combustivel').value) || 0;
        const alimentacao = Number(document.getElementById('alimentacao').value) || 0;
        const passeioNomes = document.querySelectorAll('.passeio-nome');
        const passeioCustos = document.querySelectorAll('.passeio-custo');
        let passeios = [];
        let totalPasseios = 0;
        for (let i = 0; i < passeioNomes.length; i++) {
            if (passeioNomes[i].value) {
                passeios.push({ nome: passeioNomes[i].value, custo: Number(passeioCustos[i].value) });
                totalPasseios += Number(passeioCustos[i].value);
            }
        }
        let hospedagem = null;
        if (document.getElementById('hospedar').value === 'true') {
            hospedagem = {
                hotel: document.getElementById('hotel').value,
                diaria: Number(document.getElementById('diaria').value),
                cafe: document.getElementById('cafe').value,
                total: Number(document.getElementById('totalHospedagem').value)
            };
        }
        const roteiro = { cidade, data, passeios, totalPasseios, hospedagem, combustivel, alimentacao };
        let novosRoteiros = roteiros ? roteiros.slice() : [];
        novosRoteiros.push(roteiro);
        await db.collection('roteiros').doc(adminUid).set({ roteiros: novosRoteiros });
        // Limpa o formulário após salvar
        document.getElementById('formRoteiro').reset();
        document.getElementById('hospedagemArea').style.display = 'none';
        const area = document.getElementById('passeiosArea');
        while (area.children.length > 2) area.removeChild(area.lastChild);
        const firstNome = area.querySelector('.passeio-nome');
        const firstCusto = area.querySelector('.passeio-custo');
        if (firstNome) firstNome.value = '';
        if (firstCusto) firstCusto.value = '';
    })();
}
// Não renderiza roteiros nem chama showLogin() aqui, pois o estado será controlado pelo onAuthStateChanged
