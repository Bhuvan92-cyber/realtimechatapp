import type { User, Message } from '@/types/chat';

// Backend URL.
// EXPO_PUBLIC_API_BASE can override this value in your environment.
const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ??
  'https://realtimechatapp-e08b.onrender.com';

console.log('EXPO_PUBLIC_API_BASE =', process.env.EXPO_PUBLIC_API_BASE);
console.log('API_BASE =', API_BASE);

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;

    try {
      const body = await res.json();

      if (body?.error) {
        detail = body.error;
      }
    } catch {
      // Response had no JSON body.
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });

    const data = await parseJson<{ user: User }>(res);

    return data.user;
  },

  async fetchMessages(limit = 100): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/api/messages?limit=${limit}`);

    const data = await parseJson<{ messages?: Message[] }>(res);

    console.log('GET /api/messages response:', data);
    console.log(
      'GET /api/messages messages:',
      data?.messages,
    );
    console.log(
      'Is messages an array?',
      Array.isArray(data?.messages),
    );

    // Always return an array so ChatScreen can safely use
    // messages.forEach(...)
    return Array.isArray(data?.messages)
      ? data.messages
      : [];
  },

  async listUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/api/users`);

    const data = await parseJson<{ users?: User[] }>(res);

    return Array.isArray(data?.users)
      ? data.users
      : [];
  },
};

