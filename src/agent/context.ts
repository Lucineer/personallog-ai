// Context builder — assembles the full context for each agent interaction
// Includes soul, facts, recent topics, file awareness, and conversation state

import { Soul } from './soul.js';
import { Memory } from './memory.js';

export interface AgentContext {
  facts: Record<string, string>;
  recentTopics: string[];
  fileCount: number;
  memoryCount: number;
  uptime: number;
}

const startTime = Date.now();

export async function buildContext(
  kv: KVNamespace,
  soul: Soul,
  history: Array<{ role: string; content: string; timestamp?: number }>,
  currentMessage: string
): Promise<AgentContext> {
  const memory = new Memory(kv);

  // Gather facts
  const facts = await memory.getAllFacts();

  // Extract recent topics from conversation history
  const recentTopics = extractTopics(history);

  // Count files and memories
  const filesList = await kv.list({ prefix: '_file:' });
  const memoryList = await kv.list({ prefix: 'fact:' });

  return {
    facts,
    recentTopics,
    fileCount: filesList.keys.length,
    memoryCount: memoryList.keys.length,
    uptime: Date.now() - startTime,
  };
}

function extractTopics(
  history: Array<{ role: string; content: string }>
): string[] {
  // Simple topic extraction: take keywords from recent user messages
  const topics: string[] = [];
  const userMessages = history
    .filter(m => m.role === 'user')
    .slice(-5);

  const stopWords = new Set([
    'i', 'me', 'my', 'the', 'a', 'an', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'to',
    'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'it',
    'this', 'that', 'and', 'or', 'but', 'not', 'no', 'so', 'if',
    'what', 'how', 'why', 'when', 'where', 'who', 'which', 'its',
  ]);

  for (const msg of userMessages) {
    const words = msg.content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));

    // Take the top 2 most significant words from each message
    const significant = words.slice(0, 2);
    for (const word of significant) {
      if (!topics.includes(word)) {
        topics.push(word);
      }
    }
  }

  return topics.slice(-10);
}

export async function getSystemContext(kv: KVNamespace): Promise<Record<string, unknown>> {
  const memory = new Memory(kv);
  const facts = await memory.getAllFacts();
  const filesList = await kv.list({ prefix: '_file:' });

  return {
    facts,
    fileCount: filesList.keys.length,
    memoryCount: Object.keys(facts).length,
    uptime: Date.now() - startTime,
  };
}
