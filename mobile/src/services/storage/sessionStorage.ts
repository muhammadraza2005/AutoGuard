// Web previews keep sessions only in memory. Never use localStorage for private data.
const memory = new Map<string, string>();
export const sessionStorage = {
  async getItem(key: string) { return memory.get(key) ?? null; },
  async setItem(key: string, value: string) { memory.set(key, value); },
  async removeItem(key: string) { memory.delete(key); },
};
// Metro selects sessionStorage.native.ts for Android/iOS.

