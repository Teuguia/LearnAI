import React, { useEffect, useState } from 'react';
import { Text, Pressable } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Page, Body, Card, Field, Button, styles, useAction } from '../../components/ui';
import { LessonVideo } from '../../components/LessonVideo';
import { useSession } from '../../lib/session';
import { API_URL, api } from '../../lib/api';
import { Lesson } from '../../lib/types';
export default function LessonPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LessonContent key={id} id={id} />;
}
function LessonContent({ id }: { id: string }) {
  const { me, refresh } = useSession(); const action = useAction();
  const [lesson, setLesson] = useState<Lesson | null>(null), [draft, setDraft] = useState(''), [answer, setAnswer] = useState<number | null>(null), [uri, setUri] = useState(''), [notice, setNotice] = useState('');
  const progress = me?.progress.find(p => p.lesson_id === id);
  useEffect(() => {
    if (!me) return;
    let mounted = true;
    action.run(async () => { const result = await api<{ lesson: Lesson }>(`/lessons/${encodeURIComponent(id)}`); if (mounted) { setLesson(result.lesson); setDraft(progress?.draft || ''); } });
    return () => { mounted = false; };
  }, [id, me?.user.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = async (data: object) => { await api(`/lessons/${encodeURIComponent(id)}/progress`, 'PUT', data); await refresh(); };
  return <Page title={lesson?.title || 'Votre leçon'}>
    {action.feedback}
    {!lesson && !action.busy && <Button title="Réessayer" onPress={() => action.run(async () => { const result = await api<{ lesson: Lesson }>(`/lessons/${encodeURIComponent(id)}`); setLesson(result.lesson); setDraft(progress?.draft || ''); })} />}
    {lesson && <><Text style={styles.muted}>{lesson.tag} · {lesson.minutes} MIN</Text><Body>{lesson.body}</Body>
      <Card><Text style={styles.heading}>Une demande à essayer</Text><Text selectable style={styles.text}>{lesson.example}</Text></Card>
      <Button secondary title={progress?.favorite ? 'Retirer des favoris' : 'Garder dans mes favoris'} disabled={action.busy} onPress={() => action.run(() => save({ favorite: !progress?.favorite }))} />
      {me?.membership?.plan === 'complete' && lesson.video && <Card><Text style={styles.heading}>Version vidéo</Text>
        <Body>Retrouvez cette leçon en vidéo.</Body>
        <Button title={uri ? 'Recharger le lien vidéo' : 'Charger la vidéo'} disabled={action.busy} onPress={() => action.run(async () => { const result = await api<{ path: string }>(`/lessons/${id}/video-ticket`, 'POST', {}); setUri(`${API_URL}${result.path}`); })} />
        {!!uri && <LessonVideo key={uri} uri={uri} />}
      </Card>}
      <Text style={styles.heading}>À vous de jouer</Text><Body>{lesson.challenge}</Body>
      <Field label="Mon brouillon de prompt" multiline maxLength={4000} value={draft} onChangeText={setDraft} />
      <Body>Ce brouillon est enregistré dans votre compte lorsque vous appuyez sur Enregistrer. Utilisez des données fictives ; il n’est pas envoyé à une IA.</Body>
      <Button secondary title="Enregistrer mon brouillon" disabled={action.busy} onPress={() => action.run(async () => { await save({ draft }); setNotice('Brouillon enregistré.'); })} />
      <Text style={styles.heading}>Vérifiez votre compréhension</Text><Body>{lesson.question}</Body>
      {lesson.options.map((option, i) => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: answer === i }} onPress={() => setAnswer(i)} style={[styles.card, answer === i && { backgroundColor: '#E4EEDD', borderColor: '#193D37' }]}><Body>{option}</Body></Pressable>)}
      {answer !== null && <Body>{answer === lesson.answer ? lesson.explanation : 'Relisez la leçon et essayez une autre réponse.'}</Body>}
      <Button title={progress?.completed ? 'Leçon validée · Réviser' : 'Valider cette leçon'} disabled={action.busy || answer !== lesson.answer} onPress={() => action.run(async () => { await save({ answer, draft }); setNotice('Leçon validée. Votre progression est enregistrée.'); })} />
      {!!notice && <Text accessibilityLiveRegion="polite" style={styles.text}>{notice}</Text>}
    </>}
  </Page>;
}
