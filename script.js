// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    reauthenticateWithCredential,
    EmailAuthProvider,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import IMask from "https://unpkg.com/imask@6.0.7/dist/imask.min.js";

// --- Configuração do Firebase (FORNECIDA PELO USUÁRIO) ---
const firebaseConfig = {
    apiKey: "AIzaSyCmuGFCKnZ-qBVUpDxs6moJis19lx8nvXw",
    authDomain: "pintordata.firebaseapp.com",
    projectId: "pintordata",
    storageBucket: "pintordata.firebasestorage.app",
    messagingSenderId: "994883381349",
    appId: "1:994883381349:web:b802e44d49d6f6f163fe8c"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Variáveis globais
let currentUserType = ''; // 'pintor' ou 'cliente'
let currentUserId = null;

// --- Funções Utilitárias Globais ---

/**
 * Exibe uma mensagem de feedback na interface do usuário.
 * @param {string} message - A mensagem a ser exibida.
 * @param {'success' | 'error'} type - O tipo de mensagem (sucesso ou erro).
 * @param {HTMLElement} targetMessageBox - A caixa de mensagem específica para exibir a mensagem.
 */
function showMessage(message, type = 'error', targetMessageBoxId = 'message-box') {
    const targetMessageBox = document.getElementById(targetMessageBoxId);
    if (!targetMessageBox) return;

    targetMessageBox.textContent = message;
    targetMessageBox.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
    if (type === 'error') {
        targetMessageBox.classList.add('bg-red-100', 'text-red-700');
    } else {
        targetMessageBox.classList.add('bg-green-100', 'text-green-700');
    }
}

/**
 * Esconde a caixa de mensagens.
 * @param {HTMLElement} targetMessageBox - A caixa de mensagem específica para esconder.
 */
function hideMessage(targetMessageBoxId = 'message-box') {
    const targetMessageBox = document.getElementById(targetMessageBoxId);
    if (targetMessageBox) {
        targetMessageBox.classList.add('hidden');
    }
}

/**
 * Configura o toggle de visibilidade de senha para todos os elementos com a classe .toggle-password.
 */
function setupPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        // Evita anexar múltiplos event listeners se a função for chamada mais de uma vez
        if (!toggle.dataset.listenerAttached) {
            toggle.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.textContent = type === 'password' ? '👁️' : '🔒'; // Altera o ícone
            });
            toggle.dataset.listenerAttached = 'true'; // Marca que o listener foi anexado
        }
    });
}

// --- Lógica Específica para cada Página ---

/**
 * Inicializa a página de Cadastro.
 */
function initCadastroPage() {
    const btnPintor = document.getElementById('btn-pintor');
    const btnCliente = document.getElementById('btn-cliente');
    const pintorFields = document.getElementById('pintor-fields');
    const cadastroForm = document.getElementById('cadastro-form');
    const bioTextarea = document.getElementById('bio');
    const bioCharCount = document.getElementById('bio-char-count');
    const submitButton = document.getElementById('submit-button');

    // Máscaras com IMask.js
    IMask(document.getElementById('cpf'), { mask: '000.000.000-00' });
    IMask(document.getElementById('phone'), { mask: '(00) 00000-0000' });
    IMask(document.getElementById('cep'), { mask: '00000-000' });

    // Alternar entre Pintor e Cliente
    btnPintor.addEventListener('click', () => {
        currentUserType = 'pintor';
        pintorFields.classList.remove('hidden');
        btnPintor.classList.add('bg-blue-600', 'hover:bg-blue-700', 'text-white');
        btnPintor.classList.remove('bg-gray-200', 'hover:bg-gray-300', 'text-gray-700');
        btnCliente.classList.add('bg-gray-200', 'hover:bg-gray-300', 'text-gray-700');
        btnCliente.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'text-white');

        // Marcar campos específicos de pintor como required
        document.getElementById('experience-value').setAttribute('required', 'true');
        document.getElementById('experience-unit').setAttribute('required', 'true');
        document.getElementById('bio').setAttribute('required', 'true');
        // Opcional
        document.getElementById('social-link').removeAttribute('required');
    });

    btnCliente.addEventListener('click', () => {
        currentUserType = 'cliente';
        pintorFields.classList.add('hidden');
        btnCliente.classList.add('bg-blue-600', 'hover:bg-blue-700', 'text-white');
        btnCliente.classList.remove('bg-gray-200', 'hover:bg-gray-300', 'text-gray-700');
        btnPintor.classList.add('bg-gray-200', 'hover:bg-gray-300', 'text-gray-700');
        btnPintor.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'text-white');

        // Marcar campos específicos de pintor como não required
        document.getElementById('experience-value').removeAttribute('required');
        document.getElementById('experience-unit').removeAttribute('required');
        document.getElementById('bio').removeAttribute('required');
        document.getElementById('social-link').removeAttribute('required');
    });

    // Contador de caracteres da biografia
    if (bioTextarea && bioCharCount) {
        bioTextarea.addEventListener('input', () => {
            const currentLength = bioTextarea.value.length;
            bioCharCount.textContent = `${currentLength}/200 caracteres`;
        });
    }


    // Busca de CEP com ViaCEP
    document.getElementById('cep').addEventListener('blur', async (event) => {
        const cep = event.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (data.erro) {
                    showMessage('CEP não encontrado.', 'error');
                    document.getElementById('address-city').value = '';
                    document.getElementById('address-state').value = '';
                    document.getElementById('address-street').value = '';
                } else {
                    document.getElementById('address-street').value = data.logradouro;
                    document.getElementById('address-city').value = data.localidade;
                    document.getElementById('address-state').value = data.uf;
                    hideMessage();
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
                showMessage('Erro ao buscar CEP. Tente novamente.', 'error');
            }
        } else if (cep.length > 0) {
            showMessage('CEP inválido. Por favor, insira 8 dígitos.', 'error');
        }
    });

    // Validação e Envio do Formulário
    cadastroForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideMessage();
        submitButton.disabled = true;
        submitButton.textContent = 'Cadastrando...';

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const cpf = document.getElementById('cpf').value.replace(/\D/g, '');
        const phone = document.getElementById('phone').value.replace(/\D/g, '');
        const cep = document.getElementById('cep').value.replace(/\D/g, '');
        const street = document.getElementById('address-street').value.trim();
        const number = document.getElementById('address-number').value.trim();
        const complement = document.getElementById('address-complement').value.trim();
        const city = document.getElementById('address-city').value.trim();
        const state = document.getElementById('address-state').value.trim();

        // Validação de campos obrigatórios
        if (!name || !email || !password || !confirmPassword || !cpf || !phone || !cep || !street || !number || !city || !state) {
            showMessage('Por favor, preencha todos os campos obrigatórios.');
            submitButton.disabled = false;
            submitButton.textContent = 'Cadastrar';
            return;
        }

        // Validação de senhas
        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem.');
            submitButton.disabled = false;
            submitButton.textContent = 'Cadastrar';
            return;
        }
        if (password.length < 6) {
            showMessage('A senha deve ter no mínimo 6 caracteres.');
            submitButton.disabled = false;
            submitButton.textContent = 'Cadastrar';
            return;
        }

        // Validação de email (básica)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showMessage('Por favor, insira um e-mail válido.');
            submitButton.disabled = false;
            submitButton.textContent = 'Cadastrar';
            return;
        }

        let painterData = {};
        if (currentUserType === 'pintor') {
            const socialLink = document.getElementById('social-link').value.trim();
            const experienceValue = document.getElementById('experience-value').value.trim();
            const experienceUnit = document.getElementById('experience-unit').value;
            const bio = document.getElementById('bio').value.trim();

            if (!experienceValue || !bio) {
                showMessage('Por favor, preencha todos os campos obrigatórios para Pintor.');
                submitButton.disabled = false;
                submitButton.textContent = 'Cadastrar';
                return;
            }
            painterData = {
                socialLink: socialLink || null,
                experience: `${experienceValue} ${experienceUnit}`,
                bio: bio
            };
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userId = user.uid;

            const profileData = {
                uid: userId,
                name,
                email,
                cpf,
                phone,
                address: {
                    cep,
                    street,
                    number,
                    complement: complement || null,
                    city,
                    state
                },
                userType: currentUserType,
                ...painterData
            };

            await setDoc(doc(db, currentUserType === 'pintor' ? 'pintores' : 'clientes', userId), profileData);
            await setDoc(doc(db, 'cpf_registry', cpf), { uid: userId, userType: currentUserType });

            showMessage('Cadastro realizado com sucesso! Redirecionando para a página de login...', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error("Erro no cadastro:", error);
            let errorMessage = 'Ocorreu um erro desconhecido durante o cadastro. Tente novamente.';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Este e-mail já está em uso. Por favor, use outro e-mail.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Formato de e-mail inválido.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'A senha é muito fraca. Por favor, use uma senha com pelo menos 6 caracteres.';
            }
            showMessage(errorMessage);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Cadastrar';
        }
    });

    // Inicializa o estado dos botões e campos
    btnPintor.click();
}

/**
 * Inicializa a página de Login.
 */
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    const submitButton = document.getElementById('submit-button');

    // Envio do Formulário de Login
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideMessage();
        submitButton.disabled = true;
        submitButton.textContent = 'Entrando...';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        // Validação de campos obrigatórios
        if (!email || !password) {
            showMessage('Por favor, preencha todos os campos.');
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            showMessage('Login realizado com sucesso! Redirecionando...', 'success');
            setTimeout(() => {
                window.location.href = 'perfil.html';
            }, 1500);

        } catch (error) {
            console.error("Erro no login:", error);
            let errorMessage = 'Ocorreu um erro desconhecido. Tente novamente.';
            if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found') {
                errorMessage = 'E-mail não encontrado ou inválido.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Senha incorreta.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
            }
            showMessage(errorMessage);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
        }
    });
}

/**
 * Inicializa a página de Perfil.
 */
function initPerfilPage() {
    const profileView = document.getElementById('profile-view');
    const editProfileForm = document.getElementById('edit-profile-form');
    const pintorProfileView = document.getElementById('pintor-profile-view');
    const pintorEditFields = document.getElementById('pintor-edit-fields');

    const btnEditProfile = document.getElementById('btn-edit-profile');
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const btnSignOut = document.getElementById('btn-sign-out');
    const btnDeleteProfile = document.getElementById('btn-delete-profile');

    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const deletePasswordInput = document.getElementById('delete-password');

    const editBioTextarea = document.getElementById('edit-bio');
    const editBioCharCount = document.getElementById('edit-bio-char-count');

    // Máscaras para edição de perfil
    IMask(document.getElementById('edit-phone'), { mask: '(00) 00000-0000' });
    IMask(document.getElementById('edit-cep'), { mask: '00000-000' });

    // Contador de caracteres da biografia em edição
    if (editBioTextarea && editBioCharCount) {
        editBioTextarea.addEventListener('input', () => {
            const currentLength = editBioTextarea.value.length;
            editBioCharCount.textContent = `${currentLength}/200 caracteres`;
        });
    }

    // Busca de CEP com ViaCEP para edição
    document.getElementById('edit-cep').addEventListener('blur', async (event) => {
        const cep = event.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (data.erro) {
                    showMessage('CEP não encontrado.', 'error');
                    document.getElementById('edit-address-city').value = '';
                    document.getElementById('edit-address-state').value = '';
                    document.getElementById('edit-address-street').value = '';
                } else {
                    document.getElementById('edit-address-street').value = data.logradouro;
                    document.getElementById('edit-address-city').value = data.localidade;
                    document.getElementById('edit-address-state').value = data.uf;
                    hideMessage();
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
                showMessage('Erro ao buscar CEP. Tente novamente.', 'error');
            }
        } else if (cep.length > 0) {
            showMessage('CEP inválido. Por favor, insira 8 dígitos.', 'error');
        }
    });

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            // Busca o tipo de usuário na coleção cpf_registry
            const cpfRegistrySnapshot = await getDocs(query(collection(db, 'cpf_registry'), where('uid', '==', currentUserId)));
            if (!cpfRegistrySnapshot.empty) {
                const docData = cpfRegistrySnapshot.docs[0].data();
                currentUserType = docData.userType;

                // Busca os dados completos do perfil
                const profileRef = doc(db, currentUserType === 'pintor' ? 'pintores' : 'clientes', currentUserId);
                const profileSnap = await getDoc(profileRef);

                if (profileSnap.exists()) {
                    const profileData = profileSnap.data();
                    displayProfileData(profileData);
                    hideMessage();
                } else {
                    showMessage('Dados do perfil não encontrados.', 'error');
                }
            } else {
                showMessage('Tipo de usuário não encontrado. Faça login novamente.', 'error');
                setTimeout(() => window.location.href = 'login.html', 2000);
            }
        } else {
            // Usuário não logado, redirecionar para o login
            window.location.href = 'login.html';
        }
    });

    function displayProfileData(data) {
        document.getElementById('profile-name').textContent = data.name;
        document.getElementById('profile-email').textContent = data.email;
        document.getElementById('profile-cpf').textContent = IMask.createMask({ mask: '000.000.000-00' }).resolve(data.cpf);
        document.getElementById('profile-phone').textContent = IMask.createMask({ mask: '(00) 00000-0000' }).resolve(data.phone);
        document.getElementById('profile-street').textContent = data.address.street;
        document.getElementById('profile-number').textContent = data.address.number;
        document.getElementById('profile-complement').textContent = data.address.complement || '';
        document.getElementById('profile-city').textContent = data.address.city;
        document.getElementById('profile-state').textContent = data.address.state;
        document.getElementById('profile-cep').textContent = IMask.createMask({ mask: '00000-000' }).resolve(data.address.cep);

        if (data.userType === 'pintor') {
            pintorProfileView.classList.remove('hidden');
            const socialLinkElement = document.getElementById('profile-social-link');
            if (data.socialLink) {
                socialLinkElement.href = data.socialLink;
                socialLinkElement.textContent = data.socialLink;
                socialLinkElement.classList.remove('hidden');
            } else {
                socialLinkElement.classList.add('hidden');
                socialLinkElement.textContent = '';
                socialLinkElement.href = '#';
            }
            document.getElementById('profile-experience').textContent = data.experience;
            document.getElementById('profile-bio').textContent = data.bio;
        } else {
            pintorProfileView.classList.add('hidden');
        }
    }

    function fillEditForm(data) {
        document.getElementById('edit-name').value = data.name;
        document.getElementById('edit-phone').value = IMask.createMask({ mask: '(00) 00000-0000' }).resolve(data.phone);
        document.getElementById('edit-cep').value = IMask.createMask({ mask: '00000-000' }).resolve(data.address.cep);
        document.getElementById('edit-address-street').value = data.address.street;
        document.getElementById('edit-address-number').value = data.address.number;
        document.getElementById('edit-address-complement').value = data.address.complement || '';
        document.getElementById('edit-address-city').value = data.address.city;
        document.getElementById('edit-address-state').value = data.address.state;

        if (data.userType === 'pintor') {
            pintorEditFields.classList.remove('hidden');
            document.getElementById('edit-social-link').value = data.socialLink || '';
            const [expValue, expUnit] = data.experience.split(' ');
            document.getElementById('edit-experience-value').value = parseInt(expValue);
            document.getElementById('edit-experience-unit').value = expUnit;
            document.getElementById('edit-bio').value = data.bio;
            editBioCharCount.textContent = `${data.bio.length}/200 caracteres`;
        } else {
            pintorEditFields.classList.add('hidden');
        }
    }

    btnEditProfile.addEventListener('click', async () => {
        hideMessage();
        profileView.classList.add('hidden');
        editProfileForm.classList.remove('hidden');

        const profileRef = doc(db, currentUserType === 'pintor' ? 'pintores' : 'clientes', currentUserId);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
            fillEditForm(profileSnap.data());
        }
    });

    btnCancelEdit.addEventListener('click', () => {
        hideMessage();
        editProfileForm.classList.add('hidden');
        profileView.classList.remove('hidden');
    });

    editProfileForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideMessage();
        btnSaveProfile.disabled = true;
        btnSaveProfile.textContent = 'Salvando...';

        const name = document.getElementById('edit-name').value.trim();
        const phone = document.getElementById('edit-phone').value.replace(/\D/g, '');
        const cep = document.getElementById('edit-cep').value.replace(/\D/g, '');
        const street = document.getElementById('edit-address-street').value.trim();
        const number = document.getElementById('edit-address-number').value.trim();
        const complement = document.getElementById('edit-address-complement').value.trim();
        const city = document.getElementById('edit-address-city').value.trim();
        const state = document.getElementById('edit-address-state').value.trim();

        if (!name || !phone || !cep || !street || !number || !city || !state) {
            showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
            btnSaveProfile.disabled = false;
            btnSaveProfile.textContent = 'Salvar Alterações';
            return;
        }

        let updatedData = {
            name,
            phone,
            address: {
                cep,
                street,
                number,
                complement: complement || null,
                city,
                state
            }
        };

        if (currentUserType === 'pintor') {
            const socialLink = document.getElementById('edit-social-link').value.trim();
            const experienceValue = document.getElementById('edit-experience-value').value.trim();
            const experienceUnit = document.getElementById('edit-experience-unit').value;
            const bio = document.getElementById('edit-bio').value.trim();

            if (!experienceValue || !bio) {
                showMessage('Por favor, preencha todos os campos obrigatórios para Pintor.', 'error');
                btnSaveProfile.disabled = false;
                btnSaveProfile.textContent = 'Salvar Alterações';
                return;
            }

            updatedData = {
                ...updatedData,
                socialLink: socialLink || null,
                experience: `${experienceValue} ${experienceUnit}`,
                bio: bio
            };
        }

        try {
            const profileRef = doc(db, currentUserType === 'pintor' ? 'pintores' : 'clientes', currentUserId);
            await updateDoc(profileRef, updatedData);
            showMessage('Perfil atualizado com sucesso!', 'success');
            setTimeout(() => {
                editProfileForm.classList.add('hidden');
                profileView.classList.remove('hidden');
                displayProfileData({ ...updatedData, email: auth.currentUser.email, cpf: document.getElementById('profile-cpf').textContent.replace(/\D/g, ''), userType: currentUserType }); // Re-render with updated data
            }, 1500);
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            showMessage('Erro ao atualizar perfil. Tente novamente.', 'error');
        } finally {
            btnSaveProfile.disabled = false;
            btnSaveProfile.textContent = 'Salvar Alterações';
        }
    });

    btnSignOut.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro ao sair:', error);
            showMessage('Erro ao sair da conta. Tente novamente.', 'error');
        }
    });

    btnDeleteProfile.addEventListener('click', () => {
        hideMessage();
        deletePasswordInput.value = ''; // Limpa o campo de senha
        hideMessage('delete-modal-message'); // Esconde mensagens do modal
        deleteConfirmModal.classList.remove('hidden');
    });

    btnCancelDelete.addEventListener('click', () => {
        deleteConfirmModal.classList.add('hidden');
    });

    btnConfirmDelete.addEventListener('click', async () => {
        const password = deletePasswordInput.value;
        if (!password) {
            showMessage('Por favor, insira sua senha.', 'error', 'delete-modal-message');
            return;
        }

        btnConfirmDelete.disabled = true;
        btnConfirmDelete.textContent = 'Excluindo...';
        hideMessage('delete-modal-message');

        try {
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);

            // Excluir documento do Firestore
            const profileRef = doc(db, currentUserType === 'pintor' ? 'pintores' : 'clientes', currentUserId);
            await deleteDoc(profileRef);

            // Excluir registro de CPF
            const cpfRegistrySnapshot = await getDocs(query(collection(db, 'cpf_registry'), where('uid', '==', currentUserId)));
            if (!cpfRegistrySnapshot.empty) {
                await deleteDoc(cpfRegistrySnapshot.docs[0].ref);
            }

            // Excluir conta do Firebase Authentication
            await deleteUser(user);

            showMessage('Perfil excluído com sucesso! Redirecionando...', 'success', 'delete-modal-message');
            setTimeout(() => {
                deleteConfirmModal.classList.add('hidden');
                window.location.href = 'cadastro.html';
            }, 2000);

        } catch (error) {
            console.error('Erro ao excluir perfil:', error);
            let errorMessage = 'Erro ao excluir perfil. Verifique sua senha e tente novamente.';
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Senha incorreta.';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Sua sessão expirou. Por favor, faça login novamente e tente excluir o perfil.';
            }
            showMessage(errorMessage, 'error', 'delete-modal-message');
        } finally {
            btnConfirmDelete.disabled = false;
            btnConfirmDelete.textContent = 'Excluir Permanentemente';
        }
    });
}

/**
 * Inicializa a página de Busca.
 */
function initBuscaPage() {
    const searchForm = document.getElementById('search-form');
    const searchCepInput = document.getElementById('search-cep');
    const searchResultsDiv = document.getElementById('search-results');
    const noResultsMessage = document.getElementById('no-results-message');
    const btnSearchPainters = document.getElementById('btn-search-painters');

    // Máscara para o CEP na busca
    IMask(searchCepInput, { mask: '00000-000' });

    searchForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideMessage();
        searchResultsDiv.innerHTML = ''; // Limpa resultados anteriores
        noResultsMessage.classList.add('hidden');
        btnSearchPainters.disabled = true;
        btnSearchPainters.textContent = 'Buscando...';

        const cep = searchCepInput.value.replace(/\D/g, '');
        const searchType = document.querySelector('input[name="search-type"]:checked').value;

        if (cep.length !== 8) {
            showMessage('Por favor, insira um CEP válido com 8 dígitos.', 'error');
            btnSearchPainters.disabled = false;
            btnSearchPainters.textContent = 'Buscar Pintores';
            return;
        }

        let q; // Firestore Query
        let fetchedCity = '';

        try {
            // Busca a cidade via ViaCEP para ambos os tipos de busca
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (data.erro) {
                showMessage('CEP não encontrado.', 'error');
                btnSearchPainters.disabled = false;
                btnSearchPainters.textContent = 'Buscar Pintores';
                return;
            }
            fetchedCity = data.localidade;

            if (searchType === 'local-cep') {
                q = query(collection(db, 'pintores'), where('address.cep', '==', cep));
            } else { // searchType === 'city'
                q = query(collection(db, 'pintores'), where('address.city', '==', fetchedCity));
            }

            const querySnapshot = await getDocs(q);
            const painters = [];
            querySnapshot.forEach((doc) => {
                // Filtra dados sensíveis antes de exibir
                const painterData = doc.data();
                if (painterData.userType === 'pintor') { // Garante que é um pintor
                    const publicData = {
                        name: painterData.name,
                        experience: painterData.experience,
                        bio: painterData.bio,
                        city: painterData.address.city,
                        state: painterData.address.state,
                        socialLink: painterData.socialLink || null,
                        // Não incluir email, cpf, phone, etc.
                    };
                    painters.push(publicData);
                }
            });

            if (painters.length > 0) {
                displayPainters(painters);
                hideMessage();
            } else {
                noResultsMessage.classList.remove('hidden');
                showMessage('Nenhum pintor encontrado para a sua busca.', 'error');
            }

        } catch (error) {
            console.error('Erro ao buscar pintores:', error);
            showMessage('Erro ao buscar pintores. Tente novamente.', 'error');
        } finally {
            btnSearchPainters.disabled = false;
            btnSearchPainters.textContent = 'Buscar Pintores';
        }
    });

    function displayPainters(painters) {
        searchResultsDiv.innerHTML = ''; // Limpa resultados anteriores
        painters.forEach(painter => {
            const card = `
                <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${painter.name}</h3>
                    <p class="text-gray-600 mb-1">Experiência: <span class="font-medium">${painter.experience}</span></p>
                    <p class="text-gray-600 mb-3">Localização: ${painter.city} - ${painter.state}</p>
                    <p class="text-gray-700 text-sm mb-4">${painter.bio}</p>
                    ${painter.socialLink ? `<a href="${painter.socialLink}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline text-sm">Ver Perfil Social</a>` : ''}
                </div>
            `;
            searchResultsDiv.innerHTML += card;
        });
    }
}

// --- Funções de Inicialização Principal ---

/**
 * Função principal para inicializar o JavaScript com base na página atual.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Configura o toggle de senha para todas as páginas que o utilizam
    setupPasswordToggle();

    const path = window.location.pathname;

    if (path.includes('cadastro.html')) {
        initCadastroPage();
    } else if (path.includes('login.html')) {
        initLoginPage();
    } else if (path.includes('perfil.html')) {
        initPerfilPage();
    } else if (path.includes('busca.html')) {
        initBuscaPage();
    } else {
        // Redireciona para uma página padrão se a URL não corresponder
        // Por exemplo, para o cadastro ou login
        if (!auth.currentUser) { // Se não houver usuário logado
            window.location.href = 'login.html';
        } else {
            window.location.href = 'perfil.html';
        }
    }
});
