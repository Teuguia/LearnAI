import React from 'react';
import { Text, Linking } from 'react-native';
import { router } from 'expo-router';
import { Page, Body, Card, Button, styles, useAction } from '../components/ui';
import { useSession } from '../lib/session';
import { api } from '../lib/api';
import { planNames, paymentNames, dateLabel } from '../lib/types';
export default function Account() {
  const { me, refresh, signOut } = useSession(); const action = useAction();
  return <Page title="Mon compte">
    <Body>{me?.user.name} · {me?.user.email}</Body>
    <Card><Text style={styles.heading}>{me?.membership ? planNames[me.membership.plan] : 'Aucun abonnement actif'}</Text>
      <Body>{me?.membership ? `Accès jusqu’au ${dateLabel(me.membership.ends)}. Les droits sont vérifiés à chaque demande.` : 'Un paiement validé active votre accès aux cours.'}</Body>
      <Button title="Actualiser mon abonnement" disabled={action.busy} onPress={() => action.run(refresh)} />
    </Card>
    {me?.membership?.plan === 'complete' && <Card><Text style={styles.heading}>Votre accompagnateur</Text><Body>Posez vos questions sur les cours via WhatsApp. La réponse dépend de la disponibilité de votre accompagnateur.</Body><Button title="Contacter mon accompagnateur" disabled={action.busy} onPress={() => action.run(async () => { const result = await api<{ url: string }>('/support'); await Linking.openURL(result.url); })} /></Card>}
    <Text style={styles.heading}>Historique des paiements</Text>
    {!me?.payments.length && <Body>Aucun paiement déclaré.</Body>}
    {me?.payments.map(p => <Card key={p.id}><Text style={styles.heading}>{planNames[p.plan]} · {p.amount} FCFA</Text><Body>{paymentNames[p.status]} · {dateLabel(p.created)}</Body><Text selectable style={styles.text}>Référence : {p.reference}</Text>{p.reason && <Body>Motif : {p.reason}</Body>}</Card>)}
    {action.feedback}
    <Button secondary title="Me déconnecter" disabled={action.busy} onPress={() => action.run(async () => { await signOut(); router.replace('/login'); })} />
  </Page>;
}
