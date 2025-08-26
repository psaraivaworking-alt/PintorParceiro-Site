// A sua configuração do Firebase
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

// Seleciona os elementos do DOM
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
const toggleSenhaBtn = document.getElementById('toggle-senha'); // Novo botão
const formMessage = document.getElementById('form-message'); // Nova área de mensagem

// --- Função para exibir mensagens no formulário ---
function displayFormMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = 'form-message ' + type; // Adiciona classe 'success' ou 'error'
    formMessage.style.display = 'block';
}

// --- Aplica as Máscaras de Input (IMask) ---
const cpfMask = new IMask(document.getElementById('cpf-pintor'), {
    mask: '000.000.000-00'
});

const phoneMask = new IMask(document.getElementById('telefone-pintor'), {
    mask: '(00) 00000-0000'
});

const cepMask = new IMask(inputCep, {
    mask: '00000-000'
});

// --- Lógica do Contador de Caracteres da Biografia ---
inputBiografia.addEventListener('input', () => {
    const caracteresDigitados = inputBiografia.value.length;
    contadorBiografia.textContent = caracteresDigitados;
});

// --- Lógica do Checkbox "Sem número" ---
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

// --- Lógica do botão "Ver Senha" ---
toggleSenhaBtn.addEventListener('click', () => {
    const type = inputSenha.type === 'password' ? 'text' : 'password';
    inputSenha.type = type;
    inputConfirmarSenha.type = type; // Altera ambos
    toggleSenhaBtn.textContent = type === 'password' ? 'Ver Senha' : 'Esconder Senha';
});


// --- Lógica de Preenchimento Automático do CEP (ViaCEP) ---
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
                displayFormMessage('', ''); // Limpa qualquer mensagem anterior
            } else {
                displayFormMessage('CEP não encontrado.', 'error');
                inputCidade.value = '';
                inputEstado.value = '';
                inputRua.value = '';
            }
        } catch (error) {
            displayFormMessage('Erro ao buscar CEP. Tente novamente.', 'error');
        }
    }
});

// --- Lógica de Validação e ENVIO PARA O FIREBASE ---
formPintor.addEventListener('submit', async (e) => {
    e.preventDefault();

    displayFormMessage('', ''); // Limpa qualquer mensagem anterior

    // Validação de Senha
    if (inputSenha.value !== inputConfirmarSenha.value) {
        displayFormMessage('As senhas não coincidem. Por favor, verifique.', 'error');
        return;
    }

    const email = document.getElementById('email-pintor').value;
    const senha = inputSenha.value;

    try {
        // 1. Cria o usuário no Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
        const user = userCredential.user;

        // 2. Coleta os dados restantes do formulário
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
            numero: inputNumero.value,
            semNumero: checkboxSemNumero.checked,
            redeSocial: document.getElementById('rede-social-pintor').value,
            experienciaTempo: document.getElementById('experiencia-pintor').value,
            experienciaUnidade: document.getElementById('unidade-experiencia-pintor').value,
            biografia: inputBiografia.value
        };

        // 3. Salva os dados no Cloud Firestore
        await db.collection("pintores").doc(user.uid).set(dadosPintor);

        // Cadastro bem-sucedido
        displayFormMessage('Cadastro realizado com sucesso! Redirecionando para o login...', 'success');
        // Redireciona após um pequeno atraso para a mensagem ser lida
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000); // 2 segundos de atraso

    } catch (error) {
        // Trata os erros do Firebase
        let mensagemDeErro = 'Erro ao cadastrar. Por favor, tente novamente.';

        if (error.code === 'auth/email-already-in-use') {
            mensagemDeErro = 'Este e-mail já está em uso. Por favor, use outro e-mail.';
        } else if (error.code === 'auth/weak-password') {
            mensagemDeErro = 'A senha é muito fraca. Ela deve ter no mínimo 6 caracteres.';
        } else if (error.code === 'auth/invalid-email') {
            mensagemDeErro = 'O e-mail fornecido é inválido.';
        } else {
             // Erros gerais, pode ser útil para depuração
             console.error("Erro detalhado do Firebase:", error);
        }
        
        displayFormMessage(mensagemDeErro, 'error');
    }
});
