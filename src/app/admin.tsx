import React, { useEffect, useState } from 'react';
import { Text, Switch, View } from 'react-native';
import { Page, Body, Card, Field, Button, styles, useAction } from '../components/ui';
import { api } from '../lib/api';
import { Payment, paymentNames, planNames, dateLabel } from '../lib/types';
import { useSession } from '../lib/session';
function Review({ payment: p, onChange }: { payment: Payment; onChange: () => Promise<void> }) {
  const action = useAction(); const [reference, setReference] = useState(''), [amount, setAmount] = useState(''), [confirmed, setConfirmed] = useState(false), [reason, setReason] = useState('');
  return <Card><Text style={styles.heading}>{p.name} · {planNames[p.plan]}</Text><Body>{p.email}</Body><Body>{p.amount} FCFA · {dateLabel(p.created)} · {paymentNames[p.status]}</Body>
    <Text selectable style={styles.text}>Référence déclarée : {p.reference}{'\n'}Numéro payeur : {p.phone}</Text>
    {p.status === 'pending' && <><Body>Vérifiez la réception réelle, le montant, la référence et le payeur dans votre historique Orange Money. Recopiez les détails du reçu marchand ci-dessous.</Body>
      <Field label="Référence retrouvée dans Orange Money" value={reference} onChangeText={setReference} autoCapitalize="characters" maxLength={80} />
      <Field label="Montant reçu en FCFA" value={amount} onChangeText={setAmount} keyboardType="number-pad" maxLength={8} />
      <View style={styles.row}><Switch accessibilityLabel="Paiement reçu et payeur vérifié dans Orange Money" value={confirmed} onValueChange={setConfirmed} /><Body>Paiement reçu et payeur vérifié.</Body></View>
      <Button title="Valider et activer l’abonnement" disabled={action.busy || !confirmed || !reference || !amount} onPress={() => action.run(async () => {
        await api(`/admin/payments/${p.id}/approve`, 'POST', { verifiedReference: reference, verifiedAmount: Number(amount), confirmed }); await onChange();
      })} />
    </>}
    {(p.status === 'pending' || p.status === 'approved') && <><Field label={p.status === 'approved' ? 'Motif de révocation de l’accès' : 'Motif du refus'} multiline maxLength={500} value={reason} onChangeText={setReason} />
      <Button secondary title={p.status === 'approved' ? 'Révoquer l’accès associé à ce paiement' : 'Refuser ce paiement'} disabled={action.busy || reason.trim().length < 5} onPress={() => action.run(async () => {
        await api(`/admin/payments/${p.id}/${p.status === 'approved' ? 'revoke' : 'reject'}`, 'POST', { reason }); await onChange();
      })} />{p.status === 'approved' && <Body>La révocation retire l’accès correspondant. Elle ne rembourse pas automatiquement le paiement Orange Money.</Body>}</>}
    {p.reason && <Body>Motif enregistré : {p.reason}</Body>}{action.feedback}
  </Card>;
}
export default function Admin() {
  const { me, refresh } = useSession(); const action = useAction(); const [payments, setPayments] = useState<Payment[]>([]);
  const load = async () => { const response = await api<{ payments: Payment[] }>('/admin/payments'); setPayments(response.payments); await refresh(); };
  useEffect(() => { if (me?.user.role === 'admin') action.run(load); }, [me?.user.role]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Page title="Vérification des paiements">
    {me?.user.role !== 'admin' ? <Body>Cette page est réservée à l’administrateur.</Body> : <>
      <Body>Les accès sont activés uniquement après votre vérification dans Orange Money. Les décisions sont enregistrées dans le journal du serveur.</Body>
      <Button title="Actualiser les demandes" disabled={action.busy} onPress={() => action.run(load)} />
      {payments.length === 0 && <Body>Aucun paiement à afficher.</Body>}
      {payments.map(p => <Review key={`${p.id}-${p.status}`} payment={p} onChange={load} />)}
    </>}{action.feedback}
  </Page>;
}
