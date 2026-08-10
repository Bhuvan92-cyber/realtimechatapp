import type { User, Message } from '@/types/chat';

// The backend runs on port 3001. On web, requests go to the same host.
// On native, replace with your machine's LAN IP, e.g. http://192.168.1.5:3001
const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ??
  "https://realtimechatapp-e08b.onrender.com";

console.log("API_BASE =", API_BASE);
async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) detail = body.error;
    } catch {
      // response had no JSON body
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export const api = {
  base: API_BASE,

  async login(username: string): Promise<User> {
    const res = await fetch(`${API_BASE}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const data = await parseJson<{ user: User }>(res);
    return data.user;
  },

  async fetchMessages(limit = 100): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/api/messages?limit=${limit}`);
    const data = await parseJson<{ messages: Message[] }>(res);
    return data.messages;
  },

  async listUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/api/users`);
    const data = await parseJson<{ users: User[] }>(res);
    return data.users;
  },
};
