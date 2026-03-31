// Normalize messages from any channel into a standard format

export interface NormalizedMessage {
  user: string;
  message: string;
  channel: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export function normalizeFromTelegram(update: Record<string, unknown>): NormalizedMessage | null {
  const message = update.message as Record<string, unknown> | undefined;
  if (!message) return null;

  const from = message.from as Record<string, unknown> | undefined;
  const text = message.text as string | undefined;
  if (!text) return null;

  return {
    user: String(from?.id || 'unknown'),
    message: text,
    channel: 'telegram',
    timestamp: (message.date as number) * 1000,
    metadata: {
      firstName: from?.first_name,
      lastName: from?.last_name,
      username: from?.username,
      chatId: message.chat && (message.chat as Record<string, unknown>).id,
      messageId: message.message_id,
    },
  };
}

export function normalizeFromDiscord(interaction: Record<string, unknown>): NormalizedMessage | null {
  const data = interaction.data as Record<string, unknown> | undefined;
  if (!data) return null;

  const user = interaction.member?.user || interaction.user;
  const content = data.content || data.options?.[0]?.value || '';

  if (!content) return null;

  return {
    user: String(user?.id || 'unknown'),
    message: String(content),
    channel: 'discord',
    timestamp: Date.now(),
    metadata: {
      username: user?.username,
      guildId: interaction.guild_id,
      channelId: interaction.channel_id,
      interactionId: interaction.id,
    },
  };
}

export function normalizeFromWhatsApp(body: Record<string, unknown>): NormalizedMessage | null {
  const entry = (body.entry as Array<Record<string, unknown>>)?.[0];
  const change = (entry?.changes as Array<Record<string, unknown>>)?.[0];
  const value = change?.value as Record<string, unknown> | undefined;
  const messages = value?.messages as Array<Record<string, unknown>> | undefined;
  const msg = messages?.[0];

  if (!msg) return null;

  const text = msg.text?.body || '';

  return {
    user: String(msg.from || 'unknown'),
    message: text,
    channel: 'whatsapp',
    timestamp: Number(msg.timestamp) * 1000,
    metadata: {
      phoneNumber: msg.from,
      messageId: msg.id,
      profileName: value?.contacts?.[0]?.profile?.name,
    },
  };
}

export function normalizeMessage(
  raw: Record<string, unknown>,
  channel: string
): NormalizedMessage | null {
  switch (channel) {
    case 'telegram':
      return normalizeFromTelegram(raw);
    case 'discord':
      return normalizeFromDiscord(raw);
    case 'whatsapp':
      return normalizeFromWhatsApp(raw);
    default:
      return {
        user: String(raw.user || 'unknown'),
        message: String(raw.message || raw.text || ''),
        channel,
        timestamp: Number(raw.timestamp) || Date.now(),
        metadata: raw.metadata as Record<string, unknown> | undefined,
      };
  }
}
