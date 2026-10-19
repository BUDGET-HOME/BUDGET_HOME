import { describe, expect, it } from "vitest";
import { passwordChangeError, recoveryRedirect, UPDATE_PASSWORD_PATH } from "./password";
import { authRedirectPath } from "./supabase/middleware";

describe("changement de mot de passe", () => {
  it("refuse un mot de passe trop court ou différent", () => {
    expect(passwordChangeError("court", "court")).toMatch(/8 caractères/);
    expect(passwordChangeError("motdepasse", "autre")).toMatch(/ne correspondent pas/);
    expect(passwordChangeError("motdepasse", "motdepasse")).toBeNull();
  });

  it("pointe le mail de réinitialisation vers la page de nouveau mot de passe", () => {
    expect(recoveryRedirect("https://budget.example")).toBe(
      `https://budget.example${UPDATE_PASSWORD_PATH}`
    );
  });
});

describe("accès à la page de nouveau mot de passe", () => {
  it("laisse entrer sans session", () => {
    expect(authRedirectPath("/update-password", false)).toBeNull();
  });

  it("laisse rester une session de récupération", () => {
    expect(authRedirectPath("/update-password", true)).toBeNull();
  });

  it("renvoie un visiteur vers la connexion", () => {
    expect(authRedirectPath("/", false)).toBe("/login");
  });

  it("renvoie un compte déjà connecté hors des pages d'auth", () => {
    expect(authRedirectPath("/login", true)).toBe("/");
    expect(authRedirectPath("/reset", true)).toBe("/");
  });
});
