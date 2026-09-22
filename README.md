# Déclic IA — prototype mobile 0.1

Application de formation à ChatGPT en français pour le grand public, Android et iPhone.
Nom provisoire. Formation indépendante, non affiliée à OpenAI.

## Démarrage

Installer Node.js compatible avec le SDK Expo de package.json, puis :

```sh
npm ci
npx expo start
```

Ouvrir le projet avec une version d’Expo Go compatible avec le SDK indiqué dans package.json, ou un build de développement. Les scripts `npm run android` et `npm run ios` ciblent les simulateurs installés (le simulateur iOS requiert macOS).

## Inclus

- Accueil, catalogue, favoris et progression.
- Six leçons en français, exemples, exercices et quiz avec explications.
- Validation après une bonne réponse ; une leçon ne compte qu’une fois.
- Brouillons, favoris et progression stockés localement avec AsyncStorage.
- Contenus embarqués, utilisables hors ligne après installation.
- Zones tactiles larges et libellés d’accessibilité.

Les brouillons ne sont pas évalués par IA. La répétition du quiz est autorisée : ce score n’est pas une certification.

## Limites et étapes restantes

Prototype de code, pas une application publiée. Pas de compte utilisateur, synchronisation AWS, paiement, notifications, administration de contenus ou tuteur IA. Les icônes sont celles du modèle Expo et doivent être remplacées avant publication. Aucun compte Apple/Google ni identifiant d’application définitif n’a été configuré.

Avant une bêta : essais sur appareils Android et iPhone (navigation, clavier, rotation, agrandissement du texte, lecteur d’écran, reprise après fermeture et hors ligne), identité visuelle, validation pédagogique puis signature des builds. Prévoir la politique de confidentialité et l’effacement des données avant lancement public.

## Qualité

```sh
npx tsc --noEmit
npx expo export --platform android --platform ios --output-dir dist
```

Les contrôles réellement exécutés sont consignés dans docs/validation.md.

## GitHub

Aucun dépôt accessible n’a été renvoyé par le connecteur lors de la préparation. Projet non poussé. Connecter ou fournir un dépôt dédié avant publication du code. Ne pas placer de secrets dans l’application.

## Architecture envisagée pour la suite

Le client React Native/Expo partage le code Android/iOS. AWS pourra accueillir l’authentification, les contenus et la progression. Ce choix sera détaillé avant raccordement ; aucune ressource AWS n’est provisionnée dans ce prototype. Un éventuel tuteur OpenAI passera par un backend avec quotas, jamais par une clé secrète embarquée. L’enseignement des fonctions de ChatGPT et les capacités d’un tuteur intégré sont deux éléments distincts.

## Sources

- https://learn.chatgpt.com/docs/prompting — principes de formulation et d’itération.
- https://docs.expo.dev/more/create-expo/ — initialisation du projet.
- https://docs.amplify.aws/flutter/how-amplify-works/ — aperçu des services backend et des bibliothèques mobiles AWS ; pas une configuration de ce client.

Contenu initial préparé le 22 septembre 2026. Vérifier les leçons liées à des fonctionnalités avant chaque publication.
