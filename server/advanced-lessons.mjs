// Content is served by the API, never imported by the mobile bundle.
export const advanced = [
  { id: 'brief-image', title: 'Préparer un brief pour une image', tag: 'CRÉATION VISUELLE', minutes: 7, level: 'advanced',
    body: 'Décrivez le sujet, son environnement, la composition, la lumière et le style souhaités. Précisez le format et les éléments à éviter. Commencez par une intention simple, puis ajustez un élément à la fois.\n\nPour un produit, indiquez les caractéristiques qui doivent rester fidèles à la référence. Après génération, vérifiez les détails, les textes et les proportions avant publication.',
    example: 'Crée une photo de présentation d’un savon artisanal posé sur une table en bois clair. Composition centrée, lumière douce venant de gauche, fond beige uni, format carré. N’ajoute ni marque ni texte. Conserve la forme et la couleur du produit de ma photo de référence.',
    challenge: 'Écrivez un brief pour un produit fictif avec sujet, composition, éclairage, format et deux limites.',
    question: 'Quel brief précise le mieux la composition ?', options: ['Fais une belle image.', 'Produit centré, fond beige, lumière douce à gauche, format carré.', 'Fais quelque chose de parfait.'], answer: 1,
    explanation: 'La deuxième proposition donne des choix visuels concrets à suivre et à vérifier.' },
  { id: 'workflow-pro', title: 'Construire une méthode de travail réutilisable', tag: 'PRODUCTIVITÉ', minutes: 8, level: 'advanced',
    body: 'Pour une tâche répétitive, créez un modèle de demande avec des champs à remplir : objectif, informations vérifiées, destinataire, format et critères de qualité. Testez-le sur plusieurs exemples.\n\nSéparez la préparation, la rédaction et la vérification. Une méthode fiable inclut une relecture humaine avant un envoi ou une publication.',
    example: 'Prépare un brouillon de réponse client. Demande : [à compléter]. Faits confirmés : [à compléter]. Ton : poli et direct. Format : moins de 100 mots. N’invente aucun prix ni délai. Termine par la liste des informations que je dois vérifier avant l’envoi.',
    challenge: 'Créez un modèle pour une tâche récurrente et testez-le avec deux situations fictives.',
    question: 'Quand faut-il vérifier les engagements dans un message client ?', options: ['Après son envoi.', 'Jamais si le modèle est réutilisable.', 'Avant chaque envoi.'], answer: 2,
    explanation: 'Le contexte change d’un client à l’autre ; les faits et les engagements doivent être relus à chaque utilisation.' },
];
