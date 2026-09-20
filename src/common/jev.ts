import { noul, TypeSafeClient, type NoulQuestion } from "@typesafe-ai/sdk";

import type { TypesenseSearchResponse } from "./typesense";

// Pinned rather than "jev-latest", which is an alias that can change behavior without a code change.
const JEV_MODEL = "jev-1.13.0";

export interface RerankedHit {
  hit: TypesenseSearchResponse["hits"][number];
  score: number;
}

function makeRerankerQuestion(index: number): NoulQuestion {
  return noul(
    `Is \`candidates[${index}]\` the page the user wants from the search \`query\`? ` +
      `Match primarily on \`title\` and \`alternateTitle\`: the query may be a partial title, a ` +
      `misspelling, an abbreviation, or a paraphrase or synonym of either. \`path\`, \`authors\`, ` +
      `\`tags\`, and \`contentSnippet\` (an excerpt of the page's body where the query matched, ` +
      `if any) are weaker evidence: lean on them to tell similar pages apart and to confirm a ` +
      `title match, but a body-text hit alone is not enough.`,
    {
      true:
        "The query names this page, chiefly through its title or alternate title. The path, " +
        "authors, tags, or body excerpt may reinforce that, or identify the page when the " +
        "query mentions them.",
      false:
        "The candidate is merely related to the query's topic, matches only in its body text, " +
        "shares only an author or tag, or is a sibling with a similar name or number. Another " +
        "page would be a better answer.",
    },
  );
}

export class JevClient {
  readonly #client: TypeSafeClient;

  constructor(apiKey: string) {
    this.#client = new TypeSafeClient({ apiKey, timeout: 1000 });
  }

  /**
   * Reranks the hits of a Typesense search by how likely each one is to be the page the user
   * meant by `query`, best first. Ties keep their Typesense order. Hits with neither a title
   * nor an alternate title are dropped, since there is nothing to judge them by.
   */
  async rerankTypesenseHits(
    query: string,
    { hits }: TypesenseSearchResponse,
    { signal }: { signal?: AbortSignal } = {},
  ): Promise<RerankedHit[]> {
    const candidates = hits.filter(({ document }) => document.title || document.alternateTitle);
    if (candidates.length === 0) return [];

    // One independent Noul question per candidate over shared state, all in a single request.
    const questions: Record<string, NoulQuestion> = {};
    for (let i = 0; i < candidates.length; i++) {
      questions[`c${i}`] = makeRerankerQuestion(i);
    }

    const response = await this.#client.systemOne(
      {
        model: JEV_MODEL,
        state: {
          query,
          candidates: candidates.map((hit) => {
            const snippet = getContentSnippet(hit);
            return {
              title: hit.document.title ?? null,
              alternateTitle: hit.document.alternateTitle ?? null,
              path: new URL(hit.document.url).pathname,
              authors: [...new Set(hit.document.attributions.map(({ user }) => user.name))],
              tags: hit.document.tags,
              ...(snippet ? { contentSnippet: snippet } : {}),
            };
          }),
        },
        questions,
      },
      { signal },
    );

    return candidates
      .map((hit, i) => {
        const answer = response.answers[`c${i}`];
        if (!answer) throw new Error(`Jev response is missing an answer for candidate ${i}`);
        return { hit, score: answer.noul };
      })
      .sort((a, b) => b.score - a.score);
  }
}

/** Extracts the body-text excerpt around where the query matched, without highlight markers. */
function getContentSnippet({ highlights }: TypesenseSearchResponse["hits"][number]) {
  const highlight = highlights.find(({ field }) => field.startsWith("textContent"));
  return (
    highlight?.snippet
      .replace(/<bold>/g, "")
      .replace(/\s+/g, " ")
      .trim() || undefined
  );
}
