import { Type, type Static } from "typebox";
import * as Value from "typebox/value";

const TypesensePagesDocument = Type.Object(
  {
    url: Type.String(),
    title: Type.Optional(Type.String()),
    alternateTitle: Type.Optional(Type.String()),
    tags: Type.Array(Type.String()),
    rating: Type.Number(),
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

interface TypesenseRequestParams {
  query: string;
  page: number;
  siteUrl: string;

  includeTextContent?: boolean;
  highlightFields?: boolean;
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
  }: TypesenseRequestParams): Promise<Static<typeof TypesenseSearchResponse>> {
    const fetchUrl = new URL(`collections/pages/documents/search`, this.#apiEndpoint);
    fetchUrl.search = new URLSearchParams({
      q: query,
      query_by: `publicTitle,alternateTitle${includeTextContent ? ",textContent" : ""},titleEmbedding`,
      page: `${page}`,
      per_page: "5",
      include_fields: "url,title,alternateTitle,rating,tags",
      filter_by: `origin:${siteUrl}`,
      drop_tokens_threshold: "3",
      num_typos: "1",
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
    });
    if (!response.ok) {
      throw new Error(`Error while contacting Typesense: HTTP ${response.status}`);
    }
    return Value.Parse(TypesenseSearchResponse, await response.json());
  }
}
