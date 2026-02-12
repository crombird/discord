import { REST, type RequestData, type RouteLike } from "@discordjs/rest";

/** More ergonomic request method types for the @discordjs/rest client. */
export interface RESTWithTypeParameters extends REST {
  get<ReturnType = unknown>(fullRoute: RouteLike, options?: RequestData): Promise<ReturnType>;
  delete<ReturnType = unknown>(fullRoute: RouteLike, options?: RequestData): Promise<ReturnType>;
  post<ReturnType = unknown>(fullRoute: RouteLike, options?: RequestData): Promise<ReturnType>;
  put<ReturnType = unknown>(fullRoute: RouteLike, options?: RequestData): Promise<ReturnType>;
  patch<ReturnType = unknown>(fullRoute: RouteLike, options?: RequestData): Promise<ReturnType>;
}

/** Creates a new Discord client with the given token. */
export function createDiscordClient(token: string) {
  const client = new REST({ version: "10" }) as RESTWithTypeParameters;
  client.setToken(token);
  return client;
}
