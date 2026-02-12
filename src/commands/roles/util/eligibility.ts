import type { CromClient } from "../../../common/crom";
import type { CrawlerClient } from "../../../common/crawler";
import { GET_PAGE_COUNT_QUERY, GET_WIKIDOT_INFO_FROM_DISCORD_ID } from "../queries";
import type {
  GetPageCountQuery,
  GetPageCountQueryVariables,
  PageQueryFilter,
  GetWikidotUsernameFromDiscordIdQuery,
  GetWikidotUsernameFromDiscordIdQueryVariables,
  ManagedRoleConfigFragment,
} from "../../../__generated__/graphql";

export async function checkEligiblity(
  cromApi: CromClient,
  crawlerApi: CrawlerClient,
  discordId: string,
  roleConfig: ManagedRoleConfigFragment["config"],
): Promise<"ERROR" | "INELIGIBLE" | "LINK_NEEDED" | "PUT"> {
  if (roleConfig.__typename === "DiscordGuildManagedRoleOpenConfig") {
    return "PUT";
  }

  const { discordUserInfo } = await cromApi.request<
    GetWikidotUsernameFromDiscordIdQuery,
    GetWikidotUsernameFromDiscordIdQueryVariables
  >(GET_WIKIDOT_INFO_FROM_DISCORD_ID, { discordId });

  if (!discordUserInfo.account?.wikidotIntegration) {
    return "LINK_NEEDED";
  }

  const wikidotUser = discordUserInfo.account.wikidotIntegration;

  if (roleConfig.__typename === "DiscordGuildManagedRoleMemberConfig") {
    try {
      const shouldAssign = await crawlerApi.checkMembership(
        wikidotUser.wikidotId,
        roleConfig.wikiUrl,
      );
      return shouldAssign ? "PUT" : "INELIGIBLE";
    } catch {
      return "ERROR";
    }
  }

  if (roleConfig.__typename === "DiscordGuildManagedRolePageConfig") {
    const filters: PageQueryFilter[] = [];
    filters.push({ attributions: { user: { displayName: { eqLower: wikidotUser.displayName } } } });
    if (roleConfig.siteUrls.length > 0) {
      filters.push({
        _or: roleConfig.siteUrls.map((url) => ({ url: { startsWith: url } })),
      });
    }
    if (roleConfig.withTags.length > 0) {
      filters.push({
        _or: roleConfig.withTags.map((tag) => ({ onWikidotPage: { tags: { eq: tag } } })),
      });
    }
    if (roleConfig.excludeTags.length > 0) {
      filters.push(
        ...roleConfig.excludeTags.map((tag) => ({
          _not: { onWikidotPage: { tags: { eq: tag } } },
        })),
      );
    }
    if (typeof roleConfig.minRating === "number") {
      filters.push({ onWikidotPage: { rating: { gte: roleConfig.minRating } } });
    }
    if (typeof roleConfig.minAgeHours === "number") {
      filters.push({
        onWikidotPage: {
          createdAt: { lt: new Date(Date.now() - roleConfig.minAgeHours * 3600_000).toISOString() },
        },
      });
    }

    const { aggregatePages } = await cromApi.request<GetPageCountQuery, GetPageCountQueryVariables>(
      GET_PAGE_COUNT_QUERY,
      { filter: { _and: filters } },
    );

    if (aggregatePages._count >= roleConfig.minPageCount) {
      return "PUT";
    }
  }

  return "INELIGIBLE";
}
