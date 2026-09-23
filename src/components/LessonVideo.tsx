import React from 'react';
import { Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { styles } from './ui';
export function LessonVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  const { status, error } = useEvent(player, 'statusChange', { status: player.status });
  return <><VideoView player={player} nativeControls fullscreenOptions={{ enable: true }} style={{ width: '100%', height: 230, borderRadius: 14 }} />
    {status === 'loading' && <Text style={styles.muted}>Chargement de la vidéo…</Text>}
    {error && <Text accessibilityRole="alert" style={styles.error}>Lecture indisponible. Rechargez le lien vidéo et vérifiez votre connexion.</Text>}
  </>;
}
