// Configuração do Firebase
// SUBSTITUA PELAS SUAS PRÓPRIAS CONFIGURAÇÕES DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCmuGFCKnZ-qBVUpDxs6moJis19lx8nvXw",
  authDomain: "pintordata.firebaseapp.com",
  projectId: "pintordata",
  storageBucket: "pintordata.firebasestorage.app",
  messagingSenderId: "994883381349",
  appId: "1:994883381349:web:b802e44d49d6f6f163fe8c"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Referências aos elementos do DOM
const btnPintor = document.getElementById('btn-pintor');
const btnCliente = document.getElementById('btn-cliente');
const formPintor = document.getElementById('form-pintor');
const formCliente = document.getElementById('form-cliente');
const contadorBio = document.getElementById('contador-biografia-pintor');
const biografiaPintor = document.getElementById('biografia-pintor');
const errorMessagePintor = document.getElementById('error-message-pintor');
const errorMessageCliente = document.getElementById('error-message-cliente');

// Referências aos inputs
const inputCpfPintor = document.getElementById('cpf-pintor');
const inputTelefonePintor = document.getElementById('telefone-pintor');
const inputCepPintor = document.getElementById('cep-pintor');
const inputCidadePintor = document.getElementById('cidade-pintor');
const inputEstadoPintor = document.getElementById('estado-pintor');

const inputCpfCliente = document.getElementById('cpf-cliente');
const inputTelefoneCliente = document.getElementById('telefone-cliente');
const inputCepCliente = document.getElementById('cep-cliente');
const inputCidadeCliente = document.getElementById('cidade-cliente');
const inputEstadoCliente = document.getElementById('estado-cliente');

// --- Funções de Lógica Geral ---

// Exibe a mensagem de erro na tela
function showError(message, formType) {
    const errorMessageElement = formType === 'pintor' ? errorMessagePintor : errorMessageCliente;
    errorMessageElement.textContent = message;
    errorMessageElement.style.display = 'block';
}

// Oculta a mensagem de erro
function hideError(formType) {
    const errorMessageElement = formType === 'pintor' ? errorMessagePintor : errorMessageCliente;
    errorMessageElement.textContent = '';
    errorMessageElement.style.display = 'none';
}

// Alterna entre formulários de Pintor e Cliente
function alternarFormulario(tipo) {
    hideError('pintor');
    hideError('cliente');
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

// Máscaras de input com IMask.js
document.addEventListener('DOMContentLoaded', () => {
    new IMask(inputCpfPintor, { mask: '000.000.000-00' });
    new IMask(inputTelefonePintor, { mask: '(00) 00000-0000' });
    new IMask(inputCepPintor, { mask: '00000-000' });

    new IMask(inputCpfCliente, { mask: '000.000.000-00' });
    new IMask(inputTelefoneCliente, { mask: '(00) 00000-0000' });
    new IMask(inputCepCliente, { mask: '00000-000' });
});

// Busca CEP na API do ViaCEP
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

// --- Event Listeners ---

btnPintor.addEventListener('click', () => alternarFormulario('pintor'));
btnCliente.addEventListener('click', () => alternarFormulario('cliente'));

inputCepPintor.addEventListener('blur', (e) => buscarCep(e.target.value, inputCidadePintor, inputEstadoPintor));
inputCepCliente.addEventListener('blur', (e) => buscarCep(e.target.value, inputCidadeCliente, inputEstadoCliente));

if (biografiaPintor) {
    biografiaPintor.addEventListener('input', (e) => {
        const charCount = e.target.value.length;
        contadorBio.textContent = `${charCount}/200`;
    });
}

// Lógica de envio do formulário de Pintor
formPintor.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('pintor');

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
        numero: document.getElementById('numero-pintor').value,
        semNumero: document.getElementById('sem-numero-pintor').checked,
        linkRedeSocial: document.getElementById('rede-social-pintor').value,
        tempoExperiencia: parseInt(document.getElementById('experiencia-pintor').value),
        unidadeExperiencia: document.getElementById('unidade-experiencia-pintor').value,
        biografia: biografiaPintor.value,
        tipoUsuario: 'pintor',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (dados.senha !== dados.confirmarSenha) {
        showError('As senhas não coincidem!', 'pintor');
        return false;
    }

    try {
        const cpfDoc = await db.collection('cpf_registry').doc(dados.cpf).get();
        if (cpfDoc.exists) {
            showError('Este CPF já está cadastrado na plataforma.', 'pintor');
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
            showError('Este e-mail já está em uso. Por favor, use outro.', 'pintor');
        } else {
            showError('Erro no cadastro: ' + error.message, 'pintor');
        }
        console.error("Erro no cadastro:", error);
    }
});

// Lógica de envio do formulário de Cliente
formCliente.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError('cliente');

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
        numero: document.getElementById('numero-cliente').value,
        semNumero: document.getElementById('sem-numero-cliente').checked,
        tipoUsuario: 'cliente',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (dados.senha !== dados.confirmarSenha) {
        showError('As senhas não coincidem!', 'cliente');
        return false;
    }

    try {
        const cpfDoc = await db.collection('cpf_registry').doc(dados.cpf).get();
        if (cpfDoc.exists) {
            showError('Este CPF já está cadastrado na plataforma.', 'cliente');
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
            showError('Este e-mail já está em uso. Por favor, use outro.', 'cliente');
        } else {
            showError('Erro no cadastro: ' + error.message, 'cliente');
        }
        console.error("Erro no cadastro:", error);
    }
});
