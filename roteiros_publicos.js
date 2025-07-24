// Página pública de roteiros (apenas leitura)

// Configuração do Firebase agora está em firebaseConfig.js (adicione <script src="firebaseConfig.js"></script> antes deste script)
firebase.initializeApp(window.firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ID do usuário admin (você)
const adminUid = "XnmSXFBdiYMsnpdwyWjfH3xYBg52"; // seu UID
// E-mails permitidos
const emailsPermitidos = [
    "cintia.menezes@mackenzie.br",
    "cintia.menezes@mackenzie.br",
    "marcelo.salmeron@om30.com.br" // Adicione aqui o seu email de admin
];

function exibirLogin() {
    document.body.style.display = 'flex';
    document.body.style.flexDirection = 'column';
    document.body.style.justifyContent = 'center';
    document.body.style.alignItems = 'center';
    document.body.style.minHeight = '100vh';
    document.body.innerHTML = `
    <div id="loginBox" style="max-width:400px;width:100%;background:#fff;padding:36px 36px 24px 36px;border-radius:18px;box-shadow:0 8px 32px #b2dfdb55,0 1.5px 8px #1a3c5d22;">
        <h2 style="text-align:center;margin-bottom:24px;">Login para ver os roteiros</h2>
        <form id="loginForm" style="display:flex;flex-direction:column;gap:18px;width:100%;max-width:320px;margin:0 auto;">
            <div style="display:flex;flex-direction:column;gap:6px;">
                <label for="loginEmail" style="font-weight:500;">Email:</label>
                <input type="email" id="loginEmail" required style="width:100%;padding:10px 12px;border:1.5px solid #b2dfdb;border-radius:6px;font-size:1em;background:#f7fafd;box-sizing:border-box;">
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;">
                <label for="loginSenha" style="font-weight:500;">Senha:</label>
                <input type="password" id="loginSenha" required style="width:100%;padding:10px 12px;border:1.5px solid #b2dfdb;border-radius:6px;font-size:1em;background:#f7fafd;box-sizing:border-box;">
            </div>
            <button type="submit" style="background:linear-gradient(90deg,#1a3c5d 60%,#26a69a 100%);color:#fff;border:none;border-radius:6px;padding:10px 0;font-size:1em;font-weight:600;width:100%;margin-top:8px;cursor:pointer;transition:background 0.2s;">Entrar</button>
        </form>
        <p id="loginMsg" style="color:#b22222;text-align:center;margin-top:10px;font-size:1.05em;"></p>
    </div>
    `;
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
}

function acessoNegado() {
    document.body.innerHTML = `<div style='max-width:400px;margin:60px auto 0 auto;background:#fff;padding:36px 36px 24px 36px;border-radius:18px;box-shadow:0 8px 32px #b2dfdb55,0 1.5px 8px #1a3c5d22;'><h2>Acesso negado</h2><p>Seu e-mail não tem permissão para visualizar os roteiros.</p></div>`;
}

function carregarRoteirosPublicos() {
    let container = document.getElementById('roteirosPublicos');
    if (!container) {
        // Cria o container dentro do roteirosContainer se não existir (após login)
        let parent = document.getElementById('roteirosContainer');
        if (!parent) parent = document.body;
        const div = document.createElement('div');
        div.id = 'roteirosPublicos';
        parent.appendChild(div);
        container = div;
    }
    db.collection('roteiros').doc(adminUid).onSnapshot(function (doc) {
        if (doc.exists && doc.data().roteiros && doc.data().roteiros.length > 0) {
            let roteiros = doc.data().roteiros.slice();
            // Ordena os roteiros por data crescente (YYYY-MM-DD)
            roteiros.sort((a, b) => {
                if (!a.data) return 1;
                if (!b.data) return -1;
                return a.data.localeCompare(b.data);
            });
            // Cabeçalho do itinerário
            let html = `<div class="itinerario-box" style="background:#fff;border:2.5px solid #4caf50;border-radius:18px;max-width:800px;margin:0 auto 32px auto;padding:32px 32px 24px 32px;box-shadow:0 4px 24px #b2dfdb33;">
                <h1 style='color:#388e3c;text-align:center;margin-bottom:8px;font-size:2.2em;'>Itinerário das Nossas Férias</h1>
                <div style='text-align:center;color:#333;font-size:1.1em;margin-bottom:18px;'>
                    <span><strong>Data inicial:</strong> ${roteiros[0].data || ''}</span>
                </div>
            </div>`;
            roteiros.forEach((roteiro, idx) => {
                html += `<div class='dia-bloco' style='background:#fff;border:1.5px solid #4caf50;border-radius:12px;margin-bottom:24px;padding:24px 24px 16px 24px;box-shadow:0 2px 8px #b2dfdb22;'>`;
                html += `<div style='display:flex;align-items:center;gap:18px;margin-bottom:10px;'>
                    <div style='background:#4caf50;color:#fff;font-weight:600;border-radius:8px;padding:6px 18px;font-size:1.1em;'>Dia ${idx + 1}</div>
                    <div style='color:#388e3c;font-size:1.1em;'><strong>${roteiro.data || ''}</strong></div>
                    <div style='color:#222;font-size:1.1em;margin-left:12px;'><strong>${roteiro.cidade || ''}</strong></div>
                </div>`;
                html += `<ul style='list-style:none;padding-left:0;margin-bottom:0;'>`;
                // Passeios (exceto alimentação)
                roteiro.passeios.forEach(p => {
                    if (p.nome) {
                        let nomeLimpo = p.nome.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
                        if (nomeLimpo !== 'alimentacao') {
                            html += `<li style='margin-bottom:6px;'><span style='color:#222;font-weight:500;'>Passeio:</span> <span style='color:#388e3c;'>${p.nome}</span>`;
                            if (p.link) {
                                html += ` <a href='${p.link}' target='_blank' style='color:#1976d2;font-size:0.95em;'>(link)</a>`;
                            }
                            html += `</li>`;
                        }
                    }
                });
                // (Alimentação removida da visualização pública)
                // Custos extras (sem valor)
                if (roteiro.extras && roteiro.extras.length > 0) {
                    roteiro.extras.forEach(e => {
                        html += `<li style='margin-bottom:6px;'><span style='color:#222;font-weight:500;'>Extra:</span> <span style='color:#388e3c;'>${e.nome}</span></li>`;
                    });
                }
                // Hospedagem (nome do hotel e link)
                if (roteiro.hospedagem && roteiro.hospedagem.hotel) {
                    html += `<li style='margin-bottom:6px;'><span style='color:#222;font-weight:500;'>Hospedagem:</span> <span style='color:#388e3c;'>${roteiro.hospedagem.hotel}</span>`;
                    if (roteiro.hospedagem.link) {
                        html += ` <a href='${roteiro.hospedagem.link}' target='_blank' style='color:#1976d2;font-size:0.95em;'>(link)</a>`;
                    }
                    html += `</li>`;
                }
                html += `</ul></div>`;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>Nenhum roteiro cadastrado ainda.</p>';
        }
    });
}

auth.onAuthStateChanged(function (user) {
    if (!user) {
        exibirLogin();
        return;
    }
    if (!emailsPermitidos.includes(user.email)) {
        acessoNegado();
        return;
    }
    // Se for admin, só redireciona para admin.html se NÃO estiver em roteiros_publicos.html
    if (user.email && user.email.toLowerCase() === 'marcelo.salmeron@om30.com.br') {
        // Se já está em roteiros_publicos.html, permite visualizar normalmente
        if (!window.location.pathname.endsWith('roteiros_publicos.html')) {
            window.location.href = 'admin.html';
            return;
        }
    }
    // Usuário permitido (não admin), exibe animação de boas-vindas e depois roteiros
    document.body.innerHTML = '';
    // Animação de boas-vindas
    const anim = document.createElement('div');
    anim.id = 'entradaAnimacaoPublic';
    anim.style = 'display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;font-family:sans-serif;opacity:0;transition:opacity 1.2s;';
    anim.innerHTML = `
        <div style="background:linear-gradient(90deg,#26a69a 60%,#1a3c5d 100%);padding:38px 48px 32px 48px;border-radius:22px;box-shadow:0 8px 32px #b2dfdb55,0 1.5px 8px #1a3c5d22;max-width:480px;">
            <h1 style="color:#fff;font-size:2.2em;text-align:center;margin-bottom:10px;">Bem-vindo(a) ao seu roteiro de férias!</h1>
            <div style="color:#fff;font-size:1.2em;text-align:center;">Aproveite para visualizar todos os passeios planejados.</div>
        </div>
    `;
    document.body.appendChild(anim);
    setTimeout(() => { anim.style.opacity = 1; }, 100);
    setTimeout(() => {
        anim.style.opacity = 0;
        setTimeout(() => {
            anim.style.display = 'none';
            // Mostra roteiros
            const container = document.createElement('div');
            container.id = 'roteirosContainer';
            container.style = 'max-width:700px;margin:40px auto 0 auto;background:#fff;border-radius:18px;box-shadow:0 8px 32px #b2dfdb55,0 1.5px 8px #1a3c5d22;padding:32px 32px 24px 32px;position:relative;';
            let adminBtn = '';
            // Exibe o botão Admin se o usuário for admin, independente do endpoint
            if (user.email && user.email.toLowerCase() === 'marcelo.salmeron@om30.com.br') {
                adminBtn = `<button id=\"adminBtnReturn\" style=\"position:absolute;top:18px;left:18px;background:linear-gradient(90deg,#1a3c5d 60%,#26a69a 100%);color:#fff;border:none;border-radius:6px;padding:8px 18px;font-size:1em;font-weight:600;cursor:pointer;transition:background 0.2s;\">Admin</button>`;
            }
            container.innerHTML = `
              <button id=\"logoutBtnPublic\" style=\"position:absolute;top:18px;right:18px;background:linear-gradient(90deg,#e57373 60%,#ffb199 100%);color:#fff;border:none;border-radius:6px;padding:8px 18px;font-size:1em;font-weight:600;cursor:pointer;transition:background 0.2s;\">Sair</button>
              ${adminBtn}
              <h1>Roteiros de Viagem</h1>
              <div id=\"roteirosPublicos\"></div>
            `;
            document.body.appendChild(container);
            document.getElementById('logoutBtnPublic').onclick = function () {
                auth.signOut().then(() => { window.location.href = 'roteiro_ferias.html'; });
            };
            // O botão Admin agora redireciona para admin.html
            if (user.email && user.email.toLowerCase() === 'marcelo.salmeron@om30.com.br') {
                document.getElementById('adminBtnReturn').onclick = function () {
                    window.location.href = 'admin.html';
                };
            }
            setTimeout(carregarRoteirosPublicos, 0);
        }, 900);
    }, 2600);
});
