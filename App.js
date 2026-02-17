import React, { useState, useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './lib/supabase';
import LoginScreen from './screens/LoginScreen';
import AppNavigator from './navigation/AppNavigator';

import ResponsiveContainer from './components/ResponsiveContainer';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch((err) => {
        console.error('Supabase session error:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#121212' }}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" animated={true} />
        <ResponsiveContainer style={{ backgroundColor: '#121212' }}>
          {!session ? <LoginScreen /> : <AppNavigator />}
        </ResponsiveContainer>
      </View>
    </SafeAreaProvider>
  );
}
