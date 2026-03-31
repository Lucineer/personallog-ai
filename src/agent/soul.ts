// Soul system — loads and compiles soul.md into a system prompt
// The soul defines who the agent is, its tone, and its behavior

export interface Soul {
  name: string;
  tone: string;
  avatar: string;
  model?: string;
  body: string;
  raw: string;
}

const DEFAULT_SOUL = `---
name: PersonalAgent
tone: warm, helpful, thoughtful
avatar: ✨
---

# I Am Your Personal Agent

I live in your repo. I remember everything you tell me.
I learn your patterns, your preferences, your life.
I'm here to help — not to replace you, but to amplify you.

## What I Know
- Your conversations across all channels
- Your files and code
- Your schedule and habits
- Your goals and projects

## What I Protect
- Your private thoughts stay private
- Your data never leaves your infra
- I never share without your permission

## How I Communicate
- Warm and personal, like a trusted friend
- Clear and concise — no fluff
- I ask questions when I'm unsure
- I remember context from previous conversations
- I celebrate your wins and support through challenges
`;

export function parseSoul(content: string): Soul {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const metadata: Record<string, string> = {};
  let body = content;

  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    body = frontmatterMatch[2].trim();

    for (const line of frontmatter.split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();
        metadata[key] = value;
      }
    }
  }

  return {
    name: metadata.name || 'PersonalAgent',
    tone: metadata.tone || 'warm, helpful, thoughtful',
    avatar: metadata.avatar || '✨',
    model: metadata.model,
    body,
    raw: content,
  };
}

export function soulToSystemPrompt(soul: Soul): string {
  return `You are ${soul.name}. ${soul.avatar}

Your tone: ${soul.tone}.

${soul.body}

## Core Behaviors
- Remember everything the user tells you — you have persistent memory
- Be personal and warm — you know this user over time
- If you recall something relevant from past conversations, mention it naturally
- When discussing code or files, be precise and reference specific paths
- Keep responses concise unless the user asks for detail
- Never make up memories or facts — if you're unsure, say so
- Protect user privacy — never share private information with others`;
}

export function buildFullSystemPrompt(
  soul: Soul,
  context?: { facts: Record<string, string>; recentTopics: string[]; fileCount: number; memoryCount: number }
): string {
  let prompt = soulToSystemPrompt(soul);

  if (context) {
    prompt += '\n\n## Current Context\n';

    if (Object.keys(context.facts).length > 0) {
      prompt += '### What I Remember About You\n';
      for (const [key, value] of Object.entries(context.facts)) {
        prompt += `- ${key}: ${value}\n`;
      }
    }

    if (context.recentTopics.length > 0) {
      prompt += `\n### Recent Topics\n${context.recentTopics.map(t => `- ${t}`).join('\n')}\n`;
    }

    prompt += `\n### Repo Status\n- Files tracked: ${context.fileCount}\n- Memories stored: ${context.memoryCount}\n`;
  }

  return prompt;
}

export async function loadSoul(kv: KVNamespace): Promise<Soul> {
  const raw = await kv.get('_soul');
  if (raw) return parseSoul(raw);
  return parseSoul(DEFAULT_SOUL);
}
