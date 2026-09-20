import { Type, type Static } from "typebox";
import * as Value from "typebox/value";

const TypesensePagesDocument = Type.Object(
  {
    url: Type.String(),
    title: Type.Optional(Type.String()),
    alternateTitle: Type.Optional(Type.String()),
    tags: Type.Array(Type.String()),
    rating: Type.Number(),
    attributions: Type.Array(
      Type.Object(
        {
          type: Type.Union([
            Type.Literal("SUBMITTER"),
            Type.Literal("AUTHOR"),
            Type.Literal("REWRITE"),
            Type.Literal("TRANSLATOR"),
          ]),
          user: Type.Object({
            name: Type.String(),
            authorInfos: Type.Array(
              Type.Object({
                authorPage: Type.Object({ url: Type.String() }),
              }),
            ),
          }),
        },
        { additionalProperties: true },
      ),
    ),
  },
  { additionalProperties: true },
);

const TypesenseSearchResponse = Type.Object(
  {
    page: Type.Number(),
    found: Type.Number(),
    out_of: Type.Number(),
    hits: Type.Array(
      Type.Object(
        {
          document: TypesensePagesDocument,
          highlights: Type.Array(
            Type.Object(
              { field: Type.String(), snippet: Type.String() },
              { additionalProperties: true },
            ),
          ),
        },
        { additionalProperties: true },
      ),
    ),
  },
  { additionalProperties: true },
);

export type TypesenseSearchResponse = Static<typeof TypesenseSearchResponse>;

interface TypesenseRequestParams {
  query: string;
  page: number;
  siteUrl: string;
  perPage?: number;
  numTypos?: number;

  includeTextContent?: boolean;
  highlightFields?: boolean;
  boostTitles?: boolean;

  signal?: AbortSignal;
}

export class TypesensePagesClient {
  readonly #apiEndpoint: string;
  readonly #apiKey: string;

  constructor(apiEndpoint: string, apiKey: string) {
    this.#apiEndpoint = apiEndpoint;
    this.#apiKey = apiKey;
  }

  async request({
    query,
    page,
    siteUrl,
    includeTextContent,
    highlightFields,
    perPage = 5,
    numTypos = 1,
    boostTitles = false,
    signal,
  }: TypesenseRequestParams): Promise<TypesenseSearchResponse> {
    const fetchUrl = new URL(`collections/pages/documents/search`, this.#apiEndpoint);
    fetchUrl.search = new URLSearchParams({
      q: query,
      query_by: `publicTitle,alternateTitle${includeTextContent ? ",textContent" : ""},titleEmbedding`,
      ...(boostTitles ? { query_by_weights: `3,3${includeTextContent ? ",1" : ""},2` } : {}),
      page: `${page}`,
      per_page: `${perPage}`,
      include_fields: "url,title,alternateTitle,rating,tags,attributions",
      filter_by: `origin:${siteUrl}`,
      drop_tokens_threshold: "3",
      num_typos: `${numTypos}`,
      highlight_start_tag: "",
      highlight_end_tag: "",
      ...(highlightFields
        ? {
            highlight_fields: "textContent",
            highlight_affix_num_tokens: "2",
            num_typos: "2",
            // Since we're dealing with markdown, the start and end tags can
            // both be replaced with the same character.
            highlight_start_tag: `<bold>`,
            highlight_end_tag: `<bold>`,
          }
        : {}),
    }).toString();

    const response = await fetch(fetchUrl.toString(), {
      headers: { "x-typesense-api-key": this.#apiKey },
      signal,
    });
    if (!response.ok) {
      throw new Error(`Error while contacting Typesense: HTTP ${response.status}`);
    }
    return Value.Parse(TypesenseSearchResponse, await response.json());
  }
}
