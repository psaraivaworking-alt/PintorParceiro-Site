// A sua configuração do Firebase. É a mesma para todo o projeto.
const firebaseConfig = {
    apiKey: "AIzaSyAp0l5SjZa04EXDOK8tijYYspv4HOm003U",
    authDomain: "pintordata-b279b.firebaseapp.com",
    projectId: "pintordata-b279b",
    storageBucket: "pintordata-b279b.firebasestorage.app",
    messagingSenderId: "637329209702",
    appId: "1:637329209702:web:ff2dec46880b1ae79430a7"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Obtém as instâncias do Authentication e Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Seleciona elementos da navegação (comuns a todas as páginas)
const navPerfil = document.getElementById('nav-perfil');

// --- Função para exibir mensagens no formulário ---
// (Esta função é genérica e pode ser usada em qualquer formulário)
function displayFormMessage(formMessageElement, message, type) {
    formMessageElement.textContent = message;
    formMessageElement.className = 'form-message ' + type;
    formMessageElement.style.display = 'block';
}

// --- Lógica de verificação do login na navegação ---
// (Executa em todas as páginas para mostrar/esconder o botão "Meu Perfil")
auth.onAuthStateChanged(user => {
    if (user) {
        navPerfil.classList.remove('hidden');
    } else {
        navPerfil.classList.add('hidden');
    }
});

// ===============================================
// Lógica Específica da Página de CADASTRO
// ===============================================
if (document.getElementById('form-pintor')) {
    // Código de cadastro que já temos...
    const formPintor = document.getElementById('form-pintor');
    const inputCep = document.getElementById('cep-pintor');
    const inputCidade = document.getElementById('cidade-pintor');
    const inputEstado = document.getElementById('estado-pintor');
    const inputRua = document.getElementById('rua-pintor');
    const inputNumero = document.getElementById('numero-pintor');
    const checkboxSemNumero = document.getElementById('sem-numero-pintor');
    const inputBiografia = document.getElementById('biografia-pintor');
    const contadorBiografia = document.getElementById('contador-biografia-pintor');
    const inputSenha = document.getElementById('senha-pintor');
    const inputConfirmarSenha = document.getElementById('confirmar-senha-pintor');
    const toggleSenhaBtn = document.getElementById('toggle-senha');
    const formMessageCadastro = document.getElementById('form-message');

    const cpfMask = new IMask(document.getElementById('cpf-pintor'), {
        mask: '000.000.000-00'
    });
    const phoneMask = new IMask(document.getElementById('telefone-pintor'), {
        mask: '(00) 00000-0000'
    });
    const cepMask = new IMask(inputCep, {
        mask: '00000-000'
    });

    inputBiografia.addEventListener('input', () => {
        const caracteresDigitados = inputBiografia.value.length;
        contadorBiografia.textContent = caracteresDigitados;
    });

    checkboxSemNumero.addEventListener('change', () => {
        if (checkboxSemNumero.checked) {
            inputNumero.value = '';
            inputNumero.disabled = true;
            inputNumero.placeholder = 'Sem número';
        } else {
            inputNumero.disabled = false;
            inputNumero.placeholder = 'Número';
        }
    });

    toggleSenhaBtn.addEventListener('click', () => {
        const type = inputSenha.type === 'password' ? 'text' : 'password';
        inputSenha.type = type;
        inputConfirmarSenha.type = type;
        toggleSenhaBtn.textContent = type === 'password' ? 'Ver Senha' : 'Esconder Senha';
    });

    inputCep.addEventListener('blur', async () => {
        const cep = inputCep.value.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    inputCidade.value = data.localidade;
                    inputEstado.value = data.uf;
                    inputRua.value = data.logradouro;
                    displayFormMessage(formMessageCadastro, '', '');
                } else {
                    displayFormMessage(formMessageCadastro, 'CEP não encontrado.', 'error');
                    inputCidade.value = '';
                    inputEstado.value = '';
                    inputRua.value = '';
                }
            } catch (error) {
                displayFormMessage(formMessageCadastro, 'Erro ao buscar CEP. Tente novamente.', 'error');
            }
        }
    });

    formPintor.addEventListener('submit', async (e) => {
        e.preventDefault();
        displayFormMessage(formMessageCadastro, '', '');

        if (inputSenha.value !== inputConfirmarSenha.value) {
            displayFormMessage(formMessageCadastro, 'As senhas não coincidem. Por favor, verifique.', 'error');
            return;
        }

        const email = document.getElementById('email-pintor').value;
        const senha = inputSenha.value;

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
            const user = userCredential.user;
            const dadosPintor = {
                uid: user.uid,
                nome: document.getElementById('nome-pintor').value,
                email: email,
                cpf: cpfMask.unmaskedValue,
                telefone: phoneMask.unmaskedValue,
                cep: cepMask.unmaskedValue,
                cidade: inputCidade.value,
                estado: inputEstado.value,
                rua: inputRua.value,
                numero: document.getElementById('numero-pintor').value,
                semNumero: checkboxSemNumero.checked,
                redeSocial: document.getElementById('rede-social-pintor').value,
                experienciaTempo: document.getElementById('experiencia-pintor').value,
                experienciaUnidade: document.getElementById('unidade-experiencia-pintor').value,
                biografia: inputBiografia.value
            };
            await db.collection("pintores").doc(user.uid).set(dadosPintor);
            displayFormMessage(formMessageCadastro, 'Cadastro realizado com sucesso! Redirecionando...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } catch (error) {
            let mensagemDeErro = 'Erro ao cadastrar. Por favor, tente novamente.';
            if (error.code === 'auth/email-already-in-use') {
                mensagemDeErro = 'Este e-mail já está em uso. Por favor, use outro e-mail.';
            } else if (error.code === 'auth/weak-password') {
                mensagemDeErro = 'A senha é muito fraca. Ela deve ter no mínimo 6 caracteres.';
            } else if (error.code === 'auth/invalid-email') {
                mensagemDeErro = 'O e-mail fornecido é inválido.';
            }
            displayFormMessage(formMessageCadastro, mensagemDeErro, 'error');
        }
    });
}

// ===============================================
// Lógica Específica da Página de LOGIN
// ===============================================
if (document.getElementById('form-login')) {
    // Código de login que já temos...
    const formLogin = document.getElementById('form-login');
    const inputEmailLogin = document.getElementById('email-login');
    const inputSenhaLogin = document.getElementById('senha-login');
    const formMessageLogin = document.getElementById('form-message-login');

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        displayFormMessage(formMessageLogin, '', '');

        const email = inputEmailLogin.value;
        const senha = inputSenhaLogin.value;

        try {
            await auth.signInWithEmailAndPassword(email, senha);
            displayFormMessage(formMessageLogin, 'Login realizado com sucesso! Redirecionando...', 'success');
            setTimeout(() => {
                window.location.href = 'perfil.html';
            }, 2000);
        } catch (error) {
            let mensagemDeErro = 'Erro ao fazer login. Verifique seu e-mail e senha.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                mensagemDeErro = 'E-mail ou senha incorretos.';
            } else if (error.code === 'auth/invalid-email') {
                mensagemDeErro = 'O e-mail fornecido é inválido.';
            }
            displayFormMessage(formMessageLogin, mensagemDeErro, 'error');
        }
    });
}

// ===============================================
// Lógica Específica da Página de PERFIL
// ===============================================
if (document.getElementById('form-perfil')) {
    // Seleciona os elementos do formulário de perfil
    const formPerfil = document.getElementById('form-perfil');
    const inputNome = document.getElementById('nome-perfil');
    const inputEmail = document.getElementById('email-perfil');
    const inputCpf = document.getElementById('cpf-perfil');
    const inputTelefone = document.getElementById('telefone-perfil');
    const inputCep = document.getElementById('cep-perfil');
    const inputCidade = document.getElementById('cidade-perfil');
    const inputEstado = document.getElementById('estado-perfil');
    const inputRua = document.getElementById('rua-perfil');
    const inputNumero = document.getElementById('numero-perfil');
    const checkboxSemNumero = document.getElementById('sem-numero-perfil');
    const inputRedeSocial = document.getElementById('rede-social-perfil');
    const inputExperiencia = document.getElementById('experiencia-perfil');
    const selectUnidadeExperiencia = document.getElementById('unidade-experiencia-perfil');
    const inputBiografia = document.getElementById('biografia-perfil');
    const contadorBiografia = document.getElementById('contador-biografia-perfil');
    const formMessagePerfil = document.getElementById('form-message-perfil');
    const logoutBtn = document.getElementById('logout-btn');

    // Funções de máscara e preenchimento de CEP para o formulário de perfil
    const cpfMask = new IMask(inputCpf, {
        mask: '000.000.000-00'
    });
    const phoneMask = new IMask(inputTelefone, {
        mask: '(00) 00000-0000'
    });
    const cepMask = new IMask(inputCep, {
        mask: '00000-000'
    });
    
    // Lógica do contador de caracteres da biografia
    inputBiografia.addEventListener('input', () => {
        const caracteresDigitados = inputBiografia.value.length;
        contadorBiografia.textContent = caracteresDigitados;
    });

    // Lógica do checkbox "Sem número"
    checkboxSemNumero.addEventListener('change', () => {
        if (checkboxSemNumero.checked) {
            inputNumero.value = '';
            inputNumero.disabled = true;
            inputNumero.placeholder = 'Sem número';
        } else {
            inputNumero.disabled = false;
            inputNumero.placeholder = 'Número';
        }
    });

    // Lógica de preenchimento de CEP
    inputCep.addEventListener('blur', async () => {
        const cep = inputCep.value.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    inputCidade.value = data.localidade;
                    inputEstado.value = data.uf;
                    inputRua.value = data.logradouro;
                } else {
                    displayFormMessage(formMessagePerfil, 'CEP não encontrado.', 'error');
                    inputCidade.value = '';
                    inputEstado.value = '';
                    inputRua.value = '';
                }
            } catch (error) {
                displayFormMessage(formMessagePerfil, 'Erro ao buscar CEP. Tente novamente.', 'error');
            }
        }
    });

    // Função para carregar os dados do usuário
    const carregarDadosDoUsuario = async (user) => {
        try {
            const doc = await db.collection("pintores").doc(user.uid).get();
            if (doc.exists) {
                const dadosPintor = doc.data();
                inputNome.value = dadosPintor.nome || '';
                inputEmail.value = dadosPintor.email || '';
                cpfMask.value = dadosPintor.cpf || '';
                phoneMask.value = dadosPintor.telefone || '';
                cepMask.value = dadosPintor.cep || '';
                inputCidade.value = dadosPintor.cidade || '';
                inputEstado.value = dadosPintor.estado || '';
                inputRua.value = dadosPintor.rua || '';
                inputNumero.value = dadosPintor.numero || '';
                checkboxSemNumero.checked = dadosPintor.semNumero || false;
                inputRedeSocial.value = dadosPintor.redeSocial || '';
                inputExperiencia.value = dadosPintor.experienciaTempo || '';
                selectUnidadeExperiencia.value = dadosPintor.experienciaUnidade || 'anos';
                inputBiografia.value = dadosPintor.biografia || '';
                contadorBiografia.textContent = inputBiografia.value.length;
                
                // Força a atualização do estado do checkbox
                checkboxSemNumero.dispatchEvent(new Event('change'));
            } else {
                displayFormMessage(formMessagePerfil, 'Dados do perfil não encontrados.', 'error');
            }
        } catch (error) {
            displayFormMessage(formMessagePerfil, 'Erro ao carregar dados do perfil.', 'error');
        }
    };

    // Lógica para verificar o login ao carregar a página
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário logado, carrega os dados do perfil
            carregarDadosDoUsuario(user);
        } else {
            // Nenhum usuário logado, redireciona para o login
            window.location.href = 'login.html';
        }
    });

    // Lógica de atualização do perfil no Firestore
    formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            displayFormMessage(formMessagePerfil, 'Você precisa estar logado para salvar as alterações.', 'error');
            return;
        }

        try {
            const dadosAtualizados = {
                nome: inputNome.value,
                cpf: cpfMask.unmaskedValue,
                telefone: phoneMask.unmaskedValue,
                cep: cepMask.unmaskedValue,
                cidade: inputCidade.value,
                estado: inputEstado.value,
                rua: inputRua.value,
                numero: inputNumero.value,
                semNumero: checkboxSemNumero.checked,
                redeSocial: inputRedeSocial.value,
                experienciaTempo: inputExperiencia.value,
                experienciaUnidade: selectUnidadeExperiencia.value,
                biografia: inputBiografia.value
            };

            await db.collection("pintores").doc(user.uid).update(dadosAtualizados);
            displayFormMessage(formMessagePerfil, 'Perfil atualizado com sucesso!', 'success');

        } catch (error) {
            displayFormMessage(formMessagePerfil, 'Erro ao salvar alterações. Tente novamente.', 'error');
        }
    });

    // Lógica do botão de Logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            displayFormMessage(formMessagePerfil, 'Erro ao sair. Tente novamente.', 'error');
        }
    });
}
