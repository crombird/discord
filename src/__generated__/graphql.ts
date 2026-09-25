/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type BooleanFilter = {
  /** Match the provided boolean value. */
  eq?: boolean | null | undefined;
  /** Match the opposite of the provided boolean value. */
  neq?: boolean | null | undefined;
};

export type CaseInsensitiveStringFilter = {
  /** Match strings that equal the provided value exactly. */
  eq?: string | null | undefined;
  /** Match (case-insensitive) strings that equal the provided value exactly. */
  eqLower?: string | null | undefined;
  /** Match strings that don't equal the provided value. */
  neq?: string | null | undefined;
  /** Match (case-insensitive) strings that don't equal the provided value exactly. */
  neqLower?: string | null | undefined;
  /** Match strings that start with the provided substring. */
  startsWith?: string | null | undefined;
  /** Match (case-insensitive) strings that start with the provided substring */
  startsWithLower?: string | null | undefined;
};

export type DateTimeFilter = {
  /** Match timestamps that equal the provided value. */
  eq?: string | null | undefined;
  /** Match timestamps that are greater than the provided value. */
  gt?: string | null | undefined;
  /** Match timestamps that are equal to or greater than the provided value. */
  gte?: string | null | undefined;
  /** Match timestamps that are less than the provided value. */
  lt?: string | null | undefined;
  /** Match timestamps that are equal to or less than the provided value. */
  lte?: string | null | undefined;
  /** Match timestamps that don't equal the provided value. */
  neq?: string | null | undefined;
};

export type DeleteDiscordGuildManagedRoleInput = {
  roleId: string;
};

export type DiscordGuildManagedRoleConfigInput = {
  discordGuildManagedRoleMemberConfig?: DiscordGuildManagedRoleMemberConfigInput | null | undefined;
  discordGuildManagedRoleOpenConfig?: DiscordGuildManagedRoleOpenConfigInput | null | undefined;
  discordGuildManagedRolePageConfig?: DiscordGuildManagedRolePageConfigInput | null | undefined;
};

export type DiscordGuildManagedRoleMemberConfigInput = {
  wikiUrl: string;
};

export type DiscordGuildManagedRoleOpenConfigInput = {
  disableAutoAssign: boolean;
};

export type DiscordGuildManagedRolePageConfigInput = {
  excludeTags: Array<string>;
  minAgeHours?: number | null | undefined;
  minPageCount: number;
  minRating?: number | null | undefined;
  siteUrls: Array<string>;
  withTags: Array<string>;
};

export type IntFilter = {
  /** Match numbers that equal the provided value. */
  eq?: number | null | undefined;
  /** Match numbers that are greater than the provided value. */
  gt?: number | null | undefined;
  /** Match numbers that are equal to or greater than the provided value. */
  gte?: number | null | undefined;
  /** Match numbers that are less than the provided value. */
  lt?: number | null | undefined;
  /** Match numbers that are equal to or less than the provided value. */
  lte?: number | null | undefined;
  /** Match numbers that don't equal the provided value. */
  neq?: number | null | undefined;
};

export type PageAlternateTitlesQueryFilter = {
  _and?: Array<PageAlternateTitlesQueryFilter> | null | undefined;
  _not?: PageAlternateTitlesQueryFilter | null | undefined;
  _or?: Array<PageAlternateTitlesQueryFilter> | null | undefined;
  title?: CaseInsensitiveStringFilter | null | undefined;
};

/**
 * The type of attribution.
 * For more information, see https://scpwiki.com/attribution-metadata
 */
export type PageAttributionType =
  /** Primary author or co-authors of the page. */
  | 'AUTHOR'
  /** Authors of major rewrites to the page. A date is usually accompanied. */
  | 'REWRITE'
  /**
   * A fallback type pointing to the user who created this page if no explicit
   * attributions have been provided.
   */
  | 'SUBMITTER'
  /** Translators of pages originally written in another language. */
  | 'TRANSLATOR';

export type PageAttributionTypeQueryFilter = {
  eq?: PageAttributionType | null | undefined;
  neq?: PageAttributionType | null | undefined;
};

export type PageAttributionsQueryFilter = {
  _and?: Array<PageAttributionsQueryFilter> | null | undefined;
  _not?: PageAttributionsQueryFilter | null | undefined;
  _or?: Array<PageAttributionsQueryFilter> | null | undefined;
  type?: PageAttributionTypeQueryFilter | null | undefined;
  user?: UserQueryFilter | null | undefined;
};

export type PageQueryFilter = {
  _and?: Array<PageQueryFilter> | null | undefined;
  _not?: PageQueryFilter | null | undefined;
  _or?: Array<PageQueryFilter> | null | undefined;
  alternateTitles?: PageAlternateTitlesQueryFilter | null | undefined;
  attributions?: PageAttributionsQueryFilter | null | undefined;
  /**
   * Experimental, may change or be removed without notice. Use with caution.
   *
   * Whether the page has an entry in the *logged-in account's* diary.
   * If the access token isn't linked to an account or if the sufficient scope is
   * not present, this will fail.
   *
   * **Notice:** This field requires the `MANAGE_DIARY_ENTRIES` scope.
   */
  inDiary?: BooleanFilter | null | undefined;
  /**
   * Whether the page has an entry in the diary of the account linked to the
   * provided discord account's ID. Only usable by the discord bot. Any other use
   * of this field will fail.
   *
   * **Notice:** This field requires the `MANAGE_DISCORD_GUILDS` privilege.
   */
  inDiaryByDiscordIntegrationId?: StringFilter | null | undefined;
  onWikidotPage?: WikidotPageQueryFilter | null | undefined;
  url?: PrefixStringFilter | null | undefined;
};

export type PageUrlReferenceQueryFilter = {
  _and?: Array<PageUrlReferenceQueryFilter> | null | undefined;
  _not?: PageUrlReferenceQueryFilter | null | undefined;
  _or?: Array<PageUrlReferenceQueryFilter> | null | undefined;
  alternateTitles?: PageAlternateTitlesQueryFilter | null | undefined;
  attributions?: PageAttributionsQueryFilter | null | undefined;
  page?: PageQueryFilter | null | undefined;
  url?: PrefixStringFilter | null | undefined;
};

export type PagesSort = {
  key?: PagesSortKey | null | undefined;
  order?: SortOrder | null | undefined;
};

export type PagesSortKey =
  | 'LATEST_ATTRIBUTION_DATE'
  | 'URL'
  | 'WIKIDOT_CREATED_AT'
  /**
   * Warning: Don't use unless you know what you're doing.
   * Order by POSIX-collated approximation of wikidot's internal fullname representation.
   */
  | 'WIKIDOT_FULLNAME'
  | 'WIKIDOT_RATING'
  | 'WIKIDOT_TITLE';

export type PrefixStringFilter = {
  /** Match strings that equal the provided value exactly. */
  eq?: string | null | undefined;
  /** Match strings that don't equal the provided value. */
  neq?: string | null | undefined;
  /** Match strings that start with the provided substring. */
  startsWith?: string | null | undefined;
};

export type ReadingListItemInput = {
  comment?: string | null | undefined;
  insertedAt: string;
  pageUrl: string;
  tierId?: string | number | null | undefined;
};

export type ReadingListPrivacy =
  /** The list is only visible to its creator. */
  | 'PRIVATE'
  /**
   * The list is publicly viewable, can be included in searches for other lists
   * and pages, and can be indexed by search engines.
   */
  | 'PUBLIC'
  /**
   * The list is only accessible to anyone with the link. It is not indexed by
   * search engines.
   */
  | 'UNLISTED';

export type ReadingListTierInput = {
  color: string;
  id: string | number;
  name: string;
};

export type ReadingListView =
  | 'ORDERED_LIST'
  | 'TIER_LIST';

/** The platform that hosts a wiki. */
export type SitePlatform =
  | 'RU_FOUNDATION'
  | 'WIKIDOT';

/** A family of wikis that the wiki belongs to. */
export type SiteType =
  | 'BACKROOMS'
  | 'CHAOS_INSURGENCY'
  | 'OTHER'
  | 'SCP_WIKI'
  | 'WANDERERS_LIBRARY';

/** Standard pagination order indicator for paginatable fields. */
export type SortOrder =
  | 'ASC'
  | 'DESC';

export type StringFilter = {
  /** Match strings that equal the provided value exactly. */
  eq?: string | null | undefined;
  /** Match strings that don't equal the provided value. */
  neq?: string | null | undefined;
};

export type UpdateDiscordGuildInfoInput = {
  defaultSiteUrl?: string | null | undefined;
  guildId: string;
  managedRoleMessageId?: string | null | undefined;
};

export type UpdateDiscordGuildManagedRoleInput = {
  config: DiscordGuildManagedRoleConfigInput;
  guildId: string;
  roleId: string;
};

export type UpdateDiscordUserInfoInput = {
  defaultSiteUrl?: string | null | undefined;
  discordId: string;
};

export type UpdateReadingListInput = {
  description?: string | null | undefined;
  id: string | number;
  items?: Array<ReadingListItemInput> | null | undefined;
  privacy?: ReadingListPrivacy | null | undefined;
  tiers?: Array<ReadingListTierInput> | null | undefined;
  title?: string | null | undefined;
  view?: ReadingListView | null | undefined;
};

export type UserQueryFilter = {
  _and?: Array<UserQueryFilter> | null | undefined;
  _not?: UserQueryFilter | null | undefined;
  _or?: Array<UserQueryFilter> | null | undefined;
  displayName?: CaseInsensitiveStringFilter | null | undefined;
};

export type WikidotPageQueryFilter = {
  _and?: Array<WikidotPageQueryFilter> | null | undefined;
  _not?: WikidotPageQueryFilter | null | undefined;
  _or?: Array<WikidotPageQueryFilter> | null | undefined;
  alternateTitles?: PageAlternateTitlesQueryFilter | null | undefined;
  attributions?: PageAttributionsQueryFilter | null | undefined;
  category?: StringFilter | null | undefined;
  children?: WikidotPageQueryFilter | null | undefined;
  createdAt?: DateTimeFilter | null | undefined;
  isHidden?: BooleanFilter | null | undefined;
  isUserPage?: BooleanFilter | null | undefined;
  parent?: PageUrlReferenceQueryFilter | null | undefined;
  rating?: IntFilter | null | undefined;
  tags?: StringFilter | null | undefined;
  title?: CaseInsensitiveStringFilter | null | undefined;
  url?: PrefixStringFilter | null | undefined;
};

export type GetCurrentDefaultReadingListItemsQueryVariables = Exact<{
  discordId: string;
}>;


export type GetCurrentDefaultReadingListItemsQuery = { discordUserInfo: { account: { defaultReadingList: { id: string, slug: string, items: Array<{ comment: string | null, insertedAt: string, page: { url: string } }> } } | null } };

export type UpdateCurrentDefaultReadingListItemsMutationVariables = Exact<{
  input: UpdateReadingListInput;
}>;


export type UpdateCurrentDefaultReadingListItemsMutation = { updateReadingList: { readingList: { id: string } } };

export type AuthorNamesByRankQueryVariables = Exact<{
  rank: number;
  siteUrl?: string | null | undefined;
}>;


export type AuthorNamesByRankQuery = { usersByRank_v1: Array<{ id: string, displayName: string, statistics: { rank: number, totalRating: number } | null }> };

type BasicUserEmbedInfo_UserWikidotNameReference_Fragment = { __typename: 'UserWikidotNameReference', displayName: string };

type BasicUserEmbedInfo_WikidotUser_Fragment = { __typename: 'WikidotUser', wikidotId: string, displayName: string, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null };

export type BasicUserEmbedInfoFragment =
  | BasicUserEmbedInfo_UserWikidotNameReference_Fragment
  | BasicUserEmbedInfo_WikidotUser_Fragment
;

type AllSitesUserEmbedInfo_UserWikidotNameReference_Fragment = { statistics: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
        | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
        | { __typename: 'WikidotPage', title: string, rating: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
       }> } };

type AllSitesUserEmbedInfo_WikidotUser_Fragment = { statistics: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
        | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
        | { __typename: 'WikidotPage', title: string, rating: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
       }> } };

export type AllSitesUserEmbedInfoFragment =
  | AllSitesUserEmbedInfo_UserWikidotNameReference_Fragment
  | AllSitesUserEmbedInfo_WikidotUser_Fragment
;

type SiteSpecificUserEmbedInfo_UserWikidotNameReference_Fragment = { userPage: { url: string } | null, statistics: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
        | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
        | { __typename: 'WikidotPage', title: string, rating: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
       }> } };

type SiteSpecificUserEmbedInfo_WikidotUser_Fragment = { userPage: { url: string } | null, statistics: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
        | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
        | { __typename: 'WikidotPage', title: string, rating: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
       }> } };

export type SiteSpecificUserEmbedInfoFragment =
  | SiteSpecificUserEmbedInfo_UserWikidotNameReference_Fragment
  | SiteSpecificUserEmbedInfo_WikidotUser_Fragment
;

export type SiteSpecificAuthorInfoByIdQueryVariables = Exact<{
  id: string | number;
  siteUrl: string;
  siteUrlString: string;
}>;


export type SiteSpecificAuthorInfoByIdQuery = { user:
    | { __typename: 'UserWikidotNameReference', displayName: string, userPage: { url: string } | null, statistics: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
            | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
            | { __typename: 'WikidotPage', title: string, rating: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
           }> } }
    | { __typename: 'WikidotUser', wikidotId: string, displayName: string, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null, userPage: { url: string } | null, statistics: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
            | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
            | { __typename: 'WikidotPage', title: string, rating: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
           }> } }
   | null };

export type AllSitesAuthorInfoByIdQueryVariables = Exact<{
  id: string | number;
}>;


export type AllSitesAuthorInfoByIdQuery = { user:
    | { __typename: 'UserWikidotNameReference', displayName: string, statistics: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
            | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
            | { __typename: 'WikidotPage', title: string, rating: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
           }> } }
    | { __typename: 'WikidotUser', wikidotId: string, displayName: string, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null, statistics: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
            | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
            | { __typename: 'WikidotPage', title: string, rating: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
           }> } }
   | null };

export type SearchUsersQueryVariables = Exact<{
  query: string;
  siteUrl?: string | null | undefined;
}>;


export type SearchUsersQuery = { searchUsers_v1: Array<{ id: string, wikidotUser: { id: string } | null }> };

type PageEmbedInfo_RuFoundationPage_Fragment = { __typename: 'RuFoundationPage', url: string, attributions: Array<{ type: PageAttributionType, date: string | null, order: number, user:
      | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
      | { __typename: 'WikidotUser', displayName: string }
     }>, alternateTitles: Array<{ title: string }> };

type PageEmbedInfo_WikidotPage_Fragment = { __typename: 'WikidotPage', title: string, rating: number | null, voteCount: number, tags: Array<string>, createdAt: string, thumbnailUrl: string | null, summary: string | null, url: string, attributions: Array<{ type: PageAttributionType, date: string | null, order: number, user:
      | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
      | { __typename: 'WikidotUser', displayName: string }
     }>, alternateTitles: Array<{ title: string }> };

export type PageEmbedInfoFragment =
  | PageEmbedInfo_RuFoundationPage_Fragment
  | PageEmbedInfo_WikidotPage_Fragment
;

export type KillAgentSourceInfoQueryVariables = Exact<{
  url: string;
  siteUrl: string;
}>;


export type KillAgentSourceInfoQuery = { wikidotPage: { url: string, title: string, rating: number | null, alternateTitles: Array<{ title: string }>, attributions: Array<{ type: PageAttributionType, date: string | null, order: number, user:
        | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
        | { __typename: 'WikidotUser', displayName: string }
       }> } | null };

export type LastCreatedQueryVariables = Exact<{
  siteUrl: string;
  siteUrlPrefix: string;
  cutoffTime: string;
  first?: number | null | undefined;
  after?: string | number | null | undefined;
  last?: number | null | undefined;
  before?: string | number | null | undefined;
}>;


export type LastCreatedQuery = { pages: { pageInfo: { hasPreviousPage: boolean, hasNextPage: boolean, startCursor: string | null, endCursor: string | null }, edges: Array<{ node:
        | { __typename: 'RuFoundationPage', url: string, attributions: Array<{ type: PageAttributionType, date: string | null, order: number, user:
              | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
              | { __typename: 'WikidotUser', displayName: string }
             }>, alternateTitles: Array<{ title: string }> }
        | { __typename: 'WikidotPage', title: string, rating: number | null, createdAt: string, tags: Array<string>, url: string, attributions: Array<{ type: PageAttributionType, date: string | null, order: number, user:
              | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
              | { __typename: 'WikidotUser', displayName: string }
             }>, alternateTitles: Array<{ title: string }> }
       }> } };

export type PageByUrlQueryVariables = Exact<{
  url: string;
  siteUrl: string;
}>;


export type PageByUrlQuery = { wikidotPage: { __typename: 'WikidotPage', title: string, rating: number | null, voteCount: number, tags: Array<string>, createdAt: string, thumbnailUrl: string | null, summary: string | null, url: string, attributions: Array<{ type: PageAttributionType, date: string | null, order: number, user:
        | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
        | { __typename: 'WikidotUser', displayName: string }
       }>, alternateTitles: Array<{ title: string }> } | null };

export type ListPagesQueryVariables = Exact<{
  filter: PageQueryFilter;
  sort: PagesSort;
  siteUrl: string;
}>;


export type ListPagesQuery = { pages: { pageInfo: { hasNextPage: boolean }, edges: Array<{ node:
        | { __typename: 'RuFoundationPage', url: string, attributions: Array<{ type: PageAttributionType, date: string | null, order: number, user:
              | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
              | { __typename: 'WikidotUser', displayName: string }
             }>, alternateTitles: Array<{ title: string }> }
        | { __typename: 'WikidotPage', title: string, rating: number | null, voteCount: number, tags: Array<string>, createdAt: string, thumbnailUrl: string | null, summary: string | null, url: string, attributions: Array<{ type: PageAttributionType, date: string | null, order: number, user:
              | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
              | { __typename: 'WikidotUser', displayName: string }
             }>, alternateTitles: Array<{ title: string }> }
       }> }, aggregatePages: { _count: number } };

export type RandomPageQueryVariables = Exact<{
  siteUrl: string;
  filter: PageQueryFilter;
}>;


export type RandomPageQuery = { randomPage_v1:
    | { __typename: 'RuFoundationPage', url: string, attributions: Array<{ type: PageAttributionType, date: string | null, order: number, user:
          | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
          | { __typename: 'WikidotUser', displayName: string }
         }>, alternateTitles: Array<{ title: string }> }
    | { __typename: 'WikidotPage', title: string, rating: number | null, voteCount: number, tags: Array<string>, createdAt: string, thumbnailUrl: string | null, summary: string | null, url: string, attributions: Array<{ type: PageAttributionType, date: string | null, order: number, user:
          | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
          | { __typename: 'WikidotUser', displayName: string }
         }>, alternateTitles: Array<{ title: string }> }
   | null, aggregatePages: { _count: number } };

export type GetDefaultReadingListQueryVariables = Exact<{
  discordId: string;
}>;


export type GetDefaultReadingListQuery = { discordUserInfo: { account: { defaultReadingList: { slug: string, title: string, updatedAt: string, privacy: ReadingListPrivacy, items: Array<{ comment: string | null, page: { url: string, page:
              | { __typename: 'RuFoundationPage', alternateTitles: Array<{ title: string }> }
              | { __typename: 'WikidotPage', title: string, rating: number | null, alternateTitles: Array<{ title: string }> }
             | null } }> } } | null } };

export type GetPageCountQueryVariables = Exact<{
  filter: PageQueryFilter;
}>;


export type GetPageCountQuery = { aggregatePages: { _count: number } };

export type ManagedRoleConfigFragment = { roleId: string, config:
    | { __typename: 'DiscordGuildManagedRoleMemberConfig', wikiUrl: string }
    | { __typename: 'DiscordGuildManagedRoleOpenConfig', disableAutoAssign: boolean }
    | { __typename: 'DiscordGuildManagedRolePageConfig', minPageCount: number, siteUrls: Array<string>, minRating: number | null, minAgeHours: number | null, withTags: Array<string>, excludeTags: Array<string> }
   };

export type GetWikidotUsernameFromDiscordIdQueryVariables = Exact<{
  discordId: string;
}>;


export type GetWikidotUsernameFromDiscordIdQuery = { discordUserInfo: { account: { wikidotIntegration: { displayName: string, unixName: string, wikidotId: string } | null } | null } };

export type GetGuildRolesQueryVariables = Exact<{
  guildId: string;
}>;


export type GetGuildRolesQuery = { discordGuildInfo: { managedRoles: Array<{ roleId: string, config:
        | { __typename: 'DiscordGuildManagedRoleMemberConfig', wikiUrl: string }
        | { __typename: 'DiscordGuildManagedRoleOpenConfig', disableAutoAssign: boolean }
        | { __typename: 'DiscordGuildManagedRolePageConfig', minPageCount: number, siteUrls: Array<string>, minRating: number | null, minAgeHours: number | null, withTags: Array<string>, excludeTags: Array<string> }
       }> } };

export type UpdateManagedRoleMutationVariables = Exact<{
  input: UpdateDiscordGuildManagedRoleInput;
}>;


export type UpdateManagedRoleMutation = { updateDiscordGuildManagedRole: { discordGuildManagedRole: { roleId: string, config:
        | { __typename: 'DiscordGuildManagedRoleMemberConfig', wikiUrl: string }
        | { __typename: 'DiscordGuildManagedRoleOpenConfig', disableAutoAssign: boolean }
        | { __typename: 'DiscordGuildManagedRolePageConfig', minPageCount: number, siteUrls: Array<string>, minRating: number | null, minAgeHours: number | null, withTags: Array<string>, excludeTags: Array<string> }
       } } };

export type DeleteManagedRoleMutationVariables = Exact<{
  input: DeleteDiscordGuildManagedRoleInput;
}>;


export type DeleteManagedRoleMutation = { deleteDiscordGuildManagedRole: { ok: boolean } };

export type SearchPagesQueryVariables = Exact<{
  query: string;
  siteUrl: string;
}>;


export type SearchPagesQuery = { searchPages_v1: Array<
    | { __typename: 'RuFoundationPage', url: string, attributions: Array<{ type: PageAttributionType, date: string | null, order: number, user:
          | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
          | { __typename: 'WikidotUser', displayName: string }
         }>, alternateTitles: Array<{ title: string }> }
    | { __typename: 'WikidotPage', title: string, rating: number | null, voteCount: number, tags: Array<string>, createdAt: string, thumbnailUrl: string | null, summary: string | null, url: string, attributions: Array<{ type: PageAttributionType, date: string | null, order: number, user:
          | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
          | { __typename: 'WikidotUser', displayName: string }
         }>, alternateTitles: Array<{ title: string }> }
  > };

export type ExactUserMatchQueryVariables = Exact<{
  query: string;
  siteUrl?: string | null | undefined;
}>;


export type ExactUserMatchQuery = { searchUsers_v1: Array<{ displayName: string }> };

export type SiteSpecificAuthorInfoByDiscordIdQueryVariables = Exact<{
  discordId: string;
  siteUrl: string;
  siteUrlString: string;
}>;


export type SiteSpecificAuthorInfoByDiscordIdQuery = { discordUserInfo: { account: { wikidotIntegration: { wikidotUser: { __typename: 'WikidotUser', wikidotId: string, displayName: string, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null, userPage: { url: string } | null, statistics: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
                | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
                | { __typename: 'WikidotPage', title: string, rating: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
               }> } } | null } | null } | null } };

export type AllSitesAuthorInfoByDiscordIdQueryVariables = Exact<{
  discordId: string;
}>;


export type AllSitesAuthorInfoByDiscordIdQuery = { discordUserInfo: { account: { wikidotIntegration: { wikidotUser: { __typename: 'WikidotUser', wikidotId: string, displayName: string, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null, statistics: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
                | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
                | { __typename: 'WikidotPage', title: string, rating: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date: string | null }> }
               }> } } | null } | null } | null } };

export type UpdateDiscordGuildInfoMutationVariables = Exact<{
  input: UpdateDiscordGuildInfoInput;
}>;


export type UpdateDiscordGuildInfoMutation = { updateDiscordGuildInfo: { discordGuildInfo: { defaultSiteUrl: string } } };

export type UpdateDiscordUserInfoMutationVariables = Exact<{
  input: UpdateDiscordUserInfoInput;
}>;


export type UpdateDiscordUserInfoMutation = { updateDiscordUserInfo: { discordUserInfo: { defaultSiteUrl: string | null } } };

export type GetGuildContextInfoQueryVariables = Exact<{
  userId: string;
  guildId: string;
}>;


export type GetGuildContextInfoQuery = { discordGuildInfo: { defaultSiteUrl: string }, discordUserInfo: { defaultSiteUrl: string | null, account: { patreonIntegration: { isActive: boolean } | null } | null } };

export type GetDmContextInfoQueryVariables = Exact<{
  userId: string;
}>;


export type GetDmContextInfoQuery = { discordUserInfo: { defaultSiteUrl: string | null, account: { patreonIntegration: { isActive: boolean } | null } | null } };

export type GenerateSitesScriptQueryVariables = Exact<{ [key: string]: never; }>;


export type GenerateSitesScriptQuery = { sites: Array<{ platform: SitePlatform, type: SiteType, url: string, displayName: string, recentlyCreatedUrl: string | null, tagConfigUrl: string | null }> };

export type AttributionEmbedInfoFragment = { type: PageAttributionType, date: string | null, order: number, user:
    | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser: { userPage: { url: string } | null, linkedAccount: { patreonIntegration: { isActive: boolean } | null } | null } | null }
    | { __typename: 'WikidotUser', displayName: string }
   };
