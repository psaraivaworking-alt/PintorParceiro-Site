// firebase.js
// Importar as funções necessárias do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Sua configuração do Firebase.
// A chave de API agora é obtida do ambiente Canvas.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserId = null; // ID do usuário logado (autenticado ou anônimo)
let isAuthReady = false; // Flag para indicar que o estado de autenticação foi determinado

// Observador de estado de autenticação para definir currentUserId e isAuthReady
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        // Tentativa de sign in com custom token, se disponível e o usuário for anônimo inicialmente.
        // Se o usuário já estiver logado (e não for anônimo), não precisamos do token customizado.
        if (typeof __initial_auth_token !== 'undefined' && user.isAnonymous) {
            try {
                await signInWithCustomToken(auth, __initial_auth_token);
                // Após o signInWithCustomToken, o onAuthStateChanged será disparado novamente com o usuário autenticado,
                // então podemos apenas garantir que o ID está correto.
                currentUserId = auth.currentUser.uid;
                console.log("Usuário autenticado com token customizado.");
            } catch (error) {
                console.error("Erro ao fazer login com token customizado:", error);
                // Se falhar, talvez tente continuar anonimamente ou redirecione para login.
            }
        }
    } else {
        currentUserId = null;
        // Se não houver token customizado, ou se o login falhou, tenta entrar anonimamente.
        if (typeof __initial_auth_token === 'undefined') {
            try {
                await signInAnonymously(auth);
                currentUserId = auth.currentUser.uid;
                console.log("Login anônimo realizado.");
            } catch (error) {
                console.error("Erro ao fazer login anonimamente:", error);
            }
        }
    }
    isAuthReady = true; // Marca que o estado de autenticação inicial foi determinado
    // Chamar funções que dependem do estado de autenticação inicial aqui
    dynamicHeaderLinks();
    loadProfileData(); // Carrega os dados do perfil após a autenticação
});

// --- Funções Utilitárias ---

/**
 * Exibe uma mensagem na caixa de mensagens da UI.
 * @param {string} msg - A mensagem a ser exibida.
 * @param {boolean} isError - Indica se a mensagem é um erro (true) ou sucesso (false).
 */
function showMessage(msg, isError = false) {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = msg;
        messageBox.style.display = 'block';
        if (isError) {
            messageBox.classList.add('error-message');
            messageBox.classList.remove('success-message');
        } else {
            messageBox.classList.add('success-message');
            messageBox.classList.remove('error-message');
        }
        setTimeout(() => {
            messageBox.style.display = 'none';
            messageBox.classList.remove('success-message', 'error-message');
        }, 5000);
    } else {
        console.log(msg); 
    }
}

/**
 * Formata o input de CEP automaticamente (adiciona o hífen).
 * @param {HTMLInputElement} inputElement - O elemento input do CEP.
 */
function formatCepInput(inputElement) {
    if (!inputElement) return;
    inputElement.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        e.target.value = value;
    });
}

/**
 * Formata o input de CPF (XXX.XXX.XXX-XX) e limita a 11 dígitos numéricos.
 * @param {HTMLInputElement} inputElement - O elemento input do CPF.
 */
function formatCpfInput(inputElement) {
    if (!inputElement) return;
    inputElement.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3');
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{3})$/, '$1.$2');
        }
        e.target.value = value;
    });
}

/**
 * Formata o input de Telefone (DD) 00000-0000 ou (DD) 0000-0000
 * @param {HTMLInputElement} inputElement - O elemento input do Telefone.
 */
function formatPhoneInput(inputElement) {
    if (!inputElement) return;
    inputElement.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        if (value.length > 10) {
            value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 6) {
            value = value.replace(/^(\d\d)(\d{4})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 2) {
            value = value.replace(/^(\d*)/, '($1');
        } else {
            value = value.replace(/^(\d*)/, '$1');
        }
        e.target.value = value;
    });
}

/**
 * Função para auto-preencher cidade/estado pelo CEP (ViaCEP).
 * @param {HTMLInputElement} cepInput - O campo de input do CEP.
 * @param {HTMLInputElement} cityInput - O campo de input da Cidade.
 * @param {HTMLInputElement} stateInput - O campo de input do Estado.
 */
async function fetchCepData(cepInput, cityInput, stateInput) {
    if (!cepInput || !cityInput || !stateInput) return;

    let cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) {
        cityInput.value = '';
        stateInput.value = '';
        return;
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            cityInput.value = 'CEP não encontrado';
            stateInput.value = '';
            showMessage('CEP não encontrado. Por favor, verifique.', true);
        } else {
            cityInput.value = data.localidade;
            stateInput.value = data.uf;
        }
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        cityInput.value = 'Erro ao buscar CEP';
        stateInput.value = '';
        showMessage('Erro ao buscar CEP. Tente novamente.', true);
    }
}

// Palavras proibidas para o filtro de profanidade
const forbiddenWords = ['cu', 'merda', 'caralho', 'buceta', 'puta', 'foda', 'desgraça', 'inferno', 'viado', 'prostituta'];

/**
 * Verifica se um texto contém palavras consideradas profanas.
 * @param {string} text - O texto a ser verificado.
 * @returns {boolean} - True se contiver profanidade, false caso contrário.
 */
function containsProfanity(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('pinto') && !forbiddenWords.some(word => lowerText.replace('pinto', '').includes(word))) {
        return false; 
    }
    return forbiddenWords.some(word => lowerText.includes(word));
}

/**
 * Configura o botão de alternância de visibilidade da senha.
 * @param {string} passwordInputId - O ID do campo de input da senha.
 * @param {string} toggleButtonId - O ID do botão de alternância (ícone de olho).
 */
function setupPasswordToggle(passwordInputId, toggleButtonId) {
    const passwordInput = document.getElementById(passwordInputId);
    const toggleButton = document.getElementById(toggleButtonId);

    if (passwordInput && toggleButton) {
        toggleButton.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
}

/**
 * Configura o botão de alternância do menu hamburger para responsividade.
 */
function setupMenuToggle() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navLinks = document.querySelector('.nav-links');

    if (hamburgerMenu && navLinks) {
        hamburgerMenu.addEventListener('click', () => {
            navLinks.classList.toggle('menu-active');
            hamburgerMenu.classList.toggle('is-active');
        });
    }
}

/**
 * Preenche dinamicamente os links do cabeçalho com base no estado de autenticação.
 */
function dynamicHeaderLinks() {
    const navLinksContainer = document.querySelector('.nav-links');
    if (!navLinksContainer || !isAuthReady) return;

    navLinksContainer.innerHTML = '';
    const currentPage = window.location.pathname.split('/').pop();

    if (currentUserId && auth.currentUser && !auth.currentUser.isAnonymous) { // Se o usuário está realmente logado (não anônimo)
        const profileLink = document.createElement('a');
        profileLink.href = 'perfil.html';
        profileLink.textContent = 'Meu Perfil';
        profileLink.classList.add('btn-primary-header');

        const logoutButton = document.createElement('button');
        logoutButton.id = 'logoutButton';
        logoutButton.textContent = 'Sair';
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                showMessage('Erro ao sair. Tente novamente.', true);
            }
        });

        navLinksContainer.appendChild(profileLink);
        if (currentPage !== 'busca.html') {
            const searchLink = document.createElement('a');
            searchLink.href = 'busca.html';
            searchLink.textContent = 'Buscar Pintores';
            searchLink.classList.add('btn-primary-header');
            navLinksContainer.appendChild(searchLink);
        }
        navLinksContainer.appendChild(logoutButton);
    } else {
        if (currentPage !== 'cadastro.html') {
            const registerLink = document.createElement('a');
            registerLink.href = 'cadastro.html';
            registerLink.textContent = 'Cadastrar';
            registerLink.classList.add('btn-primary-header');
            navLinksContainer.appendChild(registerLink);
        }

        if (currentPage !== 'login.html') {
            const loginLink = document.createElement('a');
            loginLink.href = 'login.html';
            loginLink.textContent = 'Login';
            loginLink.classList.add('btn-primary-header');
            navLinksContainer.appendChild(loginLink);
        }

        if (currentPage !== 'busca.html') {
            const searchLink = document.createElement('a');
            searchLink.href = 'busca.html';
            searchLink.textContent = 'Buscar Pintores';
            searchLink.classList.add('btn-primary-header');
            navLinksContainer.appendChild(searchLink);
        }
    }
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    if (hamburgerMenu && window.innerWidth > 768) {
        navLinksContainer.classList.remove('menu-active');
        hamburgerMenu.classList.remove('is-active');
    }
}

/**
 * Lógica para a página de cadastro.
 */
function setupRegistrationForms() {
    const painterRegisterForm = document.getElementById('painterRegisterForm');
    const clientRegisterForm = document.getElementById('clientRegisterForm');
    const btnPainter = document.getElementById('btnPainter');
    const btnClient = document.getElementById('btnClient');

    function showForm(formToShow, formToHide, activeBtn, inactiveBtn) {
        if (formToShow) formToShow.style.display = 'block';
        if (formToHide) formToHide.style.display = 'none';
        if (activeBtn) activeBtn.classList.add('active');
        if (inactiveBtn) inactiveBtn.classList.remove('active');
    }

    if (btnPainter && btnClient && painterRegisterForm && clientRegisterForm) {
        btnPainter.addEventListener('click', () => {
            showForm(painterRegisterForm, clientRegisterForm, btnPainter, btnClient);
        });
        btnClient.addEventListener('click', () => {
            showForm(clientRegisterForm, painterRegisterForm, btnClient, btnPainter);
        });
        showForm(painterRegisterForm, clientRegisterForm, btnPainter, btnClient);
    }

    // Painter Form Logic
    if (painterRegisterForm) {
        const painterCpfInput = document.getElementById('painterCpf');
        const painterPhoneInput = document.getElementById('painterPhone');
        const painterCepInput = document.getElementById('painterCep');
        const painterCityInput = document.getElementById('painterCity');
        const painterStateInput = document.getElementById('painterState');
        const painterBioInput = document.getElementById('painterBio');
        const painterBioCounter = document.getElementById('painterBioCounter');
        const painterBioProfanityError = document.getElementById('painterBioProfanityError');
        const painterNumberInput = document.getElementById('painterNumber');
        const painterNoNumberCheckbox = document.getElementById('painterNoNumber');

        if (painterCpfInput) formatCpfInput(painterCpfInput);
        if (painterPhoneInput) formatPhoneInput(painterPhoneInput);
        setupPasswordToggle('painterPassword', 'togglePainterPassword');
        setupPasswordToggle('painterConfirmPassword', 'togglePainterConfirmPassword');

        if (painterCepInput && painterCityInput && painterStateInput) {
            formatCepInput(painterCepInput);
            painterCepInput.addEventListener('blur', () => fetchCepData(painterCepInput, painterCityInput, painterStateInput));
            painterCepInput.addEventListener('input', () => {
                if (painterCepInput.value.replace(/\D/g, '').length !== 8) {
                    painterCityInput.value = '';
                    painterStateInput.value = '';
                }
            });
        }
        
        if (painterBioInput && painterBioCounter && painterBioProfanityError) {
            painterBioInput.addEventListener('input', () => {
                painterBioCounter.textContent = `${painterBioInput.value.length}/200`;
                if (containsProfanity(painterBioInput.value)) {
                    painterBioProfanityError.style.display = 'block';
                    painterBioInput.setCustomValidity('Conteúdo inapropriado detectado.');
                } else {
                    painterBioProfanityError.style.display = 'none';
                    painterBioInput.setCustomValidity('');
                }
            });
            painterBioCounter.textContent = `${painterBioInput.value.length}/200`;
        }

        if (painterNoNumberCheckbox && painterNumberInput) {
            painterNoNumberCheckbox.addEventListener('change', () => {
                if (painterNoNumberCheckbox.checked) {
                    painterNumberInput.value = 'S/N';
                    painterNumberInput.setAttribute('readonly', 'readonly');
                    painterNumberInput.removeAttribute('required');
                } else {
                    painterNumberInput.value = '';
                    painterNumberInput.removeAttribute('readonly');
                    painterNumberInput.setAttribute('required', 'required');
                }
            });
        }

        painterRegisterForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('painterName').value.trim();
            const email = document.getElementById('painterEmail').value.trim();
            const password = document.getElementById('painterPassword').value;
            const confirmPassword = document.getElementById('painterConfirmPassword').value;
            const cpf = document.getElementById('painterCpf').value.replace(/\D/g, '');
            const phone = document.getElementById('painterPhone').value.replace(/\D/g, '');
            const cep = document.getElementById('painterCep').value.replace(/\D/g, '');
            const city = document.getElementById('painterCity').value.trim();
            const state = document.getElementById('painterState').value.trim();
            const street = document.getElementById('painterStreet').value.trim();
            const number = document.getElementById('painterNumber').value.trim();
            const socialMedia = document.getElementById('painterSocialMedia').value.trim();
            const experienceValue = document.getElementById('painterExperienceValue').value;
            const experienceUnit = document.querySelector('input[name="painterExperienceUnit"]:checked')?.value;
            const bio = document.getElementById('painterBio').value.trim();

            if (password !== confirmPassword) { showMessage("As senhas não coincidem.", true); return; }
            if (cpf.length !== 11) { showMessage("CPF inválido. Por favor, digite 11 dígitos.", true); return; }
            if (phone.length < 10 || phone.length > 11) { showMessage("Telefone inválido. Verifique o DDD e o número.", true); return; }
            if (!city || !state || city === 'CEP não encontrado' || city === 'Erro ao buscar CEP') { showMessage("CEP inválido ou não preenchido. Por favor, verifique.", true); return; }
            if (containsProfanity(bio)) { showMessage("Biografia contém palavras inapropriadas. Por favor, revise.", true); return; }
            if (painterNoNumberCheckbox && !painterNoNumberCheckbox.checked && !number) { showMessage("Por favor, preencha o número do endereço ou marque 'Sem Número'.", true); return; }

            try {
                // Verificar CPF na coleção `cpf_registry`
                const cpfRegistryRef = doc(db, "artifacts", appId, "public", "data", "cpf_registry", cpf);
                const cpfSnap = await getDoc(cpfRegistryRef);
                if (cpfSnap.exists()) {
                    showMessage("Este CPF já está cadastrado em nossa plataforma.", true);
                    return;
                }
                
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Salvar dados do pintor no Firestore
                await setDoc(doc(db, "artifacts", appId, "public", "data", "pintores", user.uid), {
                    tipo: 'pintor',
                    nome: name,
                    email: email,
                    cpf: cpf,
                    telefone: phone,
                    cep: cep,
                    cidade: city,
                    estado: state,
                    rua: street,
                    numero: number,
                    redeSocial: socialMedia,
                    experiencia: `${experienceValue} ${experienceUnit}`,
                    biografia: bio,
                    dataCadastro: new Date(),
                });

                // Registrar CPF na coleção `cpf_registry`
                await setDoc(cpfRegistryRef, {
                    userId: user.uid,
                    type: 'pintor',
                    email: email,
                    timestamp: new Date()
                });

                showMessage("Cadastro de pintor realizado com sucesso! Redirecionando para o login...", false);
                setTimeout(() => { window.location.href = 'login.html'; }, 2000);

            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;

                if (errorCode === 'auth/email-already-in-use') { showMessage("O email fornecido já está em uso por outra conta.", true); }
                else if (errorCode === 'auth/weak-password') { showMessage("A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.", true); }
                else { showMessage("Erro no cadastro de pintor: " + errorMessage, true); }
                console.error(error);
            }
        });
    }

    // Client Form Logic
    if (clientRegisterForm) {
        const clientCpfInput = document.getElementById('clientCpf');
        const clientPhoneInput = document.getElementById('clientPhone');
        const clientCepInput = document.getElementById('clientCep');
        const clientCityInput = document.getElementById('clientCity');
        const clientStateInput = document.getElementById('clientState');
        const clientNumberInput = document.getElementById('clientNumber');
        const clientNoNumberCheckbox = document.getElementById('clientNoNumber');

        if (clientCpfInput) formatCpfInput(clientCpfInput);
        if (clientPhoneInput) formatPhoneInput(clientPhoneInput);
        setupPasswordToggle('clientPassword', 'toggleClientPassword');
        setupPasswordToggle('clientConfirmPassword', 'toggleClientConfirmPassword');

        if (clientCepInput && clientCityInput && clientStateInput) {
            formatCepInput(clientCepInput);
            clientCepInput.addEventListener('blur', () => fetchCepData(clientCepInput, clientCityInput, clientStateInput));
            clientCepInput.addEventListener('input', () => {
                if (clientCepInput.value.replace(/\D/g, '').length !== 8) {
                    clientCityInput.value = '';
                    clientStateInput.value = '';
                }
            });
        }

        if (clientNoNumberCheckbox && clientNumberInput) {
            clientNoNumberCheckbox.addEventListener('change', () => {
                if (clientNoNumberCheckbox.checked) {
                    clientNumberInput.value = 'S/N';
                    clientNumberInput.setAttribute('readonly', 'readonly');
                    clientNumberInput.removeAttribute('required');
                } else {
                    clientNumberInput.value = '';
                    clientNumberInput.removeAttribute('readonly');
                    clientNumberInput.setAttribute('required', 'required');
                }
            });
        }

        clientRegisterForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('clientName').value.trim();
            const email = document.getElementById('clientEmail').value.trim();
            const password = document.getElementById('clientPassword').value;
            const confirmPassword = document.getElementById('clientConfirmPassword').value;
            const cpf = document.getElementById('clientCpf').value.replace(/\D/g, '');
            const phone = document.getElementById('clientPhone').value.replace(/\D/g, '');
            const cep = document.getElementById('clientCep').value.replace(/\D/g, '');
            const city = document.getElementById('clientCity').value.trim();
            const state = document.getElementById('clientState').value.trim();
            const street = document.getElementById('clientStreet').value.trim();
            const number = document.getElementById('clientNumber').value.trim();

            if (password !== confirmPassword) { showMessage("As senhas não coincidem.", true); return; }
            if (cpf.length !== 11) { showMessage("CPF inválido. Por favor, digite 11 dígitos.", true); return; }
            if (phone.length < 10 || phone.length > 11) { showMessage("Telefone inválido. Verifique o DDD e o número.", true); return; }
            if (!city || !state || city === 'CEP não encontrado' || city === 'Erro ao buscar CEP') { showMessage("CEP inválido ou não preenchido. Por favor, verifique.", true); return; }
            if (clientNoNumberCheckbox && !clientNoNumberCheckbox.checked && !number) { showMessage("Por favor, preencha o número do endereço ou marque 'Sem Número'.", true); return; }

            try {
                // Verificar CPF na coleção `cpf_registry`
                const cpfRegistryRef = doc(db, "artifacts", appId, "public", "data", "cpf_registry", cpf);
                const cpfSnap = await getDoc(cpfRegistryRef);
                if (cpfSnap.exists()) {
                    showMessage("Este CPF já está cadastrado em nossa plataforma.", true);
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Salvar dados do cliente no Firestore (coleção privada do usuário)
                await setDoc(doc(db, "artifacts", appId, "users", user.uid, "profile", user.uid), {
                    tipo: 'cliente',
                    nome: name,
                    email: email,
                    cpf: cpf,
                    telefone: phone,
                    cep: cep, // CEP também para cliente, se for necessário para o perfil privado
                    cidade: city,
                    estado: state,
                    rua: street,
                    numero: number,
                    dataCadastro: new Date(),
                });

                // Registrar CPF na coleção `cpf_registry`
                await setDoc(cpfRegistryRef, {
                    userId: user.uid,
                    type: 'cliente',
                    email: email,
                    timestamp: new Date()
                });

                showMessage("Cadastro de cliente realizado com sucesso! Redirecionando para o login...", false);
                setTimeout(() => { window.location.href = 'login.html'; }, 2000);

            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;

                if (errorCode === 'auth/email-already-in-use') { showMessage("O email fornecido já está em uso por outra conta.", true); }
                else if (errorCode === 'auth/weak-password') { showMessage("A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.", true); }
                else { showMessage("Erro no cadastro de cliente: " + errorMessage, true); }
                console.error(error);
            }
        });
    }
}


/**
 * Lógica para a página de login.
 */
function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        setupPasswordToggle('password', 'togglePasswordLogin');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = loginForm['email'].value.trim();
            const password = loginForm['password'].value;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                showMessage("Login realizado com sucesso! Bem-vindo(a), " + user.email, false);
                window.location.href = 'perfil.html';

            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;

                if (errorCode === 'auth/wrong-password') { showMessage("Senha incorreta. Por favor, tente novamente.", true); }
                else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') { showMessage("Usuário não encontrado ou credenciais inválidas. Verifique o email ou cadastre-se.", true); }
                else if (errorCode === 'auth/invalid-email') { showMessage("O formato do email é inválido.", true); }
                else { showMessage("Erro no login: " + errorMessage, true); }
                console.error(error);
            }
        });
    }
}

/**
 * Lógica para a página de perfil.
 */
async function loadProfileData() {
    const profileForm = document.getElementById('profileForm');
    if (!profileForm || !isAuthReady || !currentUserId) return;

    const loadingMessage = document.getElementById('loadingMessage');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const cpfInput = document.getElementById('cpf');
    const phoneInput = document.getElementById('phone');
    const bioTextarea = document.getElementById('bio');
    const socialMediaInput = document.getElementById('socialMedia');
    const experienceValueInput = document.getElementById('experienceValue');
    const expMonthsRadio = document.getElementById('expMonths');
    const expYearsRadio = document.getElementById('expYears');

    const cepInputPerfil = document.getElementById('cep'); 
    const cityInputPerfil = document.getElementById('city');
    const stateInputPerfil = document.getElementById('state');
    const streetInputPerfil = document.getElementById('street');
    const numberInputPerfil = document.getElementById('number');
    const noNumberCheckboxPerfil = document.getElementById('noNumber');

    const clientLocationInput = document.getElementById('clientLocation');

    const profileBioCounter = document.getElementById('profileBioCounter');
    const profileBioProfanityError = document.getElementById('profileBioProfanityError');

    let currentUserType = null;

    if (loadingMessage) loadingMessage.style.display = 'block';
    if (profileForm) profileForm.style.display = 'none';

    try {
        let docRefPainter = doc(db, "artifacts", appId, "public", "data", "pintores", currentUserId);
        let docSnapPainter = await getDoc(docRefPainter);
        
        let docRefClient = doc(db, "artifacts", appId, "users", currentUserId, "profile", currentUserId);
        let docSnapClient = await getDoc(docRefClient);

        if (docSnapPainter.exists()) {
            currentUserType = 'pintor';
            const userData = docSnapPainter.data();
            
            if (nameInput) nameInput.value = userData.nome || ''; 
            if (emailInput) emailInput.value = userData.email || '';
            if (cpfInput) formatCpfInput(cpfInput); cpfInput.value = userData.cpf || '';
            if (phoneInput) formatPhoneInput(phoneInput); phoneInput.value = userData.telefone || '';
            
            if (cepInputPerfil) formatCepInput(cepInputPerfil); cepInputPerfil.value = userData.cep || '';
            if (cityInputPerfil) cityInputPerfil.value = userData.cidade || '';
            if (stateInputPerfil) stateInputPerfil.value = userData.estado || '';
            if (streetInputPerfil) streetInputPerfil.value = userData.rua || '';
            if (numberInputPerfil) {
                numberInputPerfil.value = userData.numero || '';
                if (userData.numero === 'S/N' && noNumberCheckboxPerfil) {
                    noNumberCheckboxPerfil.checked = true;
                    numberInputPerfil.setAttribute('readonly', 'readonly');
                }
            }
            if (socialMediaInput) socialMediaInput.value = userData.redeSocial || '';
            if (bioTextarea) bioTextarea.value = userData.biografia || '';

            if (experienceValueInput && expMonthsRadio && expYearsRadio && userData.experiencia) {
                const [value, unit] = userData.experiencia.split(' ');
                experienceValueInput.value = value;
                if (unit === 'Meses') {
                    expMonthsRadio.checked = true;
                } else if (unit === 'Anos') {
                    expYearsRadio.checked = true;
                }
            }
            document.getElementById('painterProfileFields').style.display = 'block';
            document.getElementById('clientProfileFields').style.display = 'none';

            // Re-bind CEP data fetch for painter profile
            if (cepInputPerfil && cityInputPerfil && stateInputPerfil) {
                cepInputPerfil.addEventListener('blur', () => fetchCepData(cepInputPerfil, cityInputPerfil, stateInputPerfil));
                cepInputPerfil.addEventListener('input', () => {
                    if (cepInputPerfil.value.replace(/\D/g, '').length !== 8) {
                        cityInputPerfil.value = '';
                        stateInputPerfil.value = '';
                    }
                });
            }
            // Lógica para o checkbox "Sem Número" (para perfil de pintor)
            if (noNumberCheckboxPerfil && numberInputPerfil) {
                noNumberCheckboxPerfil.addEventListener('change', () => {
                    if (noNumberCheckboxPerfil.checked) {
                        numberInputPerfil.value = 'S/N';
                        numberInputPerfil.setAttribute('readonly', 'readonly');
                        numberInputPerfil.removeAttribute('required');
                    } else {
                        numberInputPerfil.value = '';
                        numberInputPerfil.removeAttribute('readonly');
                        numberInputPerfil.setAttribute('required', 'required');
                    }
                });
            }


        } else if (docSnapClient.exists()) {
            currentUserType = 'cliente';
            const userData = docSnapClient.data();

            if (nameInput) nameInput.value = userData.nome || '';
            if (emailInput) emailInput.value = userData.email || '';
            if (cpfInput) formatCpfInput(cpfInput); cpfInput.value = userData.cpf || '';
            if (phoneInput) formatPhoneInput(phoneInput); phoneInput.value = userData.telefone || '';

            if (clientLocationInput) clientLocationInput.value = userData.localizacao || ''; 

            document.getElementById('painterProfileFields').style.display = 'none';
            document.getElementById('clientProfileFields').style.display = 'block';
        } else {
            showMessage("Nenhum dado de perfil encontrado. Por favor, preencha suas informações.", true);
            if (emailInput) emailInput.value = auth.currentUser.email || '';
        }
        if (profileForm) profileForm.style.display = 'block';

        // Contador de caracteres da biografia e filtro de profanidade
        if (bioTextarea && profileBioCounter && profileBioProfanityError && currentUserType === 'pintor') {
            bioTextarea.addEventListener('input', () => {
                const currentLength = bioTextarea.value.length;
                profileBioCounter.textContent = `${currentLength}/200`;
                if (currentLength > 200) {
                    bioTextarea.value = bioTextarea.value.substring(0, 200);
                    profileBioCounter.textContent = `200/200`;
                }
                if (containsProfanity(bioTextarea.value)) {
                    profileBioProfanityError.style.display = 'block';
                    bioTextarea.setCustomValidity('Conteúdo inapropriado detectado.');
                } else {
                    profileBioProfanityError.style.display = 'none';
                    bioTextarea.setCustomValidity('');
                }
            });
            profileBioCounter.textContent = `${bioTextarea.value.length}/200`;
        } else if (profileBioCounter) {
            profileBioCounter.style.display = 'none'; // Esconde se não for pintor
        }


    } catch (error) {
        console.error("Erro ao carregar dados do perfil:", error);
        showMessage("Erro ao carregar seu perfil. Tente novamente.", true);
        if (emailInput) emailInput.value = auth.currentUser.email || '';
        if (profileForm) profileForm.style.display = 'block';
    } finally {
        if (loadingMessage) loadingMessage.style.display = 'none';
    }

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUserId || !currentUserType) {
            showMessage("Nenhum usuário logado ou tipo de usuário desconhecido. Por favor, faça login.", true);
            return;
        }

        const collectionPath = currentUserType === 'pintor' ? `artifacts/${appId}/public/data/pintores` : `artifacts/${appId}/users/${currentUserId}/profile`;
        const docRef = doc(db, collectionPath, currentUserId);

        const cpf = cpfInput ? cpfInput.value.trim().replace(/\D/g, '') : '';
        const phone = phoneInput ? phoneInput.value.trim().replace(/\D/g, '') : '';

        if (cpf.length !== 11) { showMessage("CPF inválido. Por favor, digite 11 dígitos.", true); return; }
        if (phone.length < 10 || phone.length > 11) { showMessage("Telefone inválido. Verifique o DDD e o número.", true); return; }

        try {
            // Checar se o CPF está sendo alterado E se o novo CPF já existe (na mesma coleção)
            const docSnap = await getDoc(docRef);
            const currentCpfInDb = docSnap.exists() ? docSnap.data().cpf : null;

            if (cpf !== currentCpfInDb) { 
                const cpfRegistryRef = doc(db, "artifacts", appId, "public", "data", "cpf_registry", cpf);
                const cpfSnap = await getDoc(cpfRegistryRef);

                if (cpfSnap.exists() && cpfSnap.data().userId !== currentUserId) {
                    showMessage("Este CPF já está sendo usado por outro usuário em nossa plataforma.", true);
                    return;
                }
            }

            let updatedData = {
                nome: nameInput ? nameInput.value.trim() : '',
                cpf: cpf, 
                telefone: phone
            };

            if (currentUserType === 'pintor') {
                const bio = bioTextarea ? bioTextarea.value.trim() : '';
                if (containsProfanity(bio)) { showMessage("Biografia contém palavras inapropriadas. Por favor, revise.", true); return; }
                
                let selectedExperienceUnit = '';
                const experienceUnitRadios = document.querySelectorAll('input[name="experienceUnit"]');
                experienceUnitRadios.forEach(radio => {
                    if (radio.checked) { selectedExperienceUnit = radio.value; }
                });

                updatedData = {
                    ...updatedData,
                    cep: cepInputPerfil ? cepInputPerfil.value.trim() : '',
                    cidade: cityInputPerfil ? cityInputPerfil.value.trim() : '',
                    estado: stateInputPerfil ? stateInputPerfil.value.trim() : '',
                    rua: streetInputPerfil ? streetInputPerfil.value.trim() : '',
                    numero: numberInputPerfil ? numberInputPerfil.value.trim() : '',
                    redeSocial: socialMediaInput ? socialMediaInput.value.trim() : '',
                    experiencia: `${experienceValueInput ? experienceValueInput.value.trim() : ''} ${selectedExperienceUnit}`,
                    biografia: bio
                };
            } else if (currentUserType === 'cliente') {
                 updatedData = {
                    ...updatedData,
                    localizacao: clientLocationInput ? clientLocationInput.value.trim() : ''
                };
            }

            await updateDoc(docRef, updatedData);
            
            // Atualizar o registro de CPF se o CPF foi alterado
            if (cpf !== currentCpfInDb) {
                const oldCpfRegistryRef = doc(db, "artifacts", appId, "public", "data", "cpf_registry", currentCpfInDb);
                await setDoc(oldCpfRegistryRef, {
                    userId: currentUserId,
                    type: currentUserType,
                    email: auth.currentUser.email,
                    timestamp: new Date()
                });
            }

            showMessage("Perfil atualizado com sucesso!", false);
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            showMessage("Erro ao salvar suas alterações. Tente novamente.", true);
        }
    });
}


/**
 * Lógica para a página de busca (busca.html)
 */
function setupSearchPage() {
    const searchInput = document.getElementById('searchInput'); 
    const searchButton = document.getElementById('searchButton');
    const paintersResults = document.getElementById('paintersResults');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const searchByCepRadio = document.getElementById('searchByCep');
    const searchByCityRadio = document.getElementById('searchByCity');

    // Inicializa a formatação do CEP se a opção CEP estiver selecionada no carregamento da página
    if (searchByCepRadio && searchInput && searchByCepRadio.checked) {
        formatCepInput(searchInput);
    }

    // Event listeners para alternar o tipo de busca (CEP ou Cidade)
    if (searchByCepRadio) {
        searchByCepRadio.addEventListener('change', () => {
            if (searchInput) {
                searchInput.value = ''; // Limpa o campo ao trocar
                searchInput.placeholder = 'Digite o CEP (ex: 12345-678)';
                searchInput.maxLength = 9;
                searchInput.removeEventListener('input', handleCityInput); // Remove listener antigo de cidade
                searchInput.addEventListener('input', formatCepInput); // Adiciona listener de CEP
            }
        });
    }

    if (searchByCityRadio) {
        searchByCityRadio.addEventListener('change', () => {
            if (searchInput) {
                searchInput.value = ''; // Limpa o campo ao trocar
                searchInput.placeholder = 'Digite a Cidade (ex: São Paulo)'; 
                searchInput.maxLength = 50; 
                searchInput.removeEventListener('input', formatCepInput); // Remove listener antigo de CEP
                searchInput.addEventListener('input', handleCityInput); // Adiciona listener de cidade
            }
        });
    }

    function handleCityInput(e) { /* Nenhuma formatação automática complexa para cidade */ }

    // Adiciona o listener de CEP inicialmente ao carregar a página de busca (se a opção estiver marcada)
    if (searchInput && searchByCepRadio && searchByCepRadio.checked) {
        searchInput.addEventListener('input', formatCepInput);
    }


    if (searchButton) {
        searchButton.addEventListener('click', async () => {
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            const currentSearchType = document.querySelector('input[name="searchType"]:checked')?.value;

            if (paintersResults) paintersResults.innerHTML = '';
            if (noResultsMessage) noResultsMessage.style.display = 'none';
            showMessage('', false); // Limpa mensagens de feedback anteriores

            if (!searchTerm) {
                showMessage('Por favor, digite um termo para buscar.', true);
                return;
            }

            try {
                let paintersToRender = [];

                if (currentSearchType === 'cep') {
                    if (searchTerm.replace(/\D/g, '').length !== 8) {
                        showMessage('Por favor, digite um CEP válido (8 dígitos numéricos).', true);
                        return;
                    }
                    const q = query(collection(db, "artifacts", appId, "public", "data", "pintores"), where("cep", "==", searchTerm));
                    const querySnapshot = await getDocs(q);
                    paintersToRender = querySnapshot.docs.map(doc => doc.data());

                } else if (currentSearchType === 'city') {
                    const cityQuery = query(collection(db, "artifacts", appId, "public", "data", "pintores"), where("cidade", "==", searchTerm));
                    const citySnapshot = await getDocs(cityQuery);
                    paintersToRender = citySnapshot.docs.map(doc => doc.data());
                }

                if (paintersToRender.length === 0) {
                    if (noResultsMessage) noResultsMessage.style.display = 'block';
                } else {
                    renderPainters(paintersToRender);
                }
            } catch (error) {
                console.error("Erro ao buscar pintores:", error);
                showMessage("Ocorreu um erro ao buscar pintores. Tente novamente mais tarde.", true);
            }
        });
    }

    /**
     * Renderiza os cartões dos pintores na área de resultados.
     * @param {Array<Object>} painters - Um array de objetos de pintores a serem exibidos.
     */
    function renderPainters(painters) {
        if (painters.length === 0) {
            if (noResultsMessage) noResultsMessage.style.display = 'block';
            return;
        }

        painters.forEach((painter) => {
            const painterCard = `
                <div class="painter-card">
                    <h3>${painter.nome || 'Pintor Parceiro'}</h3>
                    <p><strong>Telefone:</strong> ${painter.telefone || 'Não informado'}</p>
                    <p><strong>Experiência:</strong> ${painter.experiencia || 'Não informado'}</p>
                    ${painter.redeSocial ? `<p><strong>Rede Social:</strong> <a href="${painter.redeSocial}" target="_blank">${painter.redeSocial}</a></p>` : ''}
                    <p class="bio"><strong>Bio:</strong> ${painter.biografia || 'Nenhuma biografia disponível.'}</p>
                </div>
            `;
            if (paintersResults) paintersResults.innerHTML += painterCard;
        });
    }
}

// Inicializar as lógicas específicas da página apenas quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Configura o menu hamburger (sempre presente)
    setupMenuToggle(); 

    // Lógica para a página de cadastro
    if (document.getElementById('painterRegisterForm') || document.getElementById('clientRegisterForm')) {
        setupRegistrationForms();
    }

    // Lógica para a página de login
    if (document.getElementById('loginForm')) {
        setupLoginPage();
    }

    // Lógica para a página de busca
    if (document.getElementById('searchInput')) {
        setupSearchPage();
    }
});
