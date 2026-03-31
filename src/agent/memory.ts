// KV-backed memory — persistent facts, conversation history, and context
// Two-tier: hot (recent messages) and cold (facts, long-term)

export interface MemoryEntry {
  key: string;
  value: string;
  confidence: number;
  source: string;
  timestamp: number;
}

export interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
  channel: string;
  timestamp: number;
}

const MAX_HISTORY = 100;

export class Memory {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  // ===== Facts =====
  async getFact(key: string): Promise<string | null> {
    return this.kv.get(`fact:${key}`);
  }

  async setFact(key: string, value: string, source = 'explicit'): Promise<void> {
    const entry: MemoryEntry = {
      key,
      value,
      confidence: source === 'explicit' ? 1.0 : 0.7,
      source,
      timestamp: Date.now(),
    };
    await this.kv.put(`fact:${key}`, JSON.stringify(entry));
  }

  async deleteFact(key: string): Promise<void> {
    await this.kv.delete(`fact:${key}`);
  }

  async getAllFacts(): Promise<Record<string, string>> {
    const list = await this.kv.list({ prefix: 'fact:' });
    const facts: Record<string, string> = {};

    for (const item of list.keys) {
      const raw = await this.kv.get(item.name, 'json') as MemoryEntry | null;
      if (raw) {
        const key = item.name.slice('fact:'.length);
        facts[key] = raw.value;
      }
    }

    return facts;
  }

  // ===== Chat History =====
  async getHistory(user: string): Promise<ChatHistoryEntry[]> {
    const raw = await this.kv.get(`history:${user}`);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ChatHistoryEntry[];
    } catch {
      return [];
    }
  }

  async addMessage(
    user: string,
    role: 'user' | 'assistant',
    content: string,
    channel: string
  ): Promise<void> {
    const history = await this.getHistory(user);
    history.push({ role, content, channel, timestamp: Date.now() });

    // Trim to max
    const trimmed = history.slice(-MAX_HISTORY);
    await this.kv.put(`history:${user}`, JSON.stringify(trimmed));
  }

  // ===== Information Extraction =====
  async extractAndStore(userMessage: string, agentResponse: string): Promise<void> {
    // Simple extraction: look for stated preferences, facts, and commitments
    const patterns: Array<{ regex: RegExp; type: string }> = [
      { regex: /(?:my name is|i'm called|call me)\s+(\w+)/i, type: 'name' },
      { regex: /(?:i (?:work|am working) (?:at|for|on|with))\s+(.+?)(?:\.|,|$)/i, type: 'work' },
      { regex: /(?:i (?:live|am living|stay) in)\s+(.+?)(?:\.|,|$)/i, type: 'location' },
      { regex: /(?:my (?:favorite|fav) (\w+) is)\s+(.+?)(?:\.|,|$)/i, type: 'preference' },
      { regex: /(?:i'm learning|i am learning|i want to learn)\s+(.+?)(?:\.|,|$)/i, type: 'learning' },
    ];

    for (const { regex, type } of patterns) {
      const match = userMessage.match(regex);
      if (match) {
        const value = match[1] || match[0];
        await this.setFact(type, value.trim(), 'extracted');
      }
    }
  }

  // ===== Search =====
  async search(query: string): Promise<Array<{ key: string; value: string; score: number }>> {
    const facts = await this.getAllFacts();
    const terms = query.toLowerCase().split(/\s+/);
    const results: Array<{ key: string; value: string; score: number }> = [];

    for (const [key, value] of Object.entries(facts)) {
      const combined = `${key} ${value}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (combined.includes(term)) score += 1;
      }
      if (score > 0) {
        results.push({ key, value, score });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  // ===== Stats =====
  async count(): Promise<number> {
    const list = await this.kv.list({ prefix: 'fact:' });
    return list.keys.length;
  }
}
