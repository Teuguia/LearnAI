# Comptes et abonnements LearnAI

## Périmètre livré

- Inscription et connexion par e-mail/mot de passe ; sessions opaques expirant après sept jours.
- Mots de passe dérivés avec scrypt, sessions conservées hachées dans SQLite.
- Session mobile dans Expo SecureStore ; session web en mémoire uniquement (reconnexion au rechargement).
- Catalogue public sans corps de cours ; textes transmis après vérification serveur du plan et de l'expiration.
- Déclaration Orange Money avec référence et numéro du payeur, état en attente, refus motivé ou validation.
- Administration réservée au rôle serveur, contrôle du montant et de la référence recopiés de l'historique marchand.
- Unicité globale des références, une demande en attente par compte, approbation et attribution atomiques et idempotentes.
- Renouvellement d'un mois calendaire, borné au dernier jour du mois si nécessaire. Un renouvellement anticipé
  commence à l'expiration de la période déjà payée. Changement de formule à l'expiration uniquement pour cette version.
- Révocation de la période associée à un paiement ; aucun remboursement financier automatique.
- Cinq exemples du jour avec Essentiel/Créatif ; bibliothèque complète avec Complet. Les exemples se consultent
  plusieurs fois et ne sont pas consommés à chaque ouverture.
- Dix créations de prompts image par jour avec Créatif, contrôlées atomiquement, mêmes quotas sur tous les appareils.
  Complet n'a pas ce quota commercial (une limitation technique des requêtes existe).
- Favoris, brouillons et leçons validées enregistrés par compte. Les nouveaux comptes ne reprennent pas automatiquement
  la progression anonyme du prototype ; celle-ci n'est pas supprimée du stockage de l'ancien appareil.
- Lien WhatsApp contrôlé par le serveur pour Complet. Le numéro marchand étant également public, le logiciel ne peut
  empêcher quelqu'un de contacter directement ce numéro : l'accompagnateur doit vérifier le compte et l'abonnement.
- Lecteur Expo Video, flux MP4 privé avec prise en charge des plages d'octets, tickets temporaires de 30 minutes.
  Le serveur revérifie le droit Complet à chaque requête du flux. Les vidéos déjà consultées ne bénéficient pas de DRM.

## Lancement local sur Windows (PowerShell)

Installer Node.js 24 puis ouvrir un terminal à la racine du dépôt :

```powershell
npm ci
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

Modifier `server/.env` :

```dotenv
HOST=0.0.0.0
PORT=3001
DATABASE_PATH=server/data/learnai.sqlite
MEDIA_DIR=server/media
MANUAL_PAYMENTS_ENABLED=true
ORANGE_MONEY_MERCHANT=REMPLACER_PAR_VOTRE_NUMERO
WHATSAPP_SUPPORT_NUMBER=REMPLACER_PAR_VOTRE_NUMERO
ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
```

Remplacer les deux valeurs de numéro par le numéro validé avec le propriétaire, au
format `+237` suivi de neuf chiffres. Les valeurs réelles restent dans `server/.env`,
exclu du dépôt, ou dans les variables du fournisseur d’hébergement. Elles ne sont
pas des clés API : le numéro marchand sera montré aux membres pour effectuer le
paiement, et le contact WhatsApp sera donné aux membres Complet.

`0.0.0.0` permet les tests sur le réseau local ; limiter le pare-feu à votre réseau de test.
Sur serveur hébergé, utiliser le réseau privé du proxy HTTPS.

Pour Android direct, modifier `.env` avec l'adresse IPv4 du PC (obtenue via `ipconfig`) :

```dotenv
EXPO_PUBLIC_API_URL=http://ADRESSE_IP_DU_PC:3001
EXPO_PUBLIC_DISTRIBUTION=direct
```

Pour le web local, choisir `EXPO_PUBLIC_DISTRIBUTION=web` et l'API `http://127.0.0.1:3001`.
Pour les builds stores choisir `store`. Ces variables publiques ne doivent contenir aucun secret.
Redémarrer Expo après modification. L'API doit être accessible séparément : le tunnel Expo
ne publie pas automatiquement le serveur sur le port 3001.

Terminal serveur :

```powershell
node --env-file=server/.env server/api.mjs
```

Terminal application :

```powershell
npx expo start --clear
```

## Créer l'administrateur

1. Créer votre propre compte dans l'application avec votre adresse et un mot de passe fort.
2. Depuis le serveur, lui attribuer le rôle administrateur :

```powershell
node --env-file=server/.env server/admin.mjs promote votre-adresse@example.com
```

3. Actualiser Mon compte ou se reconnecter : le lien Administration apparaît à l'accueil.

Aucun mot de passe administrateur ni compte privilégié n'est préinstallé.
Ne jamais donner ce rôle sur la base d'une adresse revendiquée par un tiers.
`demote` retire le rôle ; les autorisations sont relues côté serveur à chaque requête.

## Traiter un paiement

L'utilisateur choisit sa formule, effectue son paiement dans Orange Money et renseigne
la référence du reçu et son numéro payeur. Le serveur détermine le prix ; les montants
et statuts proposés par le client ne sont pas acceptés comme preuve.

Dans Administration : comparer la demande avec votre historique Orange Money, vérifier
le bénéficiaire, le payeur et le montant, recopier la référence et le montant reçus,
cocher la confirmation, puis valider. L'utilisateur actualise Mon compte pour retrouver
son accès. Une capture seule ne suffit jamais. En cas de doute, laisser en attente ou
refuser avec un motif. Une référence déjà déclarée reste réservée même après refus,
pour éviter sa réutilisation ; corriger les litiges après vérification administrative.

Pour un remboursement, effectuer d'abord l'opération financière selon votre procédure
Orange Money, puis révoquer la période concernée et indiquer le motif. Les décisions sont
conservées dans `audit`. Les périodes ultérieures déjà payées ne sont pas supprimées.
Une révocation peut ainsi créer une interruption avant la prochaine période valide.

Les 200 demandes les plus récentes sont affichées, avec les demandes en attente en premier.
Avant une montée en charge, ajouter pagination, recherche et traitement des litiges.

## Ajouter un cours vidéo

Placer un MP4 dont vous détenez les droits dans le dossier privé `MEDIA_DIR`, avec
l'identifiant exact d'une leçon comme nom, par exemple `objectif.mp4`.
Le catalogue détecte le fichier ; le bouton vidéo n'apparaît que pour cette leçon et
un membre Complet. Aucun échantillon fictif n'est présenté comme cours.

Pour une première diffusion, utiliser un MP4 H.264/AAC compatible iPhone/Android et
optimisé pour la lecture progressive. Intégrer les sous-titres au fichier si nécessaire ;
le chargement de pistes de sous-titres séparées et le téléchargement hors ligne ne sont
pas encore implémentés. La leçon texte reste disponible séparément.

Les textes débutants sont dans `server/lessons.json`, les approfondissements dans
`server/advanced-lessons.mjs`. Modifier côté serveur, conserver les identifiants, tester
et redémarrer le service pour publier. Les utilisateurs rechargent le catalogue/le cours.
Une interface d'édition des cours reste à développer. Les modifications natives
nécessitent un nouveau build ; EAS Update n'est pas configuré par cette PR.

## Hébergement

API sur Node.js 24, un seul processus/une seule instance SQLite avec stockage persistant.
Le Dockerfile fourni se construit à la racine :

```sh
docker build -f server/Dockerfile -t learnai-api .
docker run --env-file server/.env -e HOST=0.0.0.0 -e DATABASE_PATH=/data/learnai.sqlite -e MEDIA_DIR=/media -p 127.0.0.1:3001:3001 -v learnai-data:/data -v learnai-media:/media learnai-api
```

Configurer un proxy HTTPS et un domaine. Ne pas publier la base ou le dossier média
comme fichiers statiques. Sauvegarder la base de manière cohérente (outil de sauvegarde
SQLite) et tester la restauration ; tenir compte du journal WAL. Les sauvegardes,
comptes et transactions contiennent des données personnelles.

Configurer `ALLOWED_ORIGINS` avec les origines exactes du site web. Le limiteur utilise
l'adresse de la connexion, sans faire confiance à `X-Forwarded-For` : derrière un proxy,
il limite l'ensemble des clients de ce proxy. Ajouter un limiteur fiable au proxy et
adapter celui du serveur avant une ouverture à grande échelle. Pas de mode multi-instance
avec des fichiers SQLite séparés : comptes, références et quotas doivent partager la même base.

Renseigner l'URL HTTPS publique dans `EXPO_PUBLIC_API_URL` avant chaque build mobile/web.
Ne pas utiliser les serveurs de développement pour encaisser de vrais paiements.

## Distribution et limites avant lancement public

Le code bloque les instructions de paiement manuel sur iPhone et dans les builds `store`.
Les profils EAS distinguent APK direct de production store. Il faut intégrer les achats
Apple/Google et vérifier les règles applicables avant commercialisation dans les boutiques.
L'accès aux achats réalisés ailleurs dépend aussi de ces règles ; cette implémentation
ne constitue pas une validation par Apple/Google.

À compléter avant lancement public : hébergement HTTPS, sauvegardes et supervision,
politique de confidentialité et conditions de vente, récupération de mot de passe,
vérification d'adresse e-mail, suppression/export de compte, vidéos réelles et test sur
appareils physiques. Ces parcours de gestion de compte ne sont pas simulés dans cette version.
Pas de garantie de réponse immédiate ou de support 24h/24 ; horaires d'assistance à définir.

## Validation réalisée

Tests HTTP automatisés : rôle admin, contenus privés, prix serveur, références uniques,
requêtes répétées, quotas concurrents, changement de jour, renouvellement, révocation,
expiration, progression isolée, vidéo protégée et paiements désactivés par défaut.
Lint et TypeScript ; export des bundles Android, iOS et web. Ce n'est pas un build signé
ni un test sur appareil. Le navigateur distant n'a pas pu joindre le serveur local ;
aucune validation visuelle de bout en bout n'est revendiquée.
