import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import { Page, Body, Card, Button, Field, styles, useAction } from '../components/ui';
import { useSession } from '../lib/session';
import { api } from '../lib/api';
import { Prompts } from '../lib/types';
export default function PromptPage() {
  const { me } = useSession(); const action = useAction(); const request = useRef<{ key: string; input: string } | null>(null);
  const [data, setData] = useState<Prompts | null>(null), [subject, setSubject] = useState(''), [style, setStyle] = useState('Photo réaliste'), [format, setFormat] = useState('Carré'), [result, setResult] = useState('');
  const load = async () => setData(await api<Prompts>('/prompts'));
  useEffect(() => { if (me?.membership) action.run(load); }, [me?.membership?.plan]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Page title="Des prompts à mettre en pratique">
    <Body>Un prompt est une demande que vous pouvez copier et adapter dans ChatGPT.</Body>
    {!me?.membership && <Body>Activez votre abonnement pour découvrir vos prompts.</Body>}
    {me?.membership && <Button secondary title="Actualiser les prompts et mon quota" disabled={action.busy} onPress={() => action.run(load)} />}
    {data && <><Text style={styles.heading}>Vos exemples {me?.membership?.plan === 'complete' ? 'disponibles' : 'du jour'}</Text><Body>Les exemples peuvent être consultés plusieurs fois. La sélection et le quota se renouvellent à minuit, heure du Cameroun.</Body>
      {data.examples.map((text, index) => <Card key={text}><Text style={styles.muted}>EXEMPLE {index + 1}</Text><Text selectable style={styles.text}>{text}</Text></Card>)}
      {data.imageAccess && <Card><Text style={styles.heading}>Créer mon prompt pour une image</Text><Body>{data.remaining === null ? 'Accès complet aux prompts image.' : `${data.remaining} création(s) restante(s) aujourd’hui.`}</Body><Body>Ce formulaire assemble un prompt à partir de vos choix. Il ne génère pas d’image et ne consulte pas une IA.</Body>
        <Field label="Sujet et détails importants" multiline maxLength={500} value={subject} onChangeText={setSubject} />
        <Field label="Style visuel" maxLength={120} value={style} onChangeText={setStyle} />
        <Field label="Format souhaité" maxLength={80} value={format} onChangeText={setFormat} />
        <Button title="Préparer mon prompt" disabled={action.busy || data.remaining === 0 || subject.trim().length < 3} onPress={() => action.run(async () => {
          const input = JSON.stringify({ subject, style, format });
          if (!request.current || request.current.input !== input) request.current = { key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, input };
          const response = await api<{ prompt: string }>('/prompts/image', 'POST', { subject, style, format, requestKey: request.current.key });
          setResult(response.prompt); request.current = null; await load();
        })} />
        {!!result && <Text selectable style={styles.text}>{result}</Text>}
      </Card>}
      {!!data.history.length && <Text style={styles.heading}>Mes prompts image du jour</Text>}
      {data.history.map(item => <Card key={item.id}><Text selectable style={styles.text}>{item.prompt}</Text></Card>)}
    </>}
    {action.feedback}
  </Page>;
}
