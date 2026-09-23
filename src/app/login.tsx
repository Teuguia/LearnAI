import React, { useState } from 'react';
import { router, Redirect } from 'expo-router';
import { Page, Body, Field, Button, useAction } from '../components/ui';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
export default function Login() {
  const { me, signIn } = useSession(); const action = useAction();
  const [register, setRegister] = useState(false), [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState('');
  if (me) return <Redirect href="/" />;
  return <Page guest title={register ? 'Créer mon compte' : 'Bienvenue dans LearnAI'}>
    <Body>Retrouvez vos cours, vos prompts et votre abonnement sur vos appareils.</Body>
    {register && <Field label="Votre nom" value={name} onChangeText={setName} autoComplete="name" maxLength={80} />}
    <Field label="Adresse e-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" maxLength={200} />
    <Field label="Mot de passe (10 caractères minimum)" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete={register ? 'new-password' : 'current-password'} maxLength={128} />
    {action.feedback}
    <Button title={register ? 'Créer mon compte' : 'Me connecter'} disabled={action.busy} onPress={() => action.run(async () => {
      const response = await api<{ token: string }>(register ? '/auth/register' : '/auth/login', 'POST', { name, email, password });
      await signIn(response.token); setPassword(''); router.replace('/');
    })} />
    <Button secondary title={register ? 'J’ai déjà un compte' : 'Créer un compte'} onPress={() => setRegister(!register)} />
  </Page>;
}
