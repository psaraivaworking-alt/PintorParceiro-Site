// script.js - CÓDIGO UNIFICADO PARA TODAS AS PÁGINAS

// ----------------------------------------------------
// 1. CONFIGURAÇÃO DO FIREBASE E IMPORTAÇÕES
// ----------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// SUAS NOVAS CREDENCIAIS AQUI
const firebaseConfig = {
  apiKey: "AIzaSyAp0l5SjZa04EXDOK8tijYYspv4HOm003U",
  authDomain: "pintordata-b279b.firebaseapp.com",
  projectId: "pintordata-b279b",
  storageBucket: "pintordata-b279b.firebasestorage.app",
  messagingSenderId: "637329209702",
  appId: "1:637329209702:web:ff2dec46880b1ae79430a7"
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
        if (cidadeInput) cidadeInput.value = '';
        if (estadoInput) estadoInput.value = '';
        return null;
    }
    
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
            if (cidadeInput) {
                cidadeInput.value = data.localidade;
                cidadeInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (estadoInput) {
                estadoInput.value = data.uf;
                estadoInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
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

if (formPintor) {
    const contadorBio = document.getElementById('contador-biografia-pintor');
    const biografiaPintor = document.getElementById('biografia-pintor');
    const errorMessagePintor = document.getElementById('error-message-pintor');

    const inputCpfPintor = document.getElementById('cpf-pintor');
    const inputTelefonePintor = document.getElementById('telefone-pintor');
    const inputCepPintor = document.getElementById('cep-pintor');
    const inputCidadePintor = document.getElementById('cidade-pintor');
    const inputEstadoPintor = document.getElementById('estado-pintor');
    const inputNumeroPintor = document.getElementById('numero-pintor');
    const checkboxSemNumeroPintor = document.getElementById('sem-numero-pintor');
    
    // Aplica máscaras aos campos de entrada
    if (typeof IMask !== 'undefined') {
        new IMask(inputCpfPintor, { mask: '000.000.000-00' });
        new IMask(inputTelefonePintor, { mask: '(00) 00000-0000' });
        new IMask(inputCepPintor, { mask: '00000-000' });
    }
    
    // Adiciona evento para buscar o endereço pelo CEP
    inputCepPintor.addEventListener('blur', (e) => buscarCep(e.target.value, inputCidadePintor, inputEstadoPintor));

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
}

// ----------------------------------------------------
// 4. LÓGICA DE LOGIN (EXECUTADA APENAS EM login.html)
// ----------------------------------------------------
const loginForm = document.getElementById('login-form');

if (loginForm) {
    const emailInput = document.getElementById('email-login');
    const senhaInput = document.getElementById('senha-login');
    const errorMessage = document.getElementById('error-message-login');

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
                    const userDoc = await getDoc(doc(db, 'pintores', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // Preenche os campos de visualização
                        document.getElementById('user-name').textContent = userData.nomeCompleto || 'Não informado';
                        document.getElementById('user-email').textContent = userData.email || 'Não informado';
                        document.getElementById('user-phone').textContent = userData.telefone || 'Não informado';
                        document.getElementById('user-address').textContent = `${userData.rua || 'Não informado'}, ${userData.numero || ''} - ${userData.cidade || ''}, ${userData.estado || ''}`;
                        document.getElementById('user-bio').textContent = userData.biografia || 'Não informado';
                        document.getElementById('user-experience').textContent = `${userData.tempoExperiencia || '0'} ${userData.unidadeExperiencia || 'anos'}`;
                        
                        // Preenche os campos de edição
                        document.getElementById('edit-name').value = userData.nomeCompleto || '';
                        document.getElementById('edit-email').value = userData.email || '';
                        document.getElementById('edit-phone').value = userData.telefone || '';
                        document.getElementById('edit-cep').value = userData.cep || '';
                        document.getElementById('edit-cidade').value = userData.cidade || '';
                        document.getElementById('edit-estado').value = userData.estado || '';
                        document.getElementById('edit-rua').value = userData.rua || '';
                        document.getElementById('edit-numero').value = userData.numero || '';
                        document.getElementById('edit-social').value = userData.linkRedeSocial || '';
                        document.getElementById('edit-bio').value = userData.biografia || '';
                        document.getElementById('edit-experience').value = userData.tempoExperiencia || '';
                        document.getElementById('edit-unidade-exp').value = userData.unidadeExperiencia || 'anos';
                    } else {
                        console.error("ERRO: Documento do usuário não encontrado no Firestore. Redirecionando para login.");
                        await signOut(auth);
                        window.location.href = 'login.html';
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

        let newDados = {
            telefone: document.getElementById('edit-phone').value,
            cep: document.getElementById('edit-cep').value,
            cidade: document.getElementById('edit-cidade').value,
            estado: document.getElementById('edit-estado').value,
            rua: document.getElementById('edit-rua').value,
            numero: document.getElementById('edit-numero').value,
            linkRedeSocial: document.getElementById('edit-social').value,
            biografia: document.getElementById('edit-bio').value,
            tempoExperiencia: parseInt(document.getElementById('edit-experience').value) || 0,
            unidadeExperiencia: document.getElementById('edit-unidade-exp').value,
        };

        try {
            await updateDoc(doc(db, 'pintores', user.uid), newDados);
            
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
                await deleteDoc(doc(db, 'pintores', user.uid));
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

    formBusca.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(errorMessageBusca);
        resultadosBuscaDiv.innerHTML = '';
        noResultsDiv.style.display = 'none';

        const cep = cepBuscaInput.value.replace(/\D/g, '');
        const tipoBusca = document.querySelector('input[name="tipo-busca"]:checked').value;
        
        let q;
        let buscaValor;

        if (tipoBusca === 'cep') {
            buscaValor = cep;
            q = query(collection(db, 'pintores'), where('cep', '==', buscaValor));
        } else {
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
