export const PLANS = [
  { id: 'essential', name: 'Essentiel', price: 1100, description: 'Leçons débutants et 5 exemples de prompts par jour.' },
  { id: 'creative', name: 'Créatif', price: 2200, description: 'Toutes les leçons texte, 5 exemples par jour et 10 prompts image personnalisés par jour.' },
  { id: 'complete', name: 'Complet', price: 5500, description: 'Tous les prompts, leçons texte, vidéos publiées et assistance WhatsApp.' },
];
export const planById = id => PLANS.find(p => p.id === id);
export function dayKey(ms = Date.now()) { return new Date(ms + 3600000).toISOString().slice(0, 10); }
// Calendar month, clamped at month end; Cameroon is UTC+1 all year.
export function addMonth(ms) {
  const d = new Date(ms + 3600000), day = d.getUTCDate();
  d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 1);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.getTime() - 3600000;
}
export const normalizeReference = value => typeof value === 'string' ? value.trim().toUpperCase() : '';
export function imagePrompt({ subject, style, format }) {
  return `Crée une image de ${subject}. Style souhaité : ${style}. Format : ${format}. Compose une scène cohérente, avec un sujet clairement identifiable et un éclairage adapté. N’ajoute ni texte ni logo non demandé. Si un détail essentiel manque, demande-moi de le préciser.`;
}
export const examples = [
  'Organise cinq repas pour deux personnes, avec 30 minutes de préparation maximum. Présente un tableau et une liste de courses.',
  'Prépare un message poli pour demander un rendez-vous. Laisse la date et le destinataire entre crochets pour que je les complète.',
  'Explique les pourcentages à un débutant avec un exemple en FCFA. Pose ensuite un exercice et attends ma réponse.',
  'Transforme mes notes en liste de tâches avec responsable et échéance. Indique « À préciser » pour les informations manquantes.',
  'Aide-moi à préparer ma semaine. Demande d’abord mes trois priorités et mes horaires disponibles.',
  'Résume le texte suivant en cinq points. Conserve les chiffres et signale les passages ambigus sans les compléter.',
  'Propose trois titres pour mon annonce. Demande-moi le produit, le public et le ton avant de les rédiger.',
  'Relis ce message et corrige les fautes sans changer les faits ni ajouter de promesse. Explique les changements principaux.',
  'Compare ces deux offres dans un tableau à partir des seuls détails fournis. Signale ce qui manque pour décider.',
  'Crée une checklist pour préparer une réunion de 30 minutes. Termine par un modèle de compte rendu.',
  'À partir de ce cours, prépare cinq questions de révision. Pose-les une par une et explique chaque correction.',
  'Aide-moi à construire un budget fictif. Sépare les dépenses fixes et variables sans supposer mes revenus.',
  'Réécris ce texte pour un débutant en conservant le sens. Définis les mots techniques avec un exemple.',
  'Découpe mon projet en petites étapes. Demande d’abord le résultat attendu, la date limite et les moyens disponibles.',
  'Vérifie cette affirmation avec une recherche sur des sources officielles si la recherche est disponible. Fournis les liens et les incertitudes.',
  'Rédige deux versions de cette invitation : chaleureuse et formelle. N’invente ni lieu, ni date, ni nom.',
  'Aide-moi à préparer un entretien. Pose une question à la fois et donne un retour concret sur ma réponse.',
  'Propose un planning de révision de 20 minutes par jour sur une semaine, adapté au sujet et au niveau que je vais préciser.',
  'Transforme cette procédure en étapes numérotées. Garde les avertissements et signale les instructions contradictoires.',
  'Analyse mon brouillon de prompt. Repère le but, le contexte, le format et les contraintes, puis propose une version plus précise.',
];
export function dailyExamples(plan, now) {
  if (plan === 'complete') return examples;
  const offset = Math.floor((now + 3600000) / 86400000) % examples.length;
  return Array.from({ length: 5 }, (_, i) => examples[(offset + i) % examples.length]);
}
