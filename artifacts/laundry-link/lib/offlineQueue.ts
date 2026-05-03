import AsyncStorage from "@react-native-async-storage/async-storage";
import { CreateOrderInput } from "@/types";

const QUEUE_KEY = "ll_offline_queue_v1";

export interface QueuedOrder {
  id: string;
  input: CreateOrderInput;
  queuedAt: string;
  attempts: number;
}

export async function enqueueOrder(input: CreateOrderInput): Promise<string> {
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item: QueuedOrder = { id, input, queuedAt: new Date().toISOString(), attempts: 0 };
  const existing = await getQueue();
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...existing, item]));
  return id;
}

export async function getQueue(): Promise<QueuedOrder[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function removeFromQueue(id: string): Promise<void> {
  const existing = await getQueue();
  const updated = existing.filter((q) => q.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function incrementAttempts(id: string): Promise<void> {
  const existing = await getQueue();
  const updated = existing.map((q) => q.id === id ? { ...q, attempts: q.attempts + 1 } : q);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export async function getQueueLength(): Promise<number> {
  const q = await getQueue();
  return q.length;
}
