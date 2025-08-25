// login.js
// Importa as referências do Firebase do arquivo de configuração
import { auth } from './firebase-config.js';

// Referências aos elementos do DOM
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email-login');
const senhaInput = document.getElementById('senha-login');
const errorMessage = document.getElementById('error-message-login');
const forgotPasswordLink = document.getElementById('forgot-password-link');

// Função para exibir mensagem de erro
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Função para ocultar mensagem de erro
function hideError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
}

// Lógica de submissão do formulário de login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value;
    const senha = senhaInput.value;

    try {
        await auth.signInWithEmailAndPassword(email, senha);
        // Se o login for bem-sucedido, redireciona para a página de perfil
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
        showError(message);
        console.error("Erro no login:", error);
    }
});

// Lógica para redefinir a senha
forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value;
    if (!email) {
        showError('Por favor, digite seu e-mail para redefinir a senha.');
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
        showError(message);
        console.error("Erro na redefinição de senha:", error);
    }
});