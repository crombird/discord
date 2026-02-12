import path from "node:path";
import { writeFile } from "node:fs/promises";

import type { GenerateSitesScriptQuery } from "../__generated__/graphql";

const gql = String.raw;
const GENERATE_SITES_SCRIPT_QUERY = gql`
  query GenerateSitesScript {
    sites {
      platform
      type
      url
      displayName
      recentlyCreatedUrl
    }
  }
`;

// The Crom API supports unauthenticated access at a limited rate.
const response = await fetch(
  `https://apiv2.crom.avn.sh/internal?query=${encodeURIComponent(GENERATE_SITES_SCRIPT_QUERY)}`,
  { headers: { accept: "application/json" } },
);
if (!response.ok) throw new Error(`Got HTTP status code: ${response.status}`);

const { data, errors } = (await response.json()) as {
  data: GenerateSitesScriptQuery | null;
  errors: unknown;
};
if (!data || errors) {
  throw new Error("GraphQL error: " + JSON.stringify(errors));
}

const sites = data.sites
  // The bot doesn't support RU_FOUNDATION sites yet.
  .filter((siteInfo) => siteInfo.platform === "WIKIDOT")
  .map((siteInfo) => ({
    ...siteInfo,
    shortName: siteInfo.displayName
      .replace(/[^A-Z]+/gi, "-")
      .replace(/(^-)|(-$)/g, "")
      .toLowerCase(),
  }));

await writeFile(
  path.join(import.meta.dir, "../__generated__/sites.ts"),
  `const SITES = ${JSON.stringify(sites, null, 2)} as const;\n\nexport default SITES;\n`,
);
