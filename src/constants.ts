export const DEFAULT_EMBED_COLOR = 11026020;
export const WANDERERS_LIBRARY_EMBED_COLOR = 3379510;
export const BACKROOMS_EMBED_COLOR = 13090644;

export const PATREON_MESSAGE_CHANCE = 0.2;
export const PATREON_MESSAGE = `💌 patreon.com/crombird`;
export const PATREON_SUPPORTER_EMOJI = "<:patreon_crombird:1263617566073552947>";

const CONTEST_TAGS: { tag: string; endsAt: Date }[] = [];
export const ACTIVE_CONTEST_TAGS = CONTEST_TAGS.filter((c) => c.endsAt.getTime() > Date.now());
