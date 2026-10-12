# 🏠 BUDGET_HOME

Logiciel web de **gestion de budget familiale** pour un couple : suivi des revenus et dépenses, répartition équitable des charges, et simulation d'achat immobilier.

> Objectif : une application 100 % web, sans backend, déployée sur **Vercel**.

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture actuelle](#-architecture-actuelle)
- [Utilisation](#-utilisation)
- [Calculs & logique métier](#-calculs--logique-métier)
- [Feuille de route](#-feuille-de-route)
- [Contribuer](#-contribuer)

---

## ✨ Fonctionnalités

### 1. Revenus & profils
- Saisie des deux profils du couple (noms personnalisables) et de leurs salaires nets mensuels.
- **Répartition automatique des charges** proportionnelle aux revenus, ou mode **50/50 forcé**.
- Détail du calcul du ratio affichable.

### 2. Gestion des dépenses
- Ajout de dépenses avec **description, montant, catégorie** (14 catégories : Logement, Énergie, Courses, Enfants, Transport, Assurances, Santé, Sorties, Vacances, etc.) et **fréquence** (mensuelle ou annuelle).
- Chaque dépense est associée à la personne qui la paie réellement.
- Liste détaillée des charges, triée par catégorie, avec suppression individuelle et réinitialisation complète.

### 3. Équilibre du budget
- Vue **mensuelle** ou **annuelle**.
- Indicateurs : total des dépenses et **capacité d'épargne** (salaires − dépenses).
- Graphiques (Chart.js) : répartition des paiements par personne et top 5 des catégories de dépenses.
- **Verdict d'équilibre** : indique qui doit de l'argent à qui pour atteindre la répartition équitable.

### 4. Simulateur d'achat immobilier 🏡
- Paramètres : apport, taux d'intérêt, taux d'assurance, durée (15/20/25 ans), type de bien (ancien ~8 % de frais de notaire, neuf ~2,5 %).
- Mensualité maximale retenue = la plus contrainte entre :
  - le **plafond bancaire de 35 % d'endettement** ;
  - le **reste à vivre réel** (revenus − dépenses hors loyer actuel).
- Résultats : enveloppe globale (prêt + apport), prix net vendeur, frais de notaire, mensualité (dont assurance), coût total du crédit.
- **Tableau d'amortissement** annuel (restant dû, intérêts, principal, assurance).
- Estimation de la **durée d'épargne** nécessaire pour constituer l'apport.

### 5. Sauvegarde & export
- **Persistance automatique** dans le navigateur (`localStorage`).
- **Export / import** du budget complet au format JSON.
- **Impression / export PDF** optimisé (styles print dédiés : masquage des formulaires, affichage des détails de calculs).

---

## 🏗 Architecture actuelle

Le projet démarre avec une application monopage autonome :

```
BUDGET_HOME/
├── Budget_et_Immo.html        # Application complète (HTML + CSS + JS)
├── budget_v6_2025-12-15.json  # Exemple de fichier de sauvegarde
└── README.md
```

- **Aucune dépendance à installer** : un simple fichier HTML.
- **Chart.js** chargé via CDN pour les graphiques.
- Données stockées côté client uniquement (respect de la vie privée).

---

## 🚀 Utilisation

### En local
Ouvrez simplement le fichier `Budget_et_Immo.html` dans un navigateur. Aucun serveur requis.

### Déploiement Vercel
Ce dépôt est destiné à être déployé sur Vercel :

```bash
# Depuis la racine du dépôt
npx vercel
```

Ou connectez le dépôt GitHub à un projet Vercel : le fichier HTML statique sera servi automatiquement.

---

## 🧮 Calculs & logique métier

| Élément | Formule |
|---|---|
| Ratio de répartition | `salaire_i / total salaires` (ou 50/50 si forcé) |
| Dépense annualisée | mensuelle × 12, sinon montant annuel |
| Capacité d'épargne | revenus − dépenses |
| Équilibre | `payé_réellement − part_théorique` (verdict : qui doit quoi à qui) |
| Plafond bancaire | 35 % des revenus mensuels |
| Reste à vivre | revenus − (dépenses hors loyer) |
| Mensualité max | min(plafond bancaire, reste à vivre) |
| Montant empruntable | mensualité / facteur d'annuité (intérêts + assurance) |
| Prix net vendeur | enveloppe / (1 + taux de frais de notaire) |

---

## 🗺 Feuille de route

- [ ] Refactorer l'application monopage en projet structuré (React/Next.js ou Vite) pour préparer l'évolution.
- [ ] Multi-postes : gérer plusieurs budgets/foyers.
- [ ] Authentification et synchronisation cloud des budgets.
- [ ] Catégories personnalisables et budgets mensuels par catégorie.
- [ ] Suivi historique et comparaison mois par mois.

---

## 🤝 Contribuer

1. Forkez le projet.
2. Créez votre branche : `git checkout -b feat/ma-fonctionnalite`.
3. Commitez vos changements : `git commit -m "feat: ..."`.
4. Poussez la branche : `git push origin feat/ma-fonctionnalite`.
5. Ouvrez une Pull Request.

---

## 📄 Licence

Projet privé — tous droits réservés.
