import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, Redirect } from 'expo-router';
import { useSession } from '../lib/session';
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7F0' }, page: { padding: 22, gap: 18, width: '100%', maxWidth: 760, alignSelf: 'center', paddingBottom: 60 },
  brand: { fontSize: 18, fontWeight: '800', color: '#193D37' }, title: { fontSize: 30, fontWeight: '800', color: '#193D37' },
  heading: { fontSize: 21, fontWeight: '700', color: '#193D37' }, text: { fontSize: 16, lineHeight: 25, color: '#334E47' },
  muted: { fontSize: 13, lineHeight: 20, color: '#5C7067' }, card: { backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#DCE2D7', padding: 20, gap: 12 },
  button: { backgroundColor: '#193D37', padding: 15, minHeight: 48, borderRadius: 12, alignItems: 'center' },
  secondary: { backgroundColor: '#E4EEDD' }, buttonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#8CA398', borderRadius: 12, minHeight: 48, padding: 13, fontSize: 16, color: '#193D37' },
  error: { color: '#842E21', backgroundColor: '#FFEAE3', padding: 14, borderRadius: 12 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  link: { fontSize: 16, color: '#195B46', textDecorationLine: 'underline', paddingVertical: 8 },
});
export const Body = ({ children }: { children: React.ReactNode }) => <Text style={styles.text}>{children}</Text>;
export const Card = ({ children }: { children: React.ReactNode }) => <View style={styles.card}>{children}</View>;
export function Button({ title, onPress, disabled, secondary }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[styles.button, secondary && styles.secondary, disabled && { opacity: 0.5 }]}><Text style={[styles.buttonText, secondary && { color: '#193D37' }]}>{title}</Text></Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 6 }}><Text style={styles.text}>{label}</Text><TextInput {...props} accessibilityLabel={label} style={[styles.input, props.multiline && { minHeight: 100, textAlignVertical: 'top' }]} /></View>;
}
export function Page({ title, children, guest = false }: { title: string; children: React.ReactNode; guest?: boolean }) {
  const { me, ready, error } = useSession();
  if (!ready) return <SafeAreaView style={styles.safe}><ActivityIndicator accessibilityLabel="Chargement" /></SafeAreaView>;
  if (!guest && !me) return <Redirect href="/login" />;
  return <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
    <Text style={styles.brand}>LearnAI · déclic ia.</Text><Text style={styles.title}>{title}</Text>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {children}
    <Text style={styles.muted}>Formation indépendante, non affiliée à OpenAI. L’abonnement LearnAI n’inclut pas un abonnement ChatGPT.</Text>
    <Link href="/" style={styles.link}>Accueil</Link>
  </ScrollView></SafeAreaView>;
}
export function useAction() {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const run = async (fn: () => Promise<void>) => { setBusy(true); setError(''); try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  return { busy, run, error, feedback: <>{busy && <ActivityIndicator accessibilityLabel="Traitement" />}{!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}</> };
}
