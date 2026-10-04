import * as SecureStore from 'expo-secure-store';

// Auth sessions only; never persist PINs or evidence through this adapter.
// Surface native size/storage errors. Test real JWT payload sizes before connecting
// auth; large sessions may need a reviewed encrypted adapter.
export const sessionStorage = {
  async getItem(key: string) { return SecureStore.getItemAsync(key); },
  async setItem(key: string, value: string) { await SecureStore.setItemAsync(key, value); },
  async removeItem(key: string) { await SecureStore.deleteItemAsync(key); },
};
