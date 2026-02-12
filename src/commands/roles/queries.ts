import { gql } from "../../common/crom";

export const GET_PAGE_COUNT_QUERY = gql`
  query GetPageCount($filter: PageQueryFilter!) {
    aggregatePages(filter: $filter) {
      _count
    }
  }
`;

export const MANAGED_ROLE_CONFIG_FRAGMENT = gql`
  fragment ManagedRoleConfig on DiscordGuildManagedRole {
    roleId
    config {
      __typename
      ... on DiscordGuildManagedRoleOpenConfig {
        disableAutoAssign
      }
      ... on DiscordGuildManagedRolePageConfig {
        minPageCount
        siteUrls
        minRating
        minAgeHours
        withTags
        excludeTags
      }
      ... on DiscordGuildManagedRoleMemberConfig {
        wikiUrl
      }
    }
  }
`;

export const GET_WIKIDOT_INFO_FROM_DISCORD_ID = gql`
  query GetWikidotUsernameFromDiscordId($discordId: String!) {
    discordUserInfo(discordId: $discordId) {
      account {
        wikidotIntegration {
          displayName
          unixName
          wikidotId
        }
      }
    }
  }
`;

export const GET_GUILD_ROLES_QUERY = gql`
  ${MANAGED_ROLE_CONFIG_FRAGMENT}
  query GetGuildRoles($guildId: String!) {
    discordGuildInfo(guildId: $guildId) {
      managedRoles {
        ...ManagedRoleConfig
      }
    }
  }
`;

export const UPDATE_MANAGED_ROLE_MUTATION = gql`
  ${MANAGED_ROLE_CONFIG_FRAGMENT}
  mutation UpdateManagedRole($input: UpdateDiscordGuildManagedRoleInput!) {
    updateDiscordGuildManagedRole(input: $input) {
      discordGuildManagedRole {
        ...ManagedRoleConfig
      }
    }
  }
`;

export const DELETE_MANAGED_ROLE_MUTATION = gql`
  mutation DeleteManagedRole($input: DeleteDiscordGuildManagedRoleInput!) {
    deleteDiscordGuildManagedRole(input: $input) {
      ok
    }
  }
`;
