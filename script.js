// script.js - CÓDIGO UNIFICADO PARA TODAS AS PÁGINAS

// ----------------------------------------------------
// 1. CONFIGURAÇÃO DO FIREBASE E IMPORTAÇÕES
// ----------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// SUAS CREDENCIAIS AQUI
const firebaseConfig = {
    apiKey: "AIzaSyBDNb5W_CxnPvyR6J7KSG0j6mTLgdTwZBs",
    authDomain: "dadospintorparceiroveloz.firebaseapp.com",
    projectId: "dadospintorparceiroveloz",
    storageBucket: "dadospintorparceiroveloz.firebasestorage.app",
    messagingSenderId: "688575061008",
    appId: "1:688575061008:web:29fc2dbe6f5cab66893e95"
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

// Função para buscar dados de endereço a partir de um CEP
async function buscarCep(cep, cidadeInput, estadoInput) {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
        if (cidadeInput) cidadeInput.value = '';
        if (estadoInput) estadoInput.value = '';
        return null;
    }
    
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
            if (cidadeInput) cidadeInput.value = data.localidade;
            if (estadoInput) estadoInput.value = data.uf;
            return { cidade: data.localidade, estado: data.uf };
        } else {
            if (cidadeInput) cidadeInput.value = '';
            if (estadoInput) estadoInput.value = '';
            return null;
        }
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        return null;
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
    
    // Altera entre os formulários de pintor e cliente
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

    // Aplica máscaras aos campos de entrada
    if (typeof IMask !== 'undefined') {
        new IMask(inputCpfPintor, { mask: '000.000.000-00' });
        new IMask(inputTelefonePintor, { mask: '(00) 00000-0000' });
        new IMask(inputCepPintor, { mask: '00000-000' });
        new IMask(inputCpfCliente, { mask: '000.000.000-00' });
        new IMask(inputTelefoneCliente, { mask: '(00) 00000-0000' });
        new IMask(inputCepCliente, { mask: '00000-000' });
    }
    
    // Adiciona eventos de clique para os botões de tipo de usuário
    btnPintor.addEventListener('click', () => alternarFormulario('pintor'));
    btnCliente.addEventListener('click', () => alternarFormulario('cliente'));

    // Adiciona evento para buscar o endereço pelo CEP
    inputCepPintor.addEventListener('blur', (e) => buscarCep(e.target.value, inputCidadePintor, inputEstadoPintor));
    inputCepCliente.addEventListener('blur', (e) => buscarCep(e.target.value, inputCidadeCliente, inputEstadoCliente));

    // Lógica para o campo "sem número"
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

    // Contador de caracteres da biografia
    if (biografiaPintor) {
        biografiaPintor.addEventListener('input', (e) => {
            const charCount = e.target.value.length;
            contadorBio.textContent = `${charCount}/200`;
        });
    }

    // Lógica de submissão do formulário do pintor
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
            createdAt: serverTimestamp()
        };
        
        if (dados.senha !== dados.confirmarSenha) {
            showError('As senhas não coincidem!', errorMessagePintor);
            return false;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, dados.email, dados.senha);
            const userId = userCredential.user.uid;

            await setDoc(doc(db, 'pintores', userId), {
                ...dados,
                senha: null,
                confirmarSenha: null
            });

            await setDoc(doc(db, 'cpf_registry', userId), {
                userId: userId,
                userType: 'pintor'
            });

            alert('Cadastro realizado com sucesso! Você será redirecionado para a página de login.');
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

    // Lógica de submissão do formulário do cliente
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
            createdAt: serverTimestamp()
        };
        
        if (dados.senha !== dados.confirmarSenha) {
            showError('As senhas não coincidem!', errorMessageCliente);
            return false;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, dados.email, dados.senha);
            const userId = userCredential.user.uid;

            await setDoc(doc(db, 'clientes', userId), {
                ...dados,
                senha: null,
                confirmarSenha: null
            });

            await setDoc(doc(db, 'cpf_registry', userId), {
                userId: userId,
                userType: 'cliente'
            });

            alert('Cadastro realizado com sucesso! Você será redirecionado para a página de login.');
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

    // Lógica de submissão do formulário de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(errorMessage);

        const email = emailInput.value;
        const senha = senhaInput.value;

        try {
            await signInWithEmailAndPassword(auth, email, senha);
        } catch (error) {
            let message = 'Erro no login. Verifique seu e-mail e senha.';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                message = 'E-mail ou senha inválidos.';
            } else if (error.code === 'auth/invalid-email') {
                message = 'Formato de e-mail inválido.';
            }
            showError(message, errorMessage);
            console.error("Erro no login:", error);
        }
    });

    // Lógica para redefinir a senha
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

// Máscaras para a página de edição de perfil
if (typeof IMask !== 'undefined' && editForm) {
    const editTelefone = document.getElementById('edit-phone');
    const editCep = document.getElementById('edit-cep');
    new IMask(editTelefone, { mask: '(00) 00000-0000' });
    new IMask(editCep, { mask: '00000-000' });
    
    const editCidade = document.getElementById('edit-cidade');
    const editEstado = document.getElementById('edit-estado');
    editCep.addEventListener('blur', (e) => buscarCep(e.target.value, editCidade, editEstado));
}

// Observa o estado da autenticação (se o usuário está logado ou não)
onAuthStateChanged(auth, async (user) => {
    const isLoginPage = window.location.pathname.endsWith('login.html');
    const isCadastroPage = window.location.pathname.endsWith('cadastro.html');
    const isPerfilPage = window.location.pathname.endsWith('perfil.html');
    const navPerfil = document.getElementById('nav-perfil');
    
    // Atualiza o link do menu de navegação
    if (user) {
        navPerfil.classList.remove('hidden');
    } else {
        navPerfil.classList.add('hidden');
    }

    // Redireciona usuários logados das páginas de login/cadastro
    if (user) {
        if (isLoginPage || isCadastroPage) {
            window.location.href = 'perfil.html';
            return;
        }
        
        // Carrega os dados do perfil se o usuário estiver na página correta
        if (isPerfilPage) {
            const loadProfileData = async (user) => {
                try {
                    const cpfDoc = await getDoc(doc(db, 'cpf_registry', user.uid));
                    if (!cpfDoc.exists()) {
                        console.error("ERRO: Tipo de usuário não encontrado. Redirecionando para login.");
                        await signOut(auth);
                        window.location.href = 'login.html';
                        return;
                    }

                    const currentUserType = cpfDoc.data().userType;
                    const collectionName = currentUserType === 'pintor' ? 'pintores' : 'clientes';
                    const userDoc = await getDoc(doc(db, collectionName, user.uid));

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // Preenche os campos de visualização
                        document.getElementById('user-name').textContent = userData.nomeCompleto || 'Não informado';
                        document.getElementById('user-email').textContent = userData.email || 'Não informado';
                        document.getElementById('user-phone').textContent = userData.telefone || 'Não informado';
                        document.getElementById('user-address').textContent = `${userData.rua || 'Não informado'}, ${userData.numero || ''} - ${userData.cidade || ''}, ${userData.estado || ''}`;
                        
                        // Preenche os campos de edição
                        document.getElementById('edit-name').value = userData.nomeCompleto || '';
                        document.getElementById('edit-email').value = userData.email || '';
                        document.getElementById('edit-phone').value = userData.telefone || '';
                        document.getElementById('edit-cep').value = userData.cep || '';
                        document.getElementById('edit-cidade').value = userData.cidade || '';
                        document.getElementById('edit-estado').value = userData.estado || '';
                        document.getElementById('edit-rua').value = userData.rua || '';
                        document.getElementById('edit-numero').value = userData.numero || '';
                        
                        // Mostra/oculta campos específicos do pintor
                        const pintorFieldsView = document.querySelectorAll('#pintor-fields-view');
                        const pintorFieldsEdit = document.querySelectorAll('#pintor-fields-edit');

                        if (currentUserType === 'pintor') {
                            pintorFieldsView.forEach(el => el.style.display = 'block');
                            pintorFieldsEdit.forEach(el => el.style.display = 'block');
                            document.getElementById('user-bio').textContent = userData.biografia || 'Não informado';
                            document.getElementById('user-experience').textContent = `${userData.tempoExperiencia || '0'} ${userData.unidadeExperiencia || 'anos'}`;
                            document.getElementById('edit-social').value = userData.linkRedeSocial || '';
                            document.getElementById('edit-bio').value = userData.biografia || '';
                            document.getElementById('edit-experience').value = userData.tempoExperiencia || '';
                            document.getElementById('edit-unidade-exp').value = userData.unidadeExperiencia || 'anos';
                        } else {
                            pintorFieldsView.forEach(el => el.style.display = 'none');
                            pintorFieldsEdit.forEach(el => el.style.display = 'none');
                        }
                    } else {
                        console.error("ERRO: Documento do usuário não encontrado no Firestore.");
                        await signOut(auth);
                        window.location.href = 'login.html';
                        return;
                    }
                } catch (error) {
                    console.error("Erro ao carregar os dados do perfil:", error);
                }
            };
            loadProfileData(user);
        }
    } else {
        // Redireciona usuários não logados da página de perfil
        if (isPerfilPage) {
            window.location.href = 'login.html';
        }
    }
});

// Lógica para alternar entre visualização e edição
if (profileContainer) {
    editProfileButton.addEventListener('click', () => {
        profileView.classList.add('hidden');
        profileEdit.classList.remove('hidden');
    });

    cancelEditButton.addEventListener('click', () => {
        profileEdit.classList.add('hidden');
        profileView.classList.remove('hidden');
        location.reload();
    });

    // Lógica para salvar as alterações do perfil
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = auth.currentUser;
        if (!user) {
            alert('Nenhum usuário logado.');
            return;
        }

        const cpfDoc = await getDoc(doc(db, 'cpf_registry', user.uid));
        const currentUserType = cpfDoc.data().userType;
        const collectionName = currentUserType === 'pintor' ? 'pintores' : 'clientes';

        let newDados = {
            telefone: document.getElementById('edit-phone').value,
            cep: document.getElementById('edit-cep').value,
            cidade: document.getElementById('edit-cidade').value,
            estado: document.getElementById('edit-estado').value,
            rua: document.getElementById('edit-rua').value,
            numero: document.getElementById('edit-numero').value,
        };

        if (currentUserType === 'pintor') {
            newDados.linkRedeSocial = document.getElementById('edit-social').value;
            newDados.biografia = document.getElementById('edit-bio').value;
            newDados.tempoExperiencia = parseInt(document.getElementById('edit-experience').value) || 0;
            newDados.unidadeExperiencia = document.getElementById('edit-unidade-exp').value;
        }

        try {
            await updateDoc(doc(db, collectionName, user.uid), newDados);
            
            alert("Seu perfil foi atualizado com sucesso!");
            location.reload();
        } catch (error) {
            console.error("Erro ao atualizar o perfil:", error);
            alert("Erro ao atualizar o perfil. Tente novamente.");
        }
    });

    // Lógica para sair da conta
    logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            alert("Erro ao sair. Tente novamente.");
        }
    });

    // Lógica para excluir o perfil
    deleteProfileButton.addEventListener('click', async () => {
        if (confirm("ATENÇÃO: Você tem certeza que deseja excluir seu perfil? Esta ação é irreversível.")) {
            try {
                const credential = EmailAuthProvider.credential(auth.currentUser.email, prompt("Por favor, insira sua senha para confirmar:"));
                await reauthenticateWithCredential(auth.currentUser, credential);
                
                const user = auth.currentUser;
                const cpfDoc = await getDoc(doc(db, 'cpf_registry', user.uid));
                const currentUserType = cpfDoc.data().userType;
                const collectionName = currentUserType === 'pintor' ? 'pintores' : 'clientes';
                
                await deleteDoc(doc(db, collectionName, user.uid));
                await user.delete();

                alert("Seu perfil foi excluído com sucesso. Você será redirecionado para a página inicial.");
                window.location.href = 'index.html';

            } catch (error) {
                console.error("Erro ao excluir o perfil:", error);
                alert("Erro ao excluir o perfil. Verifique sua senha e tente novamente. (Erro: " + error.message + ")");
            }
        }
    });
}

// ----------------------------------------------------
// 6. LÓGICA DE BUSCA (EXECUTADA APENAS EM busca.html)
// ----------------------------------------------------
const formBusca = document.getElementById('form-busca');

if (formBusca) {
    const cepBuscaInput = document.getElementById('cep-busca');
    const resultadosBuscaDiv = document.getElementById('resultados-busca');
    const noResultsDiv = document.getElementById('no-results');
    const errorMessageBusca = document.getElementById('error-message-busca');

    if (typeof IMask !== 'undefined') {
        new IMask(cepBuscaInput, { mask: '00000-000' });
    }

    // Lógica de submissão do formulário de busca
    formBusca.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(errorMessageBusca);
        resultadosBuscaDiv.innerHTML = ''; // Limpa os resultados anteriores
        noResultsDiv.style.display = 'none';

        const cep = cepBuscaInput.value.replace(/\D/g, '');
        const tipoBusca = document.querySelector('input[name="tipo-busca"]:checked').value;
        
        let q;
        let buscaValor;

        // Determina o tipo de busca (por CEP ou por cidade)
        if (tipoBusca === 'cep') {
            buscaValor = cep;
            q = query(collection(db, 'pintores'), where('cep', '==', buscaValor));
        } else { // 'cidade'
            const resultadoCep = await buscarCep(cep);
            if (!resultadoCep) {
                showError('CEP não encontrado ou inválido.', errorMessageBusca);
                return;
            }
            buscaValor = resultadoCep.cidade;
            q = query(collection(db, 'pintores'), where('cidade', '==', buscaValor));
        }

        try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                noResultsDiv.style.display = 'block';
            } else {
                querySnapshot.forEach((doc) => {
                    const pintor = doc.data();
                    const pintorCard = document.createElement('div');
                    pintorCard.classList.add('pintor-card');
                    // Cria o card de resultados com as informações do pintor
                    pintorCard.innerHTML = `
                        <h3>${pintor.nomeCompleto}</h3>
                        <p><strong>Telefone:</strong> ${pintor.telefone}</p>
                        <p><strong>Experiência:</strong> ${pintor.tempoExperiencia} ${pintor.unidadeExperiencia}</p>
                        <p><strong>Biografia:</strong> ${pintor.biografia}</p>
                        <p><strong>Localidade:</strong> ${pintor.cidade}, ${pintor.estado}</p>
                    `;
                    resultadosBuscaDiv.appendChild(pintorCard);
                });
            }
        } catch (error) {
            console.error("Erro ao buscar pintores:", error);
            showError('Erro ao buscar pintores. Tente novamente mais tarde.', errorMessageBusca);
        }
    });
}
