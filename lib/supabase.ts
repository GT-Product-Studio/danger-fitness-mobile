import "react-native-url-polyfill/dist/polyfill";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

// Secure storage adapter for Supabase auth tokens
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = "https://tmziujmbhxgivgsecyrv.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRteml1am1iaHhnaXZnc2VjeXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjkxMjcsImV4cCI6MjA4ODQwNTEyN30.y6DI79Xn1Zrl4PSSOPu22AjaREPN6b7NsE7jTcLibnA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
