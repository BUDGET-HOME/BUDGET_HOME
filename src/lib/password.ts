export const UPDATE_PASSWORD_PATH = "/update-password";

export function recoveryRedirect(origin: string): string {
  return `${origin}${UPDATE_PASSWORD_PATH}`;
}

export function passwordChangeError(password: string, confirm: string): string | null {
  if (password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (password !== confirm) {
    return "Les mots de passe ne correspondent pas.";
  }
  return null;
}
