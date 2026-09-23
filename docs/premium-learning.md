# Formations texte, vidéo et accès payant

Statut : préparation produit et technique, 23 septembre 2026.
Cette modification ajoute quatre leçons texte au prototype (dix au total).
Elle ne produit aucune vidéo et n'active ni paiement ni verrouillage premium.
Les leçons embarquées restent consultables pour tester le contenu. Ne pas distribuer
les futurs contenus payants dans le bundle public : ils seront servis après contrôle d'accès.

## Parcours pédagogique

Chaque leçon commercialisée aura : objectif, vidéo courte sous-titrée en français,
transcription texte accessible séparément, exemple de prompt, exercice et quiz expliqué.
Le texte doit permettre d'apprendre sans charger la vidéo, notamment avec une connexion limitée.

| Module | Contenu | Validation |
| --- | --- | --- |
| Écrire une demande claire | Objectif, contexte, format, contraintes, exemple attendu | Réécrire une demande vague |
| Adapter ChatGPT | Préférences de langue, niveau, instructions personnalisées, test des réglages | Distinguer préférence durable et consigne ponctuelle |
| Gagner du temps | Messages, planning, synthèse de notes, apprentissage | Réaliser une tâche personnelle avec données fictives |
| Vérifier les réponses | Sources, faits, informations manquantes, confidentialité | Repérer et corriger une supposition |

Les identifiants existants restent stables pour conserver favoris et progression.
Les quatre nouvelles leçons sont prompt-structure, prompt-exemple, personnaliser,
preferences-tache. Le compteur du parcours suit désormais le nombre réel de leçons.

## Production vidéo à réaliser

Pour les deux premières vidéos :
1. « Une demande claire » : montrer une demande vague, ajouter successivement le résultat,
   le contexte, le format et les limites ; montrer la réponse réellement obtenue ; vérifier
   les faits ; terminer par l'exercice prompt-structure. Cible : 3 à 5 minutes.
2. « Personnaliser ChatGPT » : capturer la version utilisée, ouvrir les paramètres,
   montrer les réglages disponibles avec un compte de démonstration, saisir des préférences
   fictives et comparer une réponse avant/après. Cible : 3 à 5 minutes.

Produire ensuite les sous-titres relus et une transcription fidèle. Ne pas simuler une
démonstration en faisant passer des résultats inventés pour ceux de ChatGPT.
Les menus doivent être vérifiés au moment du tournage ; ne montrer ni secrets ni données
de clients. Les vidéos et leurs droits de diffusion restent à fournir/produire.

## Parcours d'achat cible

Catalogue et descriptif → compte utilisateur → offre avec prix, devise et durée explicites
→ paiement → attente de confirmation → accès aux textes et vidéos achetés.
Un paiement en attente, annulé, expiré ou échoué ne débloque pas le cours.
Si la connexion coupe après paiement, la reconnexion retrouve le statut côté serveur :
ne pas demander immédiatement de payer une deuxième fois.

Le serveur crée la commande avec son propre prix et un identifiant unique. Il appelle
le prestataire autorisé. La confirmation opérateur doit être vérifiée par le mécanisme
documenté du prestataire, puis réconciliée avec le statut distant, le montant, la devise,
la référence et le bénéficiaire attendus. La redirection vers l'application ne prouve
jamais le paiement. Traiter les notifications répétées de façon idempotente ; un succès
confirmé ne doit pas être écrasé par une ancienne notification en attente.

Le droit d'accès appartient au compte utilisateur et au cours acheté. Vérifier ce droit
pour chaque récupération de texte premium et chaque délivrance d'URL vidéo temporaire.
Prévoir remboursement, révocation, expiration si l'offre en prévoit, et restauration
sur un autre téléphone. Les secrets opérateurs restent côté serveur. L'application ne
collecte pas le PIN Mobile Money.

## Canaux de distribution

Orange propose Orange Money Web Payment au Cameroun sous réserve d'éligibilité et de
souscription marchand. MTN présente une solution Collections au Cameroun. Le pays cible,
le prestataire, le contrat et l'accès production restent à confirmer.

Pour les cours numériques vendus dans une application App Store ou Google Play, les
achats intégrés sont généralement requis, sauf programmes/exceptions applicables.
Ne pas ajouter automatiquement un bouton de paiement externe aux versions des stores.
Une vente sur le web et la consultation dans l'application nécessitent aussi de vérifier
les règles du store concerné. Le statut Apple « reader app » n'est pas présumé acquis
pour cette application interactive avec quiz.

Prévoir une configuration des moyens de paiement par canal et marché. Une distribution
Android directe par APK peut faire l'objet d'un parcours Mobile Money distinct. Le choix
de distribution iPhone doit être arrêté avant l'intégration commerciale.

## Architecture proposée, à implémenter

- Authentification et récupération de compte.
- Catalogue public séparé des contenus protégés.
- API commandes, suivi du paiement et droits d'accès ; adaptateurs opérateurs et stores.
- Stockage privé des vidéos, diffusion avec URL temporaire après autorisation.
- Administration des textes, médias, prix et versions, avec aperçu avant publication.
- Reprise de lecture et progression synchronisée par compte.

AWS est une option : Cognito, API Gateway/Lambda, DynamoDB, S3 privé et CloudFront.
Aucune ressource n'est provisionnée par cette modification.

## Mise à jour des cours

Versionner les cours et conserver leurs identifiants. Après publication administrative,
le catalogue récupéré du serveur expose la nouvelle version sans nouvelle installation.
Ne modifier ni une offre déjà achetée ni sa durée implicitement. Une modification native
du lecteur, du paiement ou de l'application peut nécessiter une nouvelle version des stores.
La version actuelle embarque les leçons : ce mécanisme de publication distante reste à créer.

## Informations nécessaires avant raccordement

- Pays et devise de lancement (Cameroun/XAF est une hypothèse à confirmer).
- Prix et accès : achat par formation ou abonnement, durée et périmètre.
- Compte marchand Orange/MTN ou agrégateur, accès test puis production.
- Vidéos existantes ou production à organiser, identité de l'éditeur et support client.
- Canaux de distribution : stores, web et/ou APK Android direct.

## Recette avant lancement commercial

Tester réussite, refus, expiration, retour interrompu, notifications dupliquées et retardées,
montant incorrect, tentative d'accès à un autre compte, réinstallation, remboursement,
restauration et expiration d'URL vidéo. Vérifier que le bundle ne contient pas les textes
premium ni les secrets. Tester le lecteur et les sous-titres sur Android et iPhone physiques.

## Sources à revalider au lancement

- https://learn.chatgpt.com/docs/prompting
- https://learn.chatgpt.com/docs/personalize
- https://developer.orange.com/apis/om-webpay
- https://momodeveloper.mtn.com/Cameroon_Widget_productDetails
- https://developer.apple.com/app-store/review/guidelines/ (3.1)
- https://support.google.com/googleplay/android-developer/answer/9858738?hl=en
