# Validation — 22 septembre 2026

- `npx tsc --noEmit` : réussi.
- `EXPO_OFFLINE=1 npx expo export --platform android --platform ios --output-dir dist` : réussi (593 modules Android, 598 modules iOS).
- Les dépendances natives ont été choisies à partir de la table de compatibilité embarquée du SDK Expo. La vérification distante React Native Directory était indisponible.

L’export Metro/Hermes ne constitue pas une compilation native signée ni une validation sur appareil. Aucun essai visuel, lecteur d’écran, persistance après redémarrage ou installation sur Android/iPhone n’a été exécuté ici. Aucun déploiement AWS ou GitHub effectué.

## Recette à réaliser sur chaque plateforme

1. Ouvrir le parcours et chacun des six cours.
2. Saisir un brouillon et vérifier qu’il reste visible après retour puis redémarrage.
3. Choisir une mauvaise réponse : la leçon ne doit pas pouvoir être validée.
4. Choisir la bonne réponse et valider : progression +1, sans double comptage lors d’une reprise.
5. Ajouter puis retirer un favori ; vérifier sa persistance après redémarrage.
6. Tester sans réseau après installation, avec texte agrandi et lecteur d’écran.
7. Vérifier le clavier, les zones sûres et le retour système Android.
