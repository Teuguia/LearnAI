import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Page, Body, Card, Button, styles } from '../components/ui';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { Catalog, planNames, dateLabel } from '../lib/types';
export default function Home() {
  const { me } = useSession(); const [catalog, setCatalog] = useState<Catalog | null>(null), [error, setError] = useState(''), [favorites, setFavorites] = useState(false);
  const load = () => api<Catalog>('/catalog').then(setCatalog).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);
  const completed = me?.progress.filter(p => p.completed).length || 0;
  return <Page title={me ? `Bonjour ${me.user.name}` : 'Votre parcours'}>
    <Card><Text style={styles.heading}>{me?.membership ? `Offre ${planNames[me.membership.plan]}` : 'Votre formation commence ici'}</Text>
      <Body>{me?.membership ? `Accès jusqu’au ${dateLabel(me.membership.ends)}.` : 'Choisissez une offre pour accéder aux leçons et aux prompts.'}</Body>
      <Link style={styles.link} href="/offers">Voir les abonnements</Link>
    </Card>
    <View style={styles.row}><Link style={styles.link} href="/prompts">Mes prompts</Link><Link style={styles.link} href="/account">Mon compte</Link>{me?.user.role === 'admin' && <Link style={styles.link} href="/admin">Administration</Link>}</View>
    <Text style={styles.heading}>Votre parcours · {completed}/{catalog?.lessons.length || 0} leçons validées</Text>
    <Button secondary title={favorites ? 'Afficher toutes les leçons' : 'Afficher mes favoris'} onPress={() => setFavorites(!favorites)} />
    {!!error && <><Text style={styles.error}>{error}</Text><Button title="Réessayer" onPress={() => { setError(''); load(); }} /></>}
    {catalog?.lessons.filter(l => !favorites || me?.progress.some(p => p.lesson_id === l.id && p.favorite)).map(l => {
      const unlocked = me?.membership && (l.level === 'beginner' || me.membership.plan !== 'essential');
      return <Card key={l.id}><Text style={styles.muted}>{l.tag} · {l.minutes} MIN · {l.level === 'beginner' ? 'Débutant' : 'Approfondissement'}</Text><Text style={styles.heading}>{l.title}</Text>
        <Body>{me?.progress.some(p => p.lesson_id === l.id && p.completed) ? 'Leçon validée' : unlocked ? 'Prête à découvrir' : 'Abonnement requis'}{l.video ? ' · Vidéo disponible avec Complet' : ''}</Body>
        <Link style={styles.link} href={unlocked ? { pathname: '/lesson/[id]', params: { id: l.id } } : '/offers'}>{unlocked ? 'Ouvrir la leçon' : 'Découvrir les offres'}</Link></Card>;
    })}
    {favorites && !me?.progress.some(p => p.favorite) && <Body>Gardez une leçon dans vos favoris pour la retrouver ici.</Body>}
  </Page>;
}
