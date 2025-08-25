// Configuração do Firebase
// SUBSTITUA PELAS SUAS PRÓPRIAS CONFIGURAÇÕES DO FIREBASE

// script.js - CÓDIGO UNIFICADO PARA TODAS AS PÁGINAS

// ----------------------------------------------------
// 1. CONFIGURAÇÃO DO FIREBASE (ÚNICO PONTO DE CONFIGURAÇÃO)
// ----------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyCmuGFCKnZ-qBVUpDxs6moJis19lx8nvXw",
  authDomain: "pintordata.firebaseapp.com",
  projectId: "pintordata",
  storageBucket: "pintordata.firebasestorage.app",
  messagingSenderId: "994883381349",
  appId: "1:994883381349:web:b802e44d49d6f6f163fe8c"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ----------------------------------------------------
// 2. FUNÇÕES E LÓGICA COMPARTILHADA
// ----------------------------------------------------
function showError(message, element) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function hideError(element) {
    if (element) {
        element.textContent = '';
        element.style.display = 'none';
    }
}

// ----------------------------------------------------
// 3. LÓGICA DE CADASTRO (EXECUTADA APENAS EM cadastro.html)
// ----------------------------------------------------
const formPintor = document.getElementById('form-pintor');
const formCliente = document.getElementById('form-cliente');

if (formPintor && formCliente) {
    const btnPintor = document.getElementById('btn-pintor');
    const btnCliente = document.getElementById('btn-cliente');
    const contadorBio = document.getElementById('contador-biografia-pintor');
    const biografiaPintor = document.getElementById('biografia-pintor');
    const errorMessagePintor = document.getElementById('error-message-pintor');
    const errorMessageCliente = document.getElementById('error-message-cliente');

    // Referências aos inputs e checkboxes
    const inputCpfPintor = document.getElementById('cpf-pintor');
    const inputTelefonePintor = document.getElementById('telefone-pintor');
    const inputCepPintor = document.getElementById('cep-pintor');
    const inputCidadePintor = document.getElementById('cidade-pintor');
    const inputEstadoPintor = document.getElementById('estado-pintor');
    const inputNumeroPintor = document.getElementById('numero-pintor');
    const checkboxSemNumeroPintor = document.getElementById('sem-numero-pintor');

    const inputCpfCliente = document.getElementById('cpf-cliente');
    const inputTelefoneCliente = document.getElementById('telefone-cliente');
    const inputCepCliente = document.getElementById('cep-cliente');
    const inputCidadeCliente = document.getElementById('cidade-cliente');
    const inputEstadoCliente = document.getElementById('estado-cliente');
    const inputNumeroCliente = document.getElementById('numero-cliente');
    const checkboxSemNumeroCliente = document.getElementById('sem-numero-cliente');

    const togglePasswordPintorBtn = document.getElementById('toggle-password-pintor');
    const togglePasswordClienteBtn = document.getElementById('toggle-password-cliente');

    function alternarFormulario(tipo) {
        hideError(errorMessagePintor);
        hideError(errorMessageCliente);
        if (tipo === 'pintor') {
            formPintor.classList.remove('hidden');
            formCliente.classList.add('hidden');
            btnPintor.classList.add('active');
            btnCliente.classList.remove('active');
        } else {
            formCliente.classList.remove('hidden');
            formPintor.classList.add('hidden');
            btnCliente.classList.add('active');
            btnPintor.classList.remove('active');
        }
    }

    async function buscarCep(cep, cidadeInput, estadoInput) {
        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) {
            cidadeInput.value = '';
            estadoInput.value = '';
            return;
        }
        
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
            const data = await response.json();
            
            if (!data.erro) {
                cidadeInput.value = data.localidade;
                estadoInput.value = data.uf;
            } else {
                cidadeInput.value = '';
                estadoInput.value = '';
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new IMask(inputCpfPintor, { mask: '000.000.000-00' });
        new IMask(inputTelefonePintor, { mask: '(00) 00000-0000' });
        new IMask(inputCepPintor, { mask: '00000-000' });
        new IMask(inputCpfCliente, { mask: '000.000.000-00' });
        new IMask(inputTelefoneCliente, { mask: '(00) 00000-0000' });
        new IMask(inputCepCliente, { mask: '00000-000' });
    });

    btnPintor.addEventListener('click', () => alternarFormulario('pintor'));
    btnCliente.addEventListener('click', () => alternarFormulario('cliente'));

    inputCepPintor.addEventListener('blur', (e) => buscarCep(e.target.value, inputCidadePintor, inputEstadoPintor));
    inputCepCliente.addEventListener('blur', (e) => buscarCep(e.target.value, inputCidadeCliente, inputEstadoCliente));

    checkboxSemNumeroPintor.addEventListener('change', (e) => {
        if (e.target.checked) {
            inputNumeroPintor.value = '';
            inputNumeroPintor.disabled = true;
            inputNumeroPintor.placeholder = 'N/A';
        } else {
            inputNumeroPintor.disabled = false;
            inputNumeroPintor.placeholder = 'Número';
        }
    });

    checkboxSemNumeroCliente.addEventListener('change', (e) => {
        if (e.target.checked) {
            inputNumeroCliente.value = '';
            inputNumeroCliente.disabled = true;
            inputNumeroCliente.placeholder = 'N/A';
        } else {
            inputNumeroCliente.disabled = false;
            inputNumeroCliente.placeholder = 'Número';
        }
    });

    togglePasswordPintorBtn.addEventListener('click', () => {
        const senha = document.getElementById('senha-pintor');
        const confirmarSenha = document.getElementById('confirmar-senha-pintor');
        const isPassword = senha.type === 'password';
        senha.type = isPassword ? 'text' : 'password';
        confirmarSenha.type = isPassword ? 'text' : 'password';
        togglePasswordPintorBtn.textContent = isPassword ? 'Ocultar Senha' : 'Mostrar Senha';
    });

    togglePasswordClienteBtn.addEventListener('click', () => {
        const senha = document.getElementById('senha-cliente');
        const confirmarSenha = document.getElementById('confirmar-senha-cliente');
        const isPassword = senha.type === 'password';
        senha.type = isPassword ? 'text' : 'password';
        confirmarSenha.type = isPassword ? 'text' : 'password';
        togglePasswordClienteBtn.textContent = isPassword ? 'Ocultar Senha' : 'Mostrar Senha';
    });

    if (biografiaPintor) {
        biografiaPintor.addEventListener('input', (e) => {
            const charCount = e.target.value.length;
            contadorBio.textContent = `${charCount}/200`;
        });
    }

    formPintor.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(errorMessagePintor);

        const dados = {
            nomeCompleto: document.getElementById('nome-pintor').value,
            email: document.getElementById('email-pintor').value,
            senha: document.getElementById('senha-pintor').value,
            confirmarSenha: document.getElementById('confirmar-senha-pintor').value,
            cpf: inputCpfPintor.value.replace(/\D/g, ''),
            telefone: inputTelefonePintor.value.replace(/\D/g, ''),
            cep: inputCepPintor.value.replace(/\D/g, ''),
            cidade: inputCidadePintor.value,
            estado: inputEstadoPintor.value,
            rua: document.getElementById('rua-pintor').value,
            numero: inputNumeroPintor.disabled ? 'N/A' : inputNumeroPintor.value,
            semNumero: checkboxSemNumeroPintor.checked,
            linkRedeSocial: document.getElementById('rede-social-pintor').value,
            tempoExperiencia: parseInt(document.getElementById('experiencia-pintor').value),
            unidadeExperiencia: document.getElementById('unidade-experiencia-pintor').value,
            biografia: biografiaPintor.value,
            tipoUsuario: 'pintor',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (dados.senha !== dados.confirmarSenha) {
            showError('As senhas não coincidem!', errorMessagePintor);
            return false;
        }

        try {
            const cpfDoc = await db.collection('cpf_registry').doc(dados.cpf).get();
            if (cpfDoc.exists) {
                showError('Este CPF já está cadastrado na plataforma.', errorMessagePintor);
                return;
            }

            const userCredential = await auth.createUserWithEmailAndPassword(dados.email, dados.senha);
            const userId = userCredential.user.uid;

            await db.collection('pintores').doc(userId).set({
                ...dados,
                senha: null,
                confirmarSenha: null
            });

            await db.collection('cpf_registry').doc(dados.cpf).set({
                userId: userId,
                userType: 'pintor'
            });

            window.location.href = 'login.html';

        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                showError('Este e-mail já está em uso. Por favor, use outro.', errorMessagePintor);
            } else {
                showError('Erro no cadastro: ' + error.message, errorMessagePintor);
            }
            console.error("Erro no cadastro:", error);
        }
    });

    formCliente.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(errorMessageCliente);

        const dados = {
            nomeCompleto: document.getElementById('nome-cliente').value,
            email: document.getElementById('email-cliente').value,
            senha: document.getElementById('senha-cliente').value,
            confirmarSenha: document.getElementById('confirmar-senha-cliente').value,
            cpf: inputCpfCliente.value.replace(/\D/g, ''),
            telefone: inputTelefoneCliente.value.replace(/\D/g, ''),
            cep: inputCepCliente.value.replace(/\D/g, ''),
            cidade: inputCidadeCliente.value,
            estado: inputEstadoCliente.value,
            rua: document.getElementById('rua-cliente').value,
            numero: inputNumeroCliente.disabled ? 'N/A' : inputNumeroCliente.value,
            semNumero: checkboxSemNumeroCliente.checked,
            tipoUsuario: 'cliente',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (dados.senha !== dados.confirmarSenha) {
            showError('As senhas não coincidem!', errorMessageCliente);
            return false;
        }

        try {
            const cpfDoc = await db.collection('cpf_registry').doc(dados.cpf).get();
            if (cpfDoc.exists) {
                showError('Este CPF já está cadastrado na plataforma.', errorMessageCliente);
                return;
            }

            const userCredential = await auth.createUserWithEmailAndPassword(dados.email, dados.senha);
            const userId = userCredential.user.uid;

            await db.collection('clientes').doc(userId).set({
                ...dados,
                senha: null,
                confirmarSenha: null
            });

            await db.collection('cpf_registry').doc(dados.cpf).set({
                userId: userId,
                userType: 'cliente'
            });

            window.location.href = 'login.html';

        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                showError('Este e-mail já está em uso. Por favor, use outro.', errorMessageCliente);
            } else {
                showError('Erro no cadastro: ' + error.message, errorMessageCliente);
            }
            console.error("Erro no cadastro:", error);
        }
    });
}

// ----------------------------------------------------
// 4. LÓGICA DE LOGIN (EXECUTADA APENAS EM login.html)
// ----------------------------------------------------
const loginForm = document.getElementById('login-form');

if (loginForm) {
    const emailInput = document.getElementById('email-login');
    const senhaInput = document.getElementById('senha-login');
    const errorMessage = document.getElementById('error-message-login');
    const forgotPasswordLink = document.getElementById('forgot-password-link');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(errorMessage);

        const email = emailInput.value;
        const senha = senhaInput.value;

        try {
            await auth.signInWithEmailAndPassword(email, senha);
            window.location.href = 'perfil.html';
        } catch (error) {
            let message = 'Erro no login. Verifique seu e-mail e senha.';
            if (error.code === 'auth/user-not-found') {
                message = 'Nenhum usuário encontrado com este e-mail.';
            } else if (error.code === 'auth/wrong-password') {
                message = 'Senha incorreta.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Formato de e-mail inválido.';
            }
            showError(message, errorMessage);
            console.error("Erro no login:", error);
        }
    });

    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        hideError(errorMessage);

        const email = emailInput.value;
        if (!email) {
            showError('Por favor, digite seu e-mail para redefinir a senha.', errorMessage);
            return;
        }

        try {
            await auth.sendPasswordResetEmail(email);
            alert('Um link para redefinir sua senha foi enviado para o seu e-mail.');
        } catch (error) {
            let message = 'Erro ao enviar o e-mail de redefinição de senha.';
            if (error.code === 'auth/user-not-found') {
                message = 'Nenhum usuário encontrado com este e-mail.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Formato de e-mail inválido.';
            }
            showError(message, errorMessage);
            console.error("Erro na redefinição de senha:", error);
        }
    });
}
