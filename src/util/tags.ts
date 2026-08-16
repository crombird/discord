const ADULT_TAGS = ["_adult", "_người-lớn"];

const ARTWORK_TAGS = ["artwork", "hội-họa"];

export function isAdultTag(tag: string): boolean {
  return ADULT_TAGS.includes(tag);
}

export function isArtworkTag(tag: string): boolean {
  return ARTWORK_TAGS.includes(tag);
}
