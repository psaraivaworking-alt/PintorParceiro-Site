// firebase.js
// Importar as funções necessárias do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Sua configuração do Firebase (a mesma que você forneceu)
const firebaseConfig = {
    apiKey: "AIzaSyCmuGFCKnZ-qBVUpDxs6moJis19lx8nvXw", // <--- Certifique-se de que esta é a sua nova API Key restrita
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

// Função para exibir mensagens na UI (substituindo o alert)
function showMessage(msg, isError = false) {
    // Verifica se o elemento messageBox existe na página atual
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = msg;
        messageBox.style.display = 'block';
        if (isError) {
            messageBox.classList.add('error-message');
        } else {
            messageBox.classList.remove('error-message');
        }
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000); // Mensagem desaparece após 5 segundos
    } else {
        // Fallback para alert se messageBox não existir (ex: para páginas sem o elemento)
        alert(msg);
    }
}

// Função para formatar o CEP (adiciona o hífen)
function formatCepInput(inputElement) {
    inputElement.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        e.target.value = value;
    });
}

// --- Lógica da Página de Cadastro (cadastro.html) ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    const cepInputCadastro = registerForm.querySelector('#cep');
    if (cepInputCadastro) {
        formatCepInput(cepInputCadastro);
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Novo: Obter o valor do campo de nome
        const name = registerForm['name'].value; 
        const email = registerForm['email'].value;
        const password = registerForm['password'].value;
        const cpf = registerForm['cpf'].value;
        const cep = registerForm['cep'].value;
        const address = registerForm['address'].value;
        const phone = registerForm['phone'].value;
        const bio = registerForm['bio'].value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            await setDoc(doc(db, "pintores", user.uid), {
                nome: name, // Novo: Salvar o nome no Firestore
                email: email,
                cpf: cpf,
                cep: cep,
                endereco: address,
                telefone: phone,
                biografia: bio,
            });

            showMessage("Cadastro realizado com sucesso! Você já pode acessar seu perfil.");
            // Opcional: Redirecionar para a página de login ou perfil após o cadastro
            // window.location.href = 'login.html';

        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;

            if (errorCode === 'auth/email-already-in-use') {
                showMessage("O email fornecido já está em uso por outra conta.", true);
            } else if (errorCode === 'auth/weak-password') {
                showMessage("A senha é muito fraca. Ela deve ter pelo menos 6 caracteres.", true);
            } else {
                showMessage("Erro no cadastro: " + errorMessage, true);
            }
            console.error(error);
        }
    });
}

// --- Lógica da Página de Login (login.html) ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = loginForm['email'].value;
        const password = loginForm['password'].value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            showMessage("Login realizado com sucesso! Bem-vindo(a), " + user.email);
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
    const logoutButton = document.getElementById('logoutButton');

    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const cpfInput = document.getElementById('cpf');
    const cepInputPerfil = document.getElementById('cep'); // Renomeado para evitar conflito
    const addressInput = document.getElementById('address');
    const phoneInput = document.getElementById('phone');
    const bioTextarea = document.getElementById('bio');

    let currentUserUid = null;

    if (cepInputPerfil) {
        formatCepInput(cepInputPerfil);
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserUid = user.uid;
            if (loadingMessage) loadingMessage.style.display = 'block';
            if (profileForm) profileForm.style.display = 'none';

            try {
                const docRef = doc(db, "pintores", currentUserUid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const painterData = docSnap.data();
                    if (nameInput) nameInput.value = painterData.nome || ''; // Preenche o nome (se existir)
                    if (emailInput) emailInput.value = painterData.email || '';
                    if (cpfInput) cpfInput.value = painterData.cpf || '';
                    if (cepInputPerfil) cepInputPerfil.value = painterData.cep || '';
                    if (addressInput) addressInput.value = painterData.endereco || '';
                    if (phoneInput) phoneInput.value = painterData.telefone || '';
                    if (bioTextarea) bioTextarea.value = painterData.biografia || '';
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

        if (!currentUserUid) {
            showMessage("Nenhum usuário logado. Por favor, faça login.", true);
            return;
        }

        const updatedData = {
            nome: nameInput ? nameInput.value.trim() : '',
            cpf: cpfInput ? cpfInput.value.trim() : '',
            cep: cepInputPerfil ? cepInputPerfil.value.trim() : '',
            endereco: addressInput ? addressInput.value.trim() : '',
            telefone: phoneInput ? phoneInput.value.trim() : '',
            biografia: bioTextarea ? bioTextarea.value.trim() : ''
        };

        try {
            const docRef = doc(db, "pintores", currentUserUid);
            await updateDoc(docRef, updatedData);
            showMessage("Perfil atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            showMessage("Erro ao salvar suas alterações. Tente novamente.", true);
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await signOut(auth);
                showMessage("Você foi desconectado.", false);
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } catch (error) {
                console.error("Erro ao fazer logout:", error);
                showMessage("Erro ao sair. Tente novamente.", true);
            }
        });
    }
}

// --- Lógica da Página de Busca (busca.html) ---
const cepSearchInput = document.getElementById('cepSearchInput');
const searchButton = document.getElementById('searchButton');
const paintersResults = document.getElementById('paintersResults');
const noResultsMessage = document.getElementById('noResultsMessage');

if (cepSearchInput) {
    formatCepInput(cepSearchInput);
}

if (searchButton) {
    searchButton.addEventListener('click', async () => {
        const cepToSearch = cepSearchInput ? cepSearchInput.value.trim() : '';

        if (paintersResults) paintersResults.innerHTML = '';
        if (noResultsMessage) noResultsMessage.style.display = 'none';

        if (cepToSearch) {
            try {
                const q = query(collection(db, "pintores"), where("cep", "==", cepToSearch));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    if (noResultsMessage) noResultsMessage.style.display = 'block';
                } else {
                    querySnapshot.forEach((doc) => {
                        const painter = doc.data();
                        // Certifique-se de que 'painter.nome' existe antes de usá-lo
                        const painterName = painter.nome || 'Pintor Parceiro'; 
                        const painterCard = `
                            <div class="painter-card">
                                <h3>${painterName}</h3>
                                <p><strong>Telefone:</strong> ${painter.telefone || 'Não informado'}</p>
                                <p><strong>CEP:</strong> ${painter.cep || 'Não informado'}</p>
                                <p><strong>Email:</strong> ${painter.email || 'Não informado'}</p>
                                <p class="bio"><strong>Bio:</strong> ${painter.biografia || 'Nenhuma biografia disponível.'}</p>
                            </div>
                        `;
                        if (paintersResults) paintersResults.innerHTML += painterCard;
                    });
                }
            } catch (error) {
                console.error("Erro ao buscar pintores:", error);
                showMessage("Ocorreu um erro ao buscar pintores. Tente novamente mais tarde.", true);
            }
        } else {
            showMessage("Por favor, digite um CEP para buscar.", true);
        }
    });
}
