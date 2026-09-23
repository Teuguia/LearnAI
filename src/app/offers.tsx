import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Link } from 'expo-router';
import { Page, Body, Card, Field, Button, styles, useAction } from '../components/ui';
import { api, manualChannel } from '../lib/api';
import { Catalog, PlanId, planNames } from '../lib/types';
import { useSession } from '../lib/session';
export default function Offers() {
  const { me, refresh } = useSession(); const action = useAction();
  const [catalog, setCatalog] = useState<Catalog | null>(null), [selected, setSelected] = useState<PlanId | null>(null), [reference, setReference] = useState(''), [phone, setPhone] = useState(''), [sent, setSent] = useState(false);
  useEffect(() => { action.run(async () => setCatalog(await api<Catalog>('/catalog'))); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pending = me?.payments.some(p => p.status === 'pending');
  const enabled = manualChannel && catalog?.manualPayments;
  return <Page title="Choisir mon abonnement">
    <Body>Un mois calendaire d’accès à partir de la validation. Renouvellement manuel, sans prélèvement automatique.</Body>
    {catalog?.plans.map(plan => <Card key={plan.id}><Text style={styles.heading}>{plan.name} · {plan.price.toLocaleString('fr-FR')} FCFA/mois</Text><Body>{plan.description}</Body>
      {enabled && <Button title={selected === plan.id ? 'Offre sélectionnée' : me?.membership?.plan === plan.id ? 'Renouveler cette offre' : 'Choisir cette offre'} disabled={action.busy || pending || (!!me?.membership && me.membership.plan !== plan.id)} onPress={() => { setSelected(plan.id); setSent(false); }} />}
    </Card>)}
    {!catalog && !action.busy && <Button title="Recharger les offres" onPress={() => action.run(async () => setCatalog(await api<Catalog>('/catalog')))} />}
    {!enabled && catalog && <Body>Les achats ne sont pas disponibles dans cette version. Vous pouvez consulter les cours inclus dans votre abonnement actif.</Body>}
    {!!me?.membership && <Body>Un renouvellement de la même offre prolonge votre accès d’un mois. Le changement d’offre sera disponible à l’expiration.</Body>}
    {pending && <Card><Body>Votre paiement est en cours de vérification. Attendez la décision avant d’effectuer un autre paiement.</Body><Link href="/account" style={styles.link}>Voir le suivi</Link></Card>}
    {selected && enabled && !pending && !sent && <Card><Text style={styles.heading}>Paiement Orange Money · {planNames[selected]}</Text>
      <Text selectable style={styles.text}>Compte marchand : {catalog?.merchant}</Text>
      <Body>Montant exact : {catalog?.plans.find(p => p.id === selected)?.price} FCFA. Vérifiez le bénéficiaire dans Orange Money avant de confirmer. Après le paiement, renseignez la référence de votre reçu et le numéro utilisé.</Body>
      <Field label="Numéro Orange Money du payeur" keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={16} />
      <Field label="Référence de transaction Orange Money" autoCapitalize="characters" value={reference} onChangeText={setReference} maxLength={80} />
      <Body>Votre accès sera activé après vérification de la transaction dans l’historique marchand. Aucun code PIN ne vous sera demandé ici.</Body>
      <Button title="Déclarer mon paiement" disabled={action.busy || !reference || !phone} onPress={() => action.run(async () => {
        await api('/payments', 'POST', { plan: selected, reference, phone }); setSent(true); await refresh();
      })} />
    </Card>}
    {sent && <Body>Paiement déclaré. Consultez son statut dans Mon compte ; ne payez pas une seconde fois pour cette demande.</Body>}
    {action.feedback}
  </Page>;
}
