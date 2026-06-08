export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'A senha deve ter pelo menos 8 caracteres.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'A senha deve ter pelo menos uma letra maiúscula.';
  }
  if (!/[a-z]/.test(password)) {
    return 'A senha deve ter pelo menos uma letra minúscula.';
  }
  if (!/\d/.test(password)) {
    return 'A senha deve ter pelo menos um número.';
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'A senha deve ter pelo menos um caractere especial.';
  }
  return null;
}
