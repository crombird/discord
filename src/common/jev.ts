import { noul, TypeSafeClient, type NoulQuestion } from "@typesafe-ai/sdk";

import type { TypesenseSearchResponse } from "./typesense";

// Pinned rather than "jev-latest", which is an alias that can change behavior without a code change.
const JEV_MODEL = "jev-1.13.0";

export interface RerankedHit {
  hit: TypesenseSearchResponse["hits"][number];
  score: number;
}

function makeRerankerQuestion(index: number): NoulQuestion {
  // Each candidate is scored with a single noul used as the "confidence" score for
  // the match. This is already starting to get a little bloated; TypeSafe recommends
  // asking smaller narrower questions and combining the resulting vectors at the
  // application level. For now, this is fine; we want the ambiguity and "intelligence"
  // of a language model to determine what a "best" match is for a query. But any bigger
  // than this and we should start splitting.
  // See https://docs.typesafe.ai/concepts/how-to-build-with-system-one
  const candidate = `candidates[${index}]`;
  return noul(
    {
      question: `Is \`${candidate}\` the page the user is looking for with \`query\`?`,
      compare: ["`query`", `\`${candidate}.title\``, `\`${candidate}.alternateTitle\``],
      focus:
        "The query may be a partial title, a misspelling, an abbreviation, or a paraphrase " +
        "or synonym of the title or alternate title.",
      supportingEvidence:
        `\`${candidate}.path\`, \`authors\`, \`tags\`, and \`contentSnippet\` (body text ` +
        "where the query matched) can confirm a title match or tell similar pages apart, but " +
        "are not enough on their own.",
      tieBreak: {
        when: "Several candidates' titles or alternate titles match the query about equally well.",
        prefer: [
          "The one where the query phrase appears earliest in the title.",
          "The one that looks like the start of a series of pages, such as a first part or a " +
            "hub, over its later parts.",
        ],
      },
    },
    {
      true: {
        what: "The query names this page through its title or alternate title.",
      },
      false: {
        what:
          "The page is only on the query's topic, matches only in its body text, or is a " +
          "similarly named sibling of a better candidate.",
      },
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
