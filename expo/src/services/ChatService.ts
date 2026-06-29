/**
 * Minimal chat API client. Talks to the ASP.NET backend REST endpoints
 * (`/api/rooms/{room}/messages`). No SignalR — just fetch on demand.
 */

export interface ChatMessageDto {
  id: string;
  roomId: number;
  username: string;
  content: string;
  timestamp: string;
}

export interface SendMessageDto {
  id: string;
  username: string;
  content: string;
}

// Test backend. Override here when pointing at a different environment.
export const API_BASE = 'https://vibezen.rueberg.eu';

export async function getMessages(room: string): Promise<ChatMessageDto[]> {
  const res = await fetch(`${API_BASE}/api/rooms/${room}/messages`);
  if (!res.ok) throw new Error(`getMessages failed: ${res.status}`);
  return res.json();
}

export async function sendMessage(
  room: string,
  body: SendMessageDto,
): Promise<ChatMessageDto> {
  const res = await fetch(`${API_BASE}/api/rooms/${room}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`sendMessage failed: ${res.status}`);
  return res.json();
}
