import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Substitua pelas suas credenciais do Supabase Dashboard
const supabaseUrl = 'https://cemjvvppfxiaqycyflbk.supabase.co';
const supabaseAnonKey = 'sb_publishable_v3cjTDnk_mWOI2dW7nchMQ_n9SDMG27';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
