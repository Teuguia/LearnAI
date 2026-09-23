# Validation de la version abonnements

- 12 tests serveur réussis (HTTP, SQLite, contrôle des accès et règles commerciales).
- Lint Expo et vérification TypeScript réussis.
- Export des bundles Android, iOS et web réussi.
- Vérification des quotas concurrents, de l’unicité des références et de l’idempotence des validations.
- Vérification de la remise à zéro à minuit au Cameroun et des mois calendaires.
- Vérification de l’expiration/révocation, des accès Complet et des flux vidéo par plages d’octets.

Aucun paiement réel, compte marchand externe ou service IA n’est utilisé dans les tests.
Le flux vidéo est testé avec des octets fictifs, pas avec un cours ni un décodage sur appareil.
Le navigateur distant ne peut pas joindre le serveur local : aucune validation visuelle
n’est revendiquée. Aucun APK/IPA signé ni déploiement public n’a été réalisé.

Avant ouverture : suivre [le guide d’exploitation](memberships.md), effectuer une recette
sur Android et iPhone réels, fournir les vidéos et compléter les parcours de gestion de compte.
