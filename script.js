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
// script.js (ADICIONE ESTE CÓDIGO NO FINAL DO SEU ARQUIVO)

// ----------------------------------------------------
// 6. LÓGICA DE EDIÇÃO DE PERFIL
// ----------------------------------------------------

// Referências aos elementos do DOM da edição
const profileView = document.getElementById('profile-view');
const editFormContainer = document.getElementById('edit-form-container');
const editProfileButton = document.getElementById('edit-profile-button');
const cancelEditButton = document.getElementById('cancel-edit-button');
const editProfileForm = document.getElementById('edit-profile-form');
const editPintorFields = document.getElementById('edit-pintor-fields');
const editTipoUsuario = document.getElementById('edit-tipo-usuario');
const editBio = document.getElementById('edit-biografia');
const editBioCounter = document.getElementById('edit-contador-biografia');
const editErrorMessage = document.getElementById('error-message-edit');
const editCepInput = document.getElementById('edit-cep');
const editCidadeInput = document.getElementById('edit-cidade');
const editEstadoInput = document.getElementById('edit-estado');
const editNumeroInput = document.getElementById('edit-numero');
const editSemNumeroCheckbox = document.getElementById('edit-sem-numero');

// Variável para guardar o tipo de usuário original
let currentUserType = '';
let currentUserId = '';

// Função para popular o formulário de edição
function populateEditForm(userData) {
    document.getElementById('edit-nome-completo').value = userData.nomeCompleto;
    document.getElementById('edit-email').value = userData.email;
    document.getElementById('edit-cpf').value = userData.cpf;
    document.getElementById('edit-telefone').value = userData.telefone;
    document.getElementById('edit-cep').value = userData.cep;
    document.getElementById('edit-cidade').value = userData.cidade;
    document.getElementById('edit-estado').value = userData.estado;
    document.getElementById('edit-rua').value = userData.rua;
    document.getElementById('edit-numero').value = userData.numero === 'N/A' ? '' : userData.numero;
    document.getElementById('edit-sem-numero').checked = userData.semNumero;
    
    if (userData.tipoUsuario === 'pintor') {
        document.getElementById('edit-rede-social').value = userData.linkRedeSocial || '';
        document.getElementById('edit-experiencia').value = userData.tempoExperiencia || '';
        document.getElementById('edit-unidade-experiencia').value = userData.unidadeExperiencia || 'anos';
        document.getElementById('edit-biografia').value = userData.biografia || '';
        editBioCounter.textContent = `${(userData.biografia || '').length}/200`;
    }

    editTipoUsuario.value = userData.tipoUsuario;
}

// Alterna a visibilidade do formulário de pintor
function togglePintorFields() {
    if (editTipoUsuario.value === 'pintor') {
        editPintorFields.classList.remove('hidden');
    } else {
        editPintorFields.classList.add('hidden');
    }
}

// Lógica de mascaras de input
if (editCepInput) {
    new IMask(editCepInput, { mask: '00000-000' });
    editCepInput.addEventListener('blur', async (e) => {
        const cepLimpo = e.target.value.replace(/\D/g, '');
        if (cepLimpo.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    editCidadeInput.value = data.localidade;
                    editEstadoInput.value = data.uf;
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
            }
        }
    });
}

// Mostra/esconde o formulário de edição
if (editProfileButton && cancelEditButton) {
    editProfileButton.addEventListener('click', () => {
        profileView.classList.add('hidden');
        editFormContainer.classList.remove('hidden');
    });

    cancelEditButton.addEventListener('click', () => {
        editFormContainer.classList.add('hidden');
        profileView.classList.remove('hidden');
    });
}

// Atualiza o contador de caracteres
if (editBio) {
    editBio.addEventListener('input', (e) => {
        editBioCounter.textContent = `${e.target.value.length}/200`;
    });
}

// Altera os campos visíveis ao mudar o tipo de usuário no formulário
if (editTipoUsuario) {
    editTipoUsuario.addEventListener('change', togglePintorFields);
}

// Lógica de submissão do formulário de edição
if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(editErrorMessage);

        const newType = editTipoUsuario.value;
        const dadosComuns = {
            nomeCompleto: document.getElementById('edit-nome-completo').value,
            email: document.getElementById('edit-email').value,
            cpf: document.getElementById('edit-cpf').value,
            telefone: document.getElementById('edit-telefone').value.replace(/\D/g, ''),
            cep: document.getElementById('edit-cep').value.replace(/\D/g, ''),
            cidade: document.getElementById('edit-cidade').value,
            estado: document.getElementById('edit-estado').value,
            rua: document.getElementById('edit-rua').value,
            numero: editSemNumeroCheckbox.checked ? 'N/A' : editNumeroInput.value,
            semNumero: editSemNumeroCheckbox.checked,
            tipoUsuario: newType
        };

        const dadosPintor = {
            linkRedeSocial: document.getElementById('edit-rede-social').value,
            tempoExperiencia: parseInt(document.getElementById('edit-experiencia').value) || 0,
            unidadeExperiencia: document.getElementById('edit-unidade-experiencia').value,
            biografia: document.getElementById('edit-biografia').value
        };

        const dadosCompletos = { ...dadosComuns };
        if (newType === 'pintor') {
            Object.assign(dadosCompletos, dadosPintor);
        }

        try {
            // Se o tipo de usuário mudou
            if (newType !== currentUserType) {
                // 1. Apaga os dados da coleção antiga
                await db.collection(currentUserType + 's').doc(currentUserId).delete();
                
                // 2. Adiciona os dados na nova coleção
                await db.collection(newType + 's').doc(currentUserId).set(dadosCompletos);

                // 3. Atualiza o tipo de usuário no registro de CPF
                await db.collection('cpf_registry').doc(dadosComuns.cpf).update({
                    userType: newType
                });

            } else { // Se o tipo de usuário não mudou, apenas atualiza
                await db.collection(newType + 's').doc(currentUserId).update(dadosCompletos);
            }
            
            alert('Perfil atualizado com sucesso!');
            window.location.reload(); // Recarrega a página para ver as mudanças
        } catch (error) {
            showError("Erro ao salvar as alterações: " + error.message, editErrorMessage);
            console.error("Erro ao salvar alterações:", error);
        }
    });
}

// Lógica de verificação de autenticação e preenchimento de perfil
if (profileContainer) {
    const userNameSpan = document.getElementById('user-name');
    const userEmailSpan = document.getElementById('user-email');
    const userTypeSpan = document.getElementById('user-type');
    const userCpfSpan = document.getElementById('user-cpf');
    const userPhoneSpan = document.getElementById('user-phone');
    const logoutButton = document.getElementById('logout-button');

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUserId = user.uid;
            
            const cpfQuery = await db.collection('cpf_registry').where('userId', '==', user.uid).limit(1).get();
            if (!cpfQuery.empty) {
                currentUserType = cpfQuery.docs[0].data().userType;
                
                const userDoc = await db.collection(currentUserType + 's').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    
                    // Preenche a visualização do perfil
                    userNameSpan.textContent = userData.nomeCompleto;
                    userEmailSpan.textContent = userData.email;
                    userTypeSpan.textContent = userData.tipoUsuario;
                    userCpfSpan.textContent = userData.cpf;
                    userPhoneSpan.textContent = userData.telefone;
                    
                    // Se for um pintor, mostra os campos adicionais
                    if (userData.tipoUsuario === 'pintor') {
                        const pintorInfoHtml = `
                            <p><strong>Rede Social:</strong> <a href="${userData.linkRedeSocial}" target="_blank">${userData.linkRedeSocial}</a></p>
                            <p><strong>Experiência:</strong> ${userData.tempoExperiencia} ${userData.unidadeExperiencia}</p>
                            <p><strong>Biografia:</strong> ${userData.biografia}</p>
                        `;
                        document.getElementById('profile-info').innerHTML += pintorInfoHtml;
                    }
                    
                    // Preenche o formulário de edição
                    populateEditForm(userData);
                    togglePintorFields();
                }
            } else {
                console.error("Tipo de usuário não encontrado.");
            }
        } else {
            window.location.href = 'login.html';
        }
    });

    logoutButton.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    });
}
