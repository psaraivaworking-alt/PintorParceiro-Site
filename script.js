// script.js - CÓDIGO UNIFICADO PARA TODAS AS PÁGINAS

// ----------------------------------------------------
// 1. CONFIGURAÇÃO DO FIREBASE
// ----------------------------------------------------

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// SUAS CREDENCIAIS AQUI
const firebaseConfig = {
    apiKey: "AIzaSyCmuGFCKnZ-qBVUpDxs6moJis19lx8nvXw",
    authDomain: "pintordata.firebaseapp.com",
    projectId: "pintordata",
    storageBucket: "pintordata.firebasestorage.app",
    messagingSenderId: "994883381349",
    appId: "1:994883381349:web:b802e44d49d6f6f163fe8c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

    document.addEventListener('DOMContentLoaded', () => {
        if (typeof IMask !== 'undefined') {
            new IMask(inputCpfPintor, { mask: '000.000.000-00' });
            new IMask(inputTelefonePintor, { mask: '(00) 00000-0000' });
            new IMask(inputCepPintor, { mask: '00000-000' });
            new IMask(inputCpfCliente, { mask: '000.000.000-00' });
            new IMask(inputTelefoneCliente, { mask: '(00) 00000-0000' });
            new IMask(inputCepCliente, { mask: '00000-000' });
        }
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
            numero: checkboxSemNumeroPintor.checked ? 'N/A' : inputNumeroPintor.value,
            semNumero: checkboxSemNumeroPintor.checked,
            linkRedeSocial: document.getElementById('rede-social-pintor').value,
            tempoExperiencia: parseInt(document.getElementById('experiencia-pintor').value) || 0,
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

            const userCredential = await createUserWithEmailAndPassword(auth, dados.email, dados.senha);
            const userId = userCredential.user.uid;

            await setDoc(doc(db, 'pintores', userId), {
                ...dados,
                senha: null,
                confirmarSenha: null
            });

            await setDoc(doc(db, 'cpf_registry', dados.cpf), {
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
            numero: checkboxSemNumeroCliente.checked ? 'N/A' : inputNumeroCliente.value,
            semNumero: checkboxSemNumeroCliente.checked,
            tipoUsuario: 'cliente',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (dados.senha !== dados.confirmarSenha) {
            showError('As senhas não coincidem!', errorMessageCliente);
            return false;
        }

        try {
            const cpfDoc = await getDoc(doc(db, 'cpf_registry', dados.cpf));
            if (cpfDoc.exists()) {
                showError('Este CPF já está cadastrado na plataforma.', errorMessageCliente);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, dados.email, dados.senha);
            const userId = userCredential.user.uid;

            await setDoc(doc(db, 'clientes', userId), {
                ...dados,
                senha: null,
                confirmarSenha: null
            });

            await setDoc(doc(db, 'cpf_registry', dados.cpf), {
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
            await signInWithEmailAndPassword(auth, email, senha);
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

// ----------------------------------------------------
// 5. LÓGICA DO PERFIL (EDITAR, SAIR, EXCLUIR)
// ----------------------------------------------------
const profileContainer = document.querySelector('.profile-container');
const profileView = document.getElementById('profile-view');
const profileEdit = document.getElementById('profile-edit');
const editForm = document.getElementById('edit-form');
const editProfileButton = document.getElementById('edit-profile-button');
const cancelEditButton = document.getElementById('cancel-edit-button');
const logoutButton = document.getElementById('logout-button');
const deleteProfileButton = document.getElementById('delete-profile-button');

if (profileContainer) {
    let currentUserType = null;
    let currentUserId = null;

    // Função para carregar e exibir os dados do perfil
    const loadProfileData = async (user) => {
        try {
            // Busca o tipo de usuário no 'cpf_registry'
            const cpfDoc = await getDoc(doc(db, 'cpf_registry', user.uid));
            if (!cpfDoc.exists()) {
                console.error("ERRO: Tipo de usuário não encontrado para o UID:", user.uid);
                // Se não encontrar, redireciona para o login ou cadastro
                window.location.href = 'login.html';
                return;
            }
            currentUserType = cpfDoc.data().userType;

            // Define o nome da coleção com base no tipo de usuário
            const collectionName = currentUserType === 'pintor' ? 'pintores' : 'clientes';

            // Busca os dados do perfil na coleção correta
            const userDoc = await getDoc(doc(db, collectionName, user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();

                // Preenche os campos de visualização
                document.getElementById('user-name').textContent = userData.nomeCompleto || 'Não informado';
                document.getElementById('user-email').textContent = userData.email || 'Não informado';
                document.getElementById('user-phone').textContent = userData.telefone || 'Não informado';

                // Preenche os campos de edição
                document.getElementById('edit-name').value = userData.nomeCompleto || '';
                document.getElementById('edit-phone').value = userData.telefone || '';
                
                // Campos específicos para pintores
                const pintorFieldsView = document.getElementById('pintor-fields-view');
                const pintorFieldsEdit = document.getElementById('pintor-fields-edit');
                if (currentUserType === 'pintor') {
                    pintorFieldsView.style.display = 'block';
                    pintorFieldsEdit.style.display = 'block';
                    document.getElementById('user-bio').textContent = userData.biografia || 'Não informado';
                    document.getElementById('user-experience').textContent = `${userData.tempoExperiencia || '0'} ${userData.unidadeExperiencia || 'anos'}`;
                    document.getElementById('edit-bio').value = userData.biografia || '';
                    document.getElementById('edit-experience').value = userData.tempoExperiencia || '';
                    document.getElementById('edit-unidade-exp').value = userData.unidadeExperiencia || 'anos';
                    const socialLink = document.getElementById('user-social-link');
                    socialLink.href = userData.linkRedeSocial || '#';
                    socialLink.textContent = userData.linkRedeSocial ? 'Ver Perfil Social' : 'Não informado';
                } else {
                    pintorFieldsView.style.display = 'none';
                    pintorFieldsEdit.style.display = 'none';
                }
            } else {
                console.error("ERRO: Documento do usuário não encontrado no Firestore.");
            }
        } catch (error) {
            console.error("Erro ao carregar os dados do perfil:", error);
        }
    };

    // Observador de estado de autenticação
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            console.log("Usuário autenticado:", currentUserId);
            // Redireciona para o perfil, mas apenas se a página atual não for 'perfil.html'
            if (window.location.pathname.split('/').pop() !== 'perfil.html') {
                 // Essa lógica é importante se você tem um script único para todas as páginas
                 // window.location.href = 'perfil.html';
            } else {
                 loadProfileData(user);
            }
        } else {
            // Se o usuário não estiver logado, redireciona para a página de login
            console.log("Nenhum usuário logado. Redirecionando para login.html");
            window.location.href = 'login.html';
        }
    });

    // Botão para entrar no modo de edição
    editProfileButton.addEventListener('click', () => {
        profileView.classList.add('hidden');
        profileEdit.classList.remove('hidden');
    });

    // Botão para cancelar a edição
    cancelEditButton.addEventListener('click', () => {
        profileEdit.classList.add('hidden');
        profileView.classList.remove('hidden');
        // Opcional: recarregar os dados originais se a edição for cancelada
        // loadProfileData(auth.currentUser);
    });

    // Envio do formulário de edição
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newDados = {
            nomeCompleto: document.getElementById('edit-name').value,
            telefone: document.getElementById('edit-phone').value,
            // Campos de pintor, se aplicável
            biografia: document.getElementById('edit-bio').value,
            tempoExperiencia: parseInt(document.getElementById('edit-experience').value) || 0,
            unidadeExperiencia: document.getElementById('edit-unidade-exp').value,
            linkRedeSocial: document.getElementById('edit-social').value,
        };

        try {
            const collectionName = currentUserType === 'pintor' ? 'pintores' : 'clientes';
            await updateDoc(doc(db, collectionName, currentUserId), newDados);
            
            console.log("Perfil atualizado com sucesso!");
            alert("Seu perfil foi atualizado com sucesso!");
            
            // Retorna para o modo de visualização e recarrega os dados
            profileEdit.classList.add('hidden');
            profileView.classList.remove('hidden');
            loadProfileData(auth.currentUser);

        } catch (error) {
            console.error("Erro ao atualizar o perfil:", error);
            alert("Erro ao atualizar o perfil. Tente novamente.");
        }
    });

    // Botão para fazer logout
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            alert("Erro ao sair. Tente novamente.");
        }
    });

    // Botão para excluir o perfil
    deleteProfileButton.addEventListener('click', async () => {
        if (confirm("ATENÇÃO: Você tem certeza que deseja excluir seu perfil? Esta ação é irreversível.")) {
            try {
                // Para excluir a conta, o usuário precisa ser reautenticado
                // Isso geralmente requer um popup de login ou um campo de senha
                const credential = EmailAuthProvider.credential(auth.currentUser.email, prompt("Por favor, insira sua senha para confirmar:"));
                await reauthenticateWithCredential(auth.currentUser, credential);
                
                // Exclui o documento no Firestore
                const collectionName = currentUserType === 'pintor' ? 'pintores' : 'clientes';
                await deleteDoc(doc(db, collectionName, currentUserId));

                // Exclui o registro de CPF
                // (Você precisaria buscar o CPF do usuário primeiro para usar doc(db, 'cpf_registry', userCpf))
                // Por simplicidade, vamos pular a exclusão do registro de CPF neste exemplo, mas é uma boa prática
                
                // Exclui a conta do usuário no Firebase Auth
                await auth.currentUser.delete();

                alert("Seu perfil foi excluído com sucesso. Você será redirecionado para a página inicial.");
                window.location.href = 'index.html';

            } catch (error) {
                console.error("Erro ao excluir o perfil:", error);
                alert("Erro ao excluir o perfil. Verifique sua senha e tente novamente. (Erro: " + error.message + ")");
            }
        }
    });
}
