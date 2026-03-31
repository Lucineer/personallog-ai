// Agent-to-Agent (A2A) protocol — peer discovery, messaging, capability exchange
// Enables agents to talk to each other across the network

export interface PeerAgent {
  name: string;
  url: string;
  capabilities: string[];
  publicKey?: string;
  discovered: number;
  lastSeen: number;
}

export interface A2AMessage {
  from: string;
  to: string;
  content: string;
  type: 'chat' | 'discovery' | 'capability_query' | 'task';
  timestamp: number;
  signature?: string;
}

export class A2AProtocol {
  private kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  // ===== Peer Management =====
  async registerPeer(peer: { name: string; url: string; capabilities?: string[] }): Promise<void> {
    const existing = await this.getPeer(peer.name);
    const entry: PeerAgent = {
      name: peer.name,
      url: peer.url,
      capabilities: peer.capabilities || [],
      discovered: existing?.discovered || Date.now(),
      lastSeen: Date.now(),
    };

    await this.kv.put(`peer:${peer.name}`, JSON.stringify(entry));
  }

  async getPeer(name: string): Promise<PeerAgent | null> {
    const raw = await this.kv.get(`peer:${name}`);
    if (!raw) return null;
    return JSON.parse(raw) as PeerAgent;
  }

  async getPeers(): Promise<PeerAgent[]> {
    const list = await this.kv.list({ prefix: 'peer:' });
    const peers: PeerAgent[] = [];

    for (const item of list.keys) {
      const raw = await this.kv.get(item.name, 'json') as PeerAgent | null;
      if (raw) peers.push(raw);
    }

    return peers;
  }

  async removePeer(name: string): Promise<void> {
    await this.kv.delete(`peer:${name}`);
  }

  // ===== Messaging =====
  async sendMessage(targetUrl: string, message: A2AMessage): Promise<Response> {
    return await fetch(`${targetUrl}/api/a2a/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  }

  async discover(targetUrl: string, selfInfo: { name: string; url: string; capabilities: string[] }): Promise<PeerAgent | null> {
    try {
      const res = await fetch(`${targetUrl}/api/a2a/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selfInfo),
      });

      if (!res.ok) return null;

      // Register the target as a peer
      const peer: PeerAgent = {
        name: selfInfo.name,
        url: targetUrl,
        capabilities: selfInfo.capabilities,
        discovered: Date.now(),
        lastSeen: Date.now(),
      };

      return peer;
    } catch {
      return null;
    }
  }

  // ===== Capability Query =====
  async queryCapabilities(peerName: string): Promise<string[] | null> {
    const peer = await this.getPeer(peerName);
    if (!peer) return null;

    try {
      const res = await fetch(`${peer.url}/api/status`);
      if (!res.ok) return null;

      const data = await res.json() as { channels?: Record<string, boolean> };
      const capabilities: string[] = ['chat'];

      if (data.channels) {
        for (const [channel, enabled] of Object.entries(data.channels)) {
          if (enabled) capabilities.push(`channel:${channel}`);
        }
      }

      return capabilities;
    } catch {
      return peer.capabilities;
    }
  }

  // ===== Broadcast =====
  async broadcast(message: Omit<A2AMessage, 'to' | 'timestamp'>): Promise<Array<{ peer: string; success: boolean }>> {
    const peers = await this.getPeers();
    const results: Array<{ peer: string; success: boolean }> = [];

    for (const peer of peers) {
      try {
        const fullMessage: A2AMessage = {
          ...message,
          to: peer.name,
          timestamp: Date.now(),
        };

        const res = await this.sendMessage(peer.url, fullMessage);
        results.push({ peer: peer.name, success: res.ok });
      } catch {
        results.push({ peer: peer.name, success: false });
      }
    }

    return results;
  }
}
