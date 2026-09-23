import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SessionProvider } from '../lib/session';
export default function Layout() {
  return <SafeAreaProvider><SessionProvider><StatusBar style="dark" /><Stack screenOptions={{ headerStyle: { backgroundColor: '#F7F7F0' }, headerTintColor: '#193D37', headerTitle: 'LearnAI' }} /></SessionProvider></SafeAreaProvider>;
}
