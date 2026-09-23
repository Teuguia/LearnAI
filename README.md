# LearnAI / Déclic IA

Application Expo Android/iPhone et web pour apprendre à utiliser ChatGPT.
Les formations payantes sont servies par une API Node.js 24 avec SQLite.

## Offres validées

| Offre mensuelle | Prix (XAF / FCFA) | Accès |
| --- | ---: | --- |
| Essentiel | 1 100 | Texte débutant, 5 exemples de prompts par jour |
| Créatif | 2 200 | Tous les textes, exemples quotidiens et 10 prompts image personnalisés par jour |
| Complet | 5 500 | Tous les prompts, textes, vidéos publiées et accompagnateur WhatsApp |

Remise à zéro à minuit au Cameroun. Les numéros Orange Money et WhatsApp sont
configurés dans les variables privées du serveur. Validation manuelle par un
administrateur, sans prélèvement automatique.

## Démarrer

Node.js 24 ou plus récent requis.

```sh
npm ci
cp .env.example .env
cp server/.env.example server/.env
node --env-file=server/.env server/api.mjs
```

Dans un autre terminal :

```sh
npx expo start
```

Configurer l'adresse de l'API dans `.env` avant le démarrage ; un téléphone physique
nécessite une adresse joignable depuis le téléphone. Ne pas mettre de secret dans
une variable `EXPO_PUBLIC_*`. Les builds de diffusion nécessitent HTTPS.

Voir **[le guide d'installation et d'exploitation](docs/memberships.md)** pour activer
les paiements manuels, créer l'administrateur, ajouter les vidéos et préparer l'hébergement.

## Vérification

```sh
npm run test:server
npm run lint
npm run typecheck
npx expo export --platform android --platform ios --platform web
```

## État de cette version

Comptes, offres, déclaration et examen des paiements, accès serveur, quotas, favoris,
brouillons, progression et lecteur vidéo intégrés. Dix leçons débutants et deux leçons
approfondies disponibles côté serveur. Vingt exemples de prompts constituent la banque
initiale ; les sélections quotidiennes peuvent revenir dans le temps.

Les prompts image sont assemblés par un modèle de texte avec les choix du membre ;
aucun modèle d'IA ni génération d'image n'est appelé. Aucun fichier vidéo de cours
n'est fourni. Aucune API Orange Money n'est appelée : l'administrateur vérifie la
réception réelle hors application avant de valider. MTN MoMo reste à intégrer.

Les achats externes sont masqués dans les builds iPhone et `store`. Les achats intégrés
Apple/Google ne sont pas encore implémentés. Cette version nécessite un hébergement
API, des essais sur appareils et la préparation commerciale décrite dans le guide
avant ouverture au public. Aucun APK/IPA signé n'est produit par cette PR.
