// firebase.js
// Importar as funções necessárias do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Sua configuração do Firebase.
// ATENÇÃO: Em um ambiente de produção real, evite expor a chave de API diretamente no código do cliente.
// Considere usar variáveis de ambiente ou um serviço de proxy para maior segurança.
const firebaseConfig = {
    apiKey: "AIzaSyCmuGFCKnZ-qBVUpDxs6moJis19lx8nvXw", 
    authDomain: "pintordata.firebaseapp.com",
    projectId: "pintordata",
    storageBucket: "pintordata.firebasestorage.app",
    messagingSenderId: "994883381349",
    appId: "1:994883381349:web:b802e44d49d6f6f163fe8c"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Funções Utilitárias ---

/**
 * Exibe uma mensagem na caixa de mensagens da UI.
 * @param {string} msg - A mensagem a ser exibida.
 * @param {boolean} isError - Indica se a mensagem é um erro (true) ou sucesso (false).
 */
function showMessage(msg, isError = false) {
    // Verifica se o elemento messageBox existe na página atual
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = msg;
        messageBox.style.display = 'block';
        if (isError) {
            messageBox.classList.add('error-message');
            messageBox.classList.remove('success-message'); // Garante que a classe de sucesso seja removida
        } else {
            messageBox.classList.add('success-message'); // Adiciona classe de sucesso
            messageBox.classList.remove('error-message'); // Garante que a classe de erro seja removida
        }
        setTimeout(() => {
            messageBox.style.display = 'none';
            messageBox.classList.remove('success-message', 'error-message'); // Remove ambas as classes ao esconder
        }, 5000); // Mensagem desaparece após 5 segundos
    } else {
        // Fallback para o console se a caixa de mensagens não existir (ex: para páginas sem o elemento)
        console.log(msg); 
    }
}

/**
 * Formata o input de CEP automaticamente (adiciona o hífen).
 * @param {HTMLInputElement} inputElement - O elemento input do CEP.
 */
function formatCepInput(inputElement) {
    if (!inputElement) return; // Garante que o elemento existe
    inputElement.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
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
    if (!inputElement) return; // Garante que o elemento existe
    inputElement.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        
        // Limita a 11 dígitos
        if (value.length > 11) {
            value = value.substring(0, 11);
        }

        // Aplica a formatação
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
    if (!inputElement) return; // Garante que o elemento existe
    inputElement.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito

        if (value.length > 11) {
            value = value.substring(0, 11);
        }

        // Aplica a formatação (DD) 9XXXX-XXXX ou (DD) XXXX-XXXX
        if (value.length > 10) { // Para 11 dígitos (com 9 na frente)
            value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 6) { // Para 10 dígitos
            value = value.replace(/^(\d\d)(\d{4})(\d{4}).*/, '($1) $2-$3');
        } else if (value.length > 2) { // Para DDD
            value = value.replace(/^(\d\d)(\d+)/, '($1) $2');
        } else {
            value = value.replace(/^(\d*)/, '($1');
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
    if (!cepInput || !cityInput || !stateInput) return; // Garante que os elementos existem

    let cep = cepInput.value.replace(/\D/g, ''); // Limpa o CEP
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

// Palavras proibidas para o filtro de profanidade (pode expandir esta lista)
const forbiddenWords = ['cu', 'merda', 'caralho', 'buceta', 'puta', 'foda', 'desgraça', 'inferno', 'viado', 'prostituta'];

/**
 * Verifica se um texto contém palavras consideradas profanas.
 * @param {string} text - O texto a ser verificado.
 * @returns {boolean} - True se contiver profanidade, false caso contrário.
 */
function containsProfanity(text) {
    const lowerText = text.toLowerCase();
    // Exceção para a palavra "pinto" se não estiver sozinha ou em contexto de profanidade (ex: "pinto a parede")
    if (lowerText.includes('pinto') && !forbiddenWords.some(word => lowerText.replace('pinto', '').includes(word))) {
        // Se a palavra "pinto" estiver, mas não outras profanidades, permite.
        // Isso é uma heurística e pode precisar de ajustes dependendo do contexto.
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
            // Alterna o tipo do input entre 'password' e 'text'
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Alterna o ícone de olho
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash'); // Olho cortado
        });
    }
}


// --- Lógica do Header Dinâmico (para todas as páginas que usam o script.js) ---
const navLinksContainer = document.querySelector('.nav-links');

if (navLinksContainer) {
    onAuthStateChanged(auth, (user) => {
        navLinksContainer.innerHTML = ''; // Limpa os links existentes
        const currentPage = window.location.pathname.split('/').pop(); // Obtém o nome da página atual

        if (user) {
            // Usuário está logado
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
            // Só adiciona "Buscar Pintores" se não estiver na página de busca
            if (currentPage !== 'busca.html') {
                const searchLink = document.createElement('a');
                searchLink.href = 'busca.html';
                searchLink.textContent = 'Buscar Pintores';
                searchLink.classList.add('btn-primary-header'); // Adicionando estilo de botão
                navLinksContainer.appendChild(searchLink);
            }
            navLinksContainer.appendChild(logoutButton);
        } else {
            // Usuário não está logado
            // Só adiciona "Cadastrar" se não estiver na página de cadastro
            if (currentPage !== 'cadastro.html') {
                const registerLink = document.createElement('a');
                registerLink.href = 'cadastro.html';
                registerLink.textContent = 'Cadastrar';
                registerLink.classList.add('btn-primary-header');
                navLinksContainer.appendChild(registerLink);
            }

            // Só adiciona "Login" se não estiver na página de login
            if (currentPage !== 'login.html') {
                const loginLink = document.createElement('a');
                loginLink.href = 'login.html';
                loginLink.textContent = 'Login';
                loginLink.classList.add('btn-primary-header');
                navLinksContainer.appendChild(loginLink);
            }

            // Só adiciona "Buscar Pintores" se não estiver na página de busca
            if (currentPage !== 'busca.html') {
                const searchLink = document.createElement('a');
                searchLink.href = 'busca.html';
                searchLink.textContent = 'Buscar Pintores';
                searchLink.classList.add('btn-primary-header'); // Adicionando estilo de botão
                navLinksContainer.appendChild(searchLink);
            }
        }
    });
}


// --- Lógica da Página de Cadastro (cadastro.html) ---
const painterRegisterForm = document.getElementById('painterRegisterForm');
const clientRegisterForm = document.getElementById('clientRegisterForm');

if (painterRegisterForm || clientRegisterForm) {
    // --- Lógica para alternar entre formulário de Pintor e Cliente ---
    const btnPainter = document.getElementById('btnPainter');
    const btnClient = document.getElementById('btnClient');
    
    // Funções para mostrar e esconder formulários
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
    }

    // --- Formatação e auto-preenchimento para campos de Pintor ---
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

    // Toggle de senha para o formulário de pintor
    setupPasswordToggle('painterPassword', 'togglePainterPassword');
    setupPasswordToggle('painterConfirmPassword', 'togglePainterConfirmPassword');

    if (painterCepInput && painterCityInput && painterStateInput) {
        formatCepInput(painterCepInput); // Formata o CEP do pintor
        painterCepInput.addEventListener('blur', () => fetchCepData(painterCepInput, painterCityInput, painterStateInput));
        painterCepInput.addEventListener('input', () => { // Limpar campos se o CEP for alterado
            if (painterCepInput.value.replace(/\D/g, '').length !== 8) {
                painterCityInput.value = '';
                painterStateInput.value = '';
            }
        });
    }
    
    // Lógica do contador e profanidade da biografia do pintor
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
        // Inicializa o contador ao carregar
        painterBioCounter.textContent = `${painterBioInput.value.length}/200`;
    }

    // Lógica para o checkbox "Sem Número" do pintor
    if (painterNoNumberCheckbox && painterNumberInput) {
        painterNoNumberCheckbox.addEventListener('change', () => {
            if (painterNoNumberCheckbox.checked) {
                painterNumberInput.value = 'S/N';
                painterNumberInput.setAttribute('readonly', 'readonly');
                painterNumberInput.removeAttribute('required'); // Não é mais obrigatório
            } else {
                painterNumberInput.value = '';
                painterNumberInput.removeAttribute('readonly');
                painterNumberInput.setAttribute('required', 'required'); // Volta a ser obrigatório
            }
        });
    }

    // --- Lógica para o formulário de cadastro de Pintor ---
    if (painterRegisterForm) {
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

            // Validações
            if (password !== confirmPassword) {
                showMessage("As senhas não coincidem.", true);
                return;
            }
            if (cpf.length !== 11) {
                showMessage("CPF inválido. Por favor, digite 11 dígitos.", true);
                return;
            }
            if (phone.length < 10 || phone.length > 11) { // 10 ou 11 dígitos para telefone
                showMessage("Telefone inválido. Verifique o DDD e o número.", true);
                return;
            }
            if (!city || !state || city === 'CEP não encontrado' || city === 'Erro ao buscar CEP') {
                showMessage("CEP inválido ou não preenchido. Por favor, verifique.", true);
                return;
            }
            if (containsProfanity(bio)) {
                showMessage("Biografia contém palavras inapropriadas. Por favor, revise.", true);
                return;
            }
            if (painterNoNumberCheckbox && !painterNoNumberCheckbox.checked && !number) {
                 showMessage("Por favor, preencha o número do endereço ou marque 'Sem Número'.", true);
                 return;
            }


            try {
                // Verificar se o CPF já existe no Firestore (para pintores)
                const qCpf = query(collection(db, "pintores"), where("cpf", "==", cpf));
                const querySnapshotCpf = await getDocs(qCpf);
                if (!querySnapshotCpf.empty) {
                    showMessage("Este CPF já está cadastrado como pintor.", true);
                    return;
                }
                
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                await setDoc(doc(db, "pintores", user.uid), {
                    tipo: 'pintor', // Adicionar tipo para diferenciar no banco
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
                    experiencia: `${experienceValue} ${experienceUnit}`, // Salva como "X Meses" ou "Y Anos"
                    biografia: bio,
                    dataCadastro: new Date(),
                });

                showMessage("Cadastro de pintor realizado com sucesso! Redirecionando para o login...", false);
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);

            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;

                if (errorCode === 'auth/email-already-in-use') {
                    showMessage("O email fornecido já está em uso por outra conta.", true);
                } else if (errorCode === 'auth/weak-password') {
                    showMessage("A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.", true);
                } else {
                    showMessage("Erro no cadastro de pintor: " + errorMessage, true);
                }
                console.error(error);
            }
        });
    }

    // --- Formatação e auto-preenchimento para campos de Cliente ---
    const clientCpfInput = document.getElementById('clientCpf');
    const clientPhoneInput = document.getElementById('clientPhone');
    const clientCepInput = document.getElementById('clientCep');
    const clientCityInput = document.getElementById('clientCity');
    const clientStateInput = document.getElementById('clientState');
    const clientNumberInput = document.getElementById('clientNumber');
    const clientNoNumberCheckbox = document.getElementById('clientNoNumber');


    if (clientCpfInput) formatCpfInput(clientCpfInput);
    if (clientPhoneInput) formatPhoneInput(clientPhoneInput);

    // Toggle de senha para o formulário de cliente
    setupPasswordToggle('clientPassword', 'toggleClientPassword');
    setupPasswordToggle('clientConfirmPassword', 'toggleClientConfirmPassword');

    if (clientCepInput && clientCityInput && clientStateInput) {
        formatCepInput(clientCepInput); // Formata o CEP do cliente
        clientCepInput.addEventListener('blur', () => fetchCepData(clientCepInput, clientCityInput, clientStateInput));
        clientCepInput.addEventListener('input', () => { // Limpar campos se o CEP for alterado
            if (clientCepInput.value.replace(/\D/g, '').length !== 8) {
                clientCityInput.value = '';
                clientStateInput.value = '';
            }
        });
    }

    // Lógica para o checkbox "Sem Número" do cliente
    if (clientNoNumberCheckbox && clientNumberInput) {
        clientNoNumberCheckbox.addEventListener('change', () => {
            if (clientNoNumberCheckbox.checked) {
                clientNumberInput.value = 'S/N';
                clientNumberInput.setAttribute('readonly', 'readonly');
                clientNumberInput.removeAttribute('required'); // Não é mais obrigatório
            } else {
                clientNumberInput.value = '';
                clientNumberInput.removeAttribute('readonly');
                clientNumberInput.setAttribute('required', 'required'); // Volta a ser obrigatório
            }
        });
    }


    // --- Lógica para o formulário de cadastro de Cliente ---
    if (clientRegisterForm) {
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


            // Validações
            if (password !== confirmPassword) {
                showMessage("As senhas não coincidem.", true);
                return;
            }
            if (cpf.length !== 11) {
                showMessage("CPF inválido. Por favor, digite 11 dígitos.", true);
                return;
            }
            if (phone.length < 10 || phone.length > 11) { // 10 ou 11 dígitos para telefone
                showMessage("Telefone inválido. Verifique o DDD e o número.", true);
                return;
            }
            if (!city || !state || city === 'CEP não encontrado' || city === 'Erro ao buscar CEP') {
                showMessage("CEP inválido ou não preenchido. Por favor, verifique.", true);
                return;
            }
            if (clientNoNumberCheckbox && !clientNoNumberCheckbox.checked && !number) {
                 showMessage("Por favor, preencha o número do endereço ou marque 'Sem Número'.", true);
                 return;
            }

            try {
                // Verificar se o CPF já existe no Firestore (para usuários)
                const qCpf = query(collection(db, "usuarios"), where("cpf", "==", cpf));
                const querySnapshotCpf = await getDocs(qCpf);
                if (!querySnapshotCpf.empty) {
                    showMessage("Este CPF já está cadastrado como cliente.", true);
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // Salva na nova coleção 'usuarios'
                await setDoc(doc(db, "usuarios", user.uid), {
                    tipo: 'cliente', // Adicionar tipo para diferenciar no banco
                    nome: name,
                    email: email,
                    cpf: cpf,
                    telefone: phone,
                    cep: cep,
                    cidade: city,
                    estado: state,
                    rua: street,
                    numero: number,
                    dataCadastro: new Date(),
                });

                showMessage("Cadastro de cliente realizado com sucesso! Redirecionando para o login...", false);
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);

            } catch (error) {
                const errorCode = error.code;
                const errorMessage = error.message;

                if (errorCode === 'auth/email-already-in-use') {
                    showMessage("O email fornecido já está em uso por outra conta.", true);
                } else if (errorCode === 'auth/weak-password') {
                    showMessage("A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.", true);
                } else {
                    showMessage("Erro no cadastro de cliente: " + errorMessage, true);
                }
                console.error(error);
            }
        });
    }
}


// --- Lógica da Página de Login (login.html) ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    // Chama a função para o botão de ver senha na página de login
    setupPasswordToggle('password', 'togglePasswordLogin'); 

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = loginForm['email'].value.trim();
        const password = loginForm['password'].value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            showMessage("Login realizado com sucesso! Bem-vindo(a), " + user.email, false);
            // Redirecionar para a página de perfil após o login
            window.location.href = 'perfil.html'; 

        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;

            if (errorCode === 'auth/wrong-password') {
                showMessage("Senha incorreta. Por favor, tente novamente.", true);
            } else if (errorCode === 'auth/user-not-found') {
                showMessage("Usuário não encontrado. Verifique o email ou cadastre-se.", true);
            } else if (errorCode === 'auth/invalid-email') {
                showMessage("O formato do email é inválido.", true);
            } else {
                showMessage("Erro no login: " + errorMessage, true);
            }
            console.error(error);
        }
    });
}

// --- Lógica da Página de Perfil (perfil.html) ---
const profileForm = document.getElementById('profileForm');
if (profileForm) {
    const loadingMessage = document.getElementById('loadingMessage');
    // Não precisamos de um logoutButton específico aqui, pois o do header já lida com isso.

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const cpfInput = document.getElementById('cpf');
    const phoneInput = document.getElementById('phone');
    const bioTextarea = document.getElementById('bio');
    const socialMediaInput = document.getElementById('socialMedia');
    const experienceValueInput = document.getElementById('experienceValue');
    const expMonthsRadio = document.getElementById('expMonths');
    const expYearsRadio = document.getElementById('expYears');

    // Campos específicos de endereço para pintor (mesmos IDs do cadastro, mas no perfil)
    const cepInputPerfil = document.getElementById('cep'); 
    const cityInputPerfil = document.getElementById('city');
    const stateInputPerfil = document.getElementById('state');
    const streetInputPerfil = document.getElementById('street');
    const numberInputPerfil = document.getElementById('number');
    const noNumberCheckboxPerfil = document.getElementById('noNumber');

    // Campo específico de localização para cliente
    const clientLocationInput = document.getElementById('clientLocation');

    const profileBioCounter = document.getElementById('profileBioCounter'); // Contador da bio
    const profileBioProfanityError = document.getElementById('profileBioProfanityError'); // Erro de profanidade

    let currentUserUid = null;
    let currentUserType = null; // Para saber se é pintor ou cliente

    // Aplica formatações
    if (cpfInput) formatCpfInput(cpfInput);
    if (phoneInput) formatPhoneInput(phoneInput);

    // Lógica para preencher cidade/estado automaticamente a partir do CEP (para perfil de pintor)
    if (cepInputPerfil && cityInputPerfil && stateInputPerfil) {
        formatCepInput(cepInputPerfil); // Formata o CEP
        cepInputPerfil.addEventListener('blur', () => fetchCepData(cepInputPerfil, cityInputPerfil, stateInputPerfil));
        cepInputPerfil.addEventListener('input', () => { // Limpar campos se o CEP for alterado
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

    // Contador de caracteres da biografia e filtro de profanidade
    if (bioTextarea && profileBioCounter && profileBioProfanityError) {
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
        // Inicializa o contador ao carregar a página
        profileBioCounter.textContent = `${bioTextarea.value.length}/200`;
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserUid = user.uid;
            if (loadingMessage) loadingMessage.style.display = 'block';
            if (profileForm) profileForm.style.display = 'none';

            try {
                // Tenta buscar como pintor
                let docRef = doc(db, "pintores", currentUserUid);
                let docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    currentUserType = 'pintor';
                } else {
                    // Se não é pintor, tenta buscar como cliente
                    docRef = doc(db, "usuarios", currentUserUid);
                    docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        currentUserType = 'cliente';
                    }
                }

                if (docSnap.exists()) {
                    const userData = docSnap.data();

                    if (nameInput) nameInput.value = userData.nome || ''; 
                    if (emailInput) emailInput.value = userData.email || '';
                    if (cpfInput) cpfInput.value = userData.cpf || '';
                    if (phoneInput) formatPhoneInput(phoneInput); phoneInput.value = userData.telefone || ''; // Aplica format no carregamento
                    
                    if (currentUserType === 'pintor') {
                        // Preencher campos específicos de pintor
                        if (cepInputPerfil) cepInputPerfil.value = userData.cep || '';
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

                        // Preencher experiência
                        if (experienceValueInput && expMonthsRadio && expYearsRadio && userData.experiencia) {
                            const [value, unit] = userData.experiencia.split(' ');
                            experienceValueInput.value = value;
                            if (unit === 'Meses') {
                                expMonthsRadio.checked = true;
                            } else if (unit === 'Anos') {
                                expYearsRadio.checked = true;
                            }
                        }
                        // Mostrar campos de pintor e esconder de cliente
                        document.getElementById('painterProfileFields').style.display = 'block';
                        document.getElementById('clientProfileFields').style.display = 'none';
                    } else if (currentUserType === 'cliente') {
                        // Preencher campos específicos de cliente
                        if (clientLocationInput) clientLocationInput.value = userData.localizacao || ''; // Certifique-se de que o ID esteja correto
                        // Mostrar campos de cliente e esconder de pintor
                        document.getElementById('painterProfileFields').style.display = 'none';
                        document.getElementById('clientProfileFields').style.display = 'block';
                    }

                } else {
                    showMessage("Nenhum dado de perfil encontrado. Por favor, preencha suas informações.", true);
                    if (emailInput) emailInput.value = user.email || '';
                }
                if (profileForm) profileForm.style.display = 'block';
            } catch (error) {
                console.error("Erro ao carregar dados do perfil:", error);
                showMessage("Erro ao carregar seu perfil. Tente novamente.", true);
                if (emailInput) emailInput.value = user.email || '';
                if (profileForm) profileForm.style.display = 'block';
            } finally {
                if (loadingMessage) loadingMessage.style.display = 'none';
            }
        } else {
            showMessage("Você precisa estar logado para acessar esta página.", true);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    });

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUserUid || !currentUserType) {
            showMessage("Nenhum usuário logado ou tipo de usuário desconhecido. Por favor, faça login.", true);
            return;
        }

        const collectionToUpdate = currentUserType === 'pintor' ? 'pintores' : 'usuarios';
        const docRef = doc(db, collectionToUpdate, currentUserUid);

        const cpf = cpfInput ? cpfInput.value.trim().replace(/\D/g, '') : '';
        const phone = phoneInput ? phoneInput.value.trim().replace(/\D/g, '') : '';

        // Validações básicas (comuns a ambos)
        if (cpf.length !== 11) {
            showMessage("CPF inválido. Por favor, digite 11 dígitos.", true);
            return;
        }
        if (phone.length < 10 || phone.length > 11) {
            showMessage("Telefone inválido. Verifique o DDD e o número.", true);
            return;
        }

        try {
            // Checar se o CPF está sendo alterado E se o novo CPF já existe (na mesma coleção)
            const docSnap = await getDoc(docRef);
            const currentCpfInDb = docSnap.exists() ? docSnap.data().cpf : null;

            if (cpf !== currentCpfInDb) { 
                const q = query(collection(db, collectionToUpdate), where("cpf", "==", cpf));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty && querySnapshot.docs[0].id !== currentUserUid) {
                    showMessage("Este CPF já está sendo usado por outro usuário.", true);
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
                if (containsProfanity(bio)) {
                    showMessage("Biografia contém palavras inapropriadas. Por favor, revise.", true);
                    return;
                }
                // Captura o valor da unidade de experiência selecionada
                let selectedExperienceUnit = '';
                const experienceUnitRadios = document.querySelectorAll('input[name="painterExperienceUnit"]'); // Ajustado para pegar os rádios do perfil
                experienceUnitRadios.forEach(radio => {
                    if (radio.checked) {
                        selectedExperienceUnit = radio.value;
                    }
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
            showMessage("Perfil atualizado com sucesso!", false);
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            showMessage("Erro ao salvar suas alterações. Tente novamente.", true);
        }
    });

    // --- Lógica de Logout do Perfil (se houver um botão específico aqui, embora o do header seja preferível) ---
    // Removido o botão de logout duplicado, já que o header agora gerencia isso globalmente.
}


// --- Lógica da Página de Busca (busca.html) ---
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

// Funções de manipulação de input para busca (removido formatCepInput, usei direto o formatCepInput global)
function handleCityInput(e) {
    // Nenhuma formatação automática complexa para cidade, apenas tratamento de texto simples.
}

// Adiciona o listener de CEP inicialmente ao carregar a página de busca (se a opção estiver marcada)
if (searchInput && searchByCepRadio && searchByCepRadio.checked) {
    searchInput.addEventListener('input', formatCepInput); // Usa a função global
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
                const q = query(collection(db, "pintores"), where("cep", "==", searchTerm));
                const querySnapshot = await getDocs(q);
                paintersToRender = querySnapshot.docs.map(doc => doc.data());

            } else if (currentSearchType === 'city') {
                const cityQuery = query(collection(db, "pintores"), where("cidade", "==", searchTerm));
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
