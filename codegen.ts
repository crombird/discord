import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  generates: {
    "src/__generated__/graphql.ts": {
      schema: {
        "https://apiv2.crom.avn.sh/internal": {
          headers: { "User-Agent": "graphql-codegen (crombird-discord)" },
        },
      },
      documents: ["src/**/*.ts"],
      plugins: ["typescript-operations"],
      config: {
        enumsAsTypes: true,
        skipTypename: true,
        strictScalars: true,
        scalars: { DateTime: "string", URL: "string", Color: "string" },
      },
    },
  },
};

export default config;
