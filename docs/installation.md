# Versions installables LearnAI

## Prérequis
Node.js 22.13 ou supérieur compatible, compte Expo, fichiers de cette branche intégrés au projet.
Nom affiché : Déclic IA. Identifiants proposés : com.teuguia.learnai sur Android et iOS. Vérifier leur disponibilité avant la première signature ; les conserver ensuite pour les mises à jour.

## Préparer depuis PowerShell

```powershell
npm ci
npx eas-cli@latest login
npx eas-cli@latest init
```

Choisir son compte Expo et créer ou associer le projet. Cette étape inscrit le véritable projectId dans app.json ; aucun identifiant fictif n’est fourni ici. Conserver ensuite les changements d’app.json dans GitHub. Les identifiants Expo se saisissent dans le terminal, jamais dans un message ni un fichier du dépôt.

## Android : APK autonome

```powershell
npx eas-cli@latest build --platform android --profile preview
```

Lors du premier build, laisser EAS générer la clé de signature si aucune clé existante ne doit être réutilisée. Après réussite du build, télécharger l’APK depuis le lien EAS sur Android et suivre l’installation proposée. Aucun compte Google Play n’est nécessaire pour cet APK. Aucun serveur Metro ni Expo Go n’est nécessaire après installation.

## iPhone : distribution de test ad hoc

Nécessite un abonnement Apple Developer actif et les autorisations de signature de l’équipe. Un simple compte Apple gratuit ne suffit pas pour cette distribution EAS.

```powershell
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile preview
```

Ouvrir le lien d’enregistrement sur l’iPhone et terminer l’enregistrement avant de lancer le build. Suivre les demandes de connexion Apple dans le terminal ; sélectionner l’appareil enregistré dans le profil. Après réussite, ouvrir le lien d’installation EAS sur cet iPhone. Activer le mode développeur si iOS le demande. Seuls les appareils inclus dans le profil peuvent installer cette version ; ajouter un appareil nécessite une nouvelle signature ou compilation.

## Plus tard : magasins et TestFlight

Le profil production prépare un AAB Android et un build iOS destiné à App Store Connect/TestFlight. Il n’effectue aucune publication automatique. Les comptes développeur, métadonnées, déclarations de confidentialité et contrôles des magasins restent à préparer. Les icônes actuelles sont provisoires.

## Fonctionnement

Les six cours, quiz, favoris et brouillons fonctionnent localement. La progression n’est pas synchronisée entre appareils. Ces versions ne déploient aucune infrastructure AWS et n’appellent pas une API IA.

## Validation et limites

Configuration préparée pour EAS Build. Un export JavaScript ou une validation JSON ne prouve pas la réussite d’une compilation native signée. Aucun APK/IPA n’est inclus dans cette modification. Les liens d’installation n’existent qu’après un build EAS réussi. Les quotas et éventuels frais sont affichés par Expo ; ne pas souscrire un forfait sans décision du propriétaire.

Sources :
- https://docs.expo.dev/build/eas-json/
- https://docs.expo.dev/build/internal-distribution/
- https://docs.expo.dev/build-reference/apk/
