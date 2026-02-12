export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  URL: { input: string; output: string; }
};

export type AccountReadingListsSort = {
  key?: InputMaybe<AccountReadingListsSortKey>;
  order?: InputMaybe<SortOrder>;
};

export type AccountReadingListsSortKey =
  | 'CREATED_AT'
  | 'TITLE';

/** The OAuth2 grant type applications are restricted to. */
export type ApplicationGrantType =
  | 'AUTHORIZATION_CODE'
  | 'CLIENT_CREDENTIALS';

export type AuthScope =
  /** Allows the application to manage the user's account. */
  | 'MANAGE_ACCOUNT'
  /** Allows the application to create, update, and delete diary entries. */
  | 'MANAGE_DIARY_ENTRIES'
  /**
   * Allows the application to create, update, and delete publicly viewable and
   * private reading lists.
   */
  | 'MANAGE_READING_LISTS'
  /**
   * Allows the application to get details about the patreon account linked to
   * the user's Crom account.
   */
  | 'READ_PATREON_INTEGRATION'
  /**
   * Allows the application to get details about the wikidot account linked to
   * the user's Crom account.
   */
  | 'READ_WIKIDOT_INTEGRATION';

export type BooleanFilter = {
  /** Match the provided boolean value. */
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  /** Match the opposite of the provided boolean value. */
  neq?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CaseInsensitiveStringFilter = {
  /** Match strings that equal the provided value exactly. */
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Match (case-insensitive) strings that equal the provided value exactly. */
  eqLower?: InputMaybe<Scalars['String']['input']>;
  /** Match strings that don't equal the provided value. */
  neq?: InputMaybe<Scalars['String']['input']>;
  /** Match (case-insensitive) strings that don't equal the provided value exactly. */
  neqLower?: InputMaybe<Scalars['String']['input']>;
  /** Match strings that start with the provided substring. */
  startsWith?: InputMaybe<Scalars['String']['input']>;
  /** Match (case-insensitive) strings that start with the provided substring */
  startsWithLower?: InputMaybe<Scalars['String']['input']>;
};

export type ClientPrivilege =
  /** Allows the client to break rate limiting requirements. */
  | 'BYPASS_RATE_LIMITS'
  /** Allows the crawler to update and delete publicly accessible wiki data. */
  | 'CRAWLER'
  /** Allows the application to get aggregate details on reading lists. */
  | 'ENUMERATE_READING_LISTS'
  /**
   * Allows Crom's frontend website to authenticate users and make requests
   * on behalf of real end users.
   */
  | 'MANAGE_AUTHENTICATION'
  /**
   * Allows access to discord guild config APIs (for all guilds).
   * Used by the discord bot to add/edit guild-specific preferences.
   */
  | 'MANAGE_DISCORD_GUILDS';

export type CrawlerHintType =
  | 'NEW_PAGE'
  | 'WIKIDOT_PAGE_CONTENT_UPDATED'
  | 'WIKIDOT_PAGE_METADATA_UPDATED';

export type CreateAccountWithMagicEmailInput = {
  acceptTerms: Scalars['Boolean']['input'];
  emailAddress: Scalars['String']['input'];
  ipAddress: Scalars['String']['input'];
  verifiedCode: Scalars['String']['input'];
};

export type CreateApplicationInput = {
  aboutUrl?: InputMaybe<Scalars['URL']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  grantType: ApplicationGrantType;
  name: Scalars['String']['input'];
  redirectUris: Array<Scalars['String']['input']>;
};

export type CreateDiaryEntryInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  pageUrl: Scalars['URL']['input'];
  timestamp?: InputMaybe<Scalars['DateTime']['input']>;
};

export type CreateDiscordIntegrationInput = {
  code: Scalars['String']['input'];
};

export type CreatePatreonIntegrationInput = {
  code: Scalars['String']['input'];
};

export type CreateReadingListInput = {
  description: Scalars['String']['input'];
  items: Array<ReadingListItemInput>;
  privacy: ReadingListPrivacy;
  tiers?: InputMaybe<Array<ReadingListTierInput>>;
  title: Scalars['String']['input'];
  view: ReadingListView;
};

export type CreateSessionWithDiscordIntegrationInput = {
  code: Scalars['String']['input'];
};

export type CreateSessionWithMagicEmailInput = {
  emailAddress: Scalars['String']['input'];
  ipAddress: Scalars['String']['input'];
  verifiedCode: Scalars['String']['input'];
};

export type CreateWikidotIntegrationInput = {
  code: Scalars['String']['input'];
};

export type DateTimeFilter = {
  /** Match timestamps that equal the provided value. */
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  /** Match timestamps that are greater than the provided value. */
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  /** Match timestamps that are equal to or greater than the provided value. */
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  /** Match timestamps that are less than the provided value. */
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  /** Match timestamps that are equal to or less than the provided value. */
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  /** Match timestamps that don't equal the provided value. */
  neq?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteApplicationInput = {
  id: Scalars['ID']['input'];
};

export type DeleteDiaryEntryInput = {
  id: Scalars['ID']['input'];
};

export type DeleteDiscordGuildManagedRoleInput = {
  roleId: Scalars['String']['input'];
};

export type DeletePageAlternateTitlesInput = {
  withCollectionKey: Scalars['String']['input'];
  withoutCollectionId: Scalars['String']['input'];
};

export type DeletePageAttributionsInput = {
  withCollectionKey: Scalars['String']['input'];
  withoutCollectionId: Scalars['String']['input'];
};

export type DeleteReadingListInput = {
  id: Scalars['ID']['input'];
};

export type DeleteWikidotPageInput = {
  url: Scalars['URL']['input'];
};

export type DiaryEntryPageQueryFilter = {
  url?: InputMaybe<PrefixStringFilter>;
};

export type DiaryEntryQueryFilter = {
  page?: InputMaybe<DiaryEntryPageQueryFilter>;
};

export type DiscordGuildManagedRoleConfigInput = {
  discordGuildManagedRoleMemberConfig?: InputMaybe<DiscordGuildManagedRoleMemberConfigInput>;
  discordGuildManagedRoleOpenConfig?: InputMaybe<DiscordGuildManagedRoleOpenConfigInput>;
  discordGuildManagedRolePageConfig?: InputMaybe<DiscordGuildManagedRolePageConfigInput>;
};

export type DiscordGuildManagedRoleInput = {
  config: DiscordGuildManagedRoleConfigInput;
  roleId: Scalars['String']['input'];
};

export type DiscordGuildManagedRoleMemberConfigInput = {
  wikiUrl: Scalars['URL']['input'];
};

export type DiscordGuildManagedRoleOpenConfigInput = {
  disableAutoAssign: Scalars['Boolean']['input'];
};

export type DiscordGuildManagedRolePageConfigInput = {
  excludeTags: Array<Scalars['String']['input']>;
  minAgeHours?: InputMaybe<Scalars['Int']['input']>;
  minPageCount: Scalars['Int']['input'];
  minRating?: InputMaybe<Scalars['Int']['input']>;
  siteUrls: Array<Scalars['URL']['input']>;
  withTags: Array<Scalars['String']['input']>;
};

export type GrantAuthorizationInput = {
  clientId: Scalars['String']['input'];
  codeChallenge: Scalars['String']['input'];
  duration: GrantAuthorizationInputDuration;
  redirectUri: Scalars['String']['input'];
  scope: Array<AuthScope>;
};

export type GrantAuthorizationInputDuration =
  | 'PERMANENT'
  | 'TEMPORARY';

export type InsertPageAlternateTitlesInput = {
  pageAlternateTitles: Array<PageAlternateTitleInput>;
};

export type InsertPageAttributionsInput = {
  pageAttributions: Array<PageAttributionInput>;
};

export type InsertWikidotPageInput = {
  category: Scalars['String']['input'];
  commentCount: Scalars['Int']['input'];
  createdAt: Scalars['DateTime']['input'];
  createdByDisplayName: Scalars['String']['input'];
  createdByUnixName?: InputMaybe<Scalars['String']['input']>;
  createdByWikidotId?: InputMaybe<Scalars['String']['input']>;
  isHidden: Scalars['Boolean']['input'];
  isUserPage: Scalars['Boolean']['input'];
  parentUrl?: InputMaybe<Scalars['URL']['input']>;
  rating: Scalars['Float']['input'];
  revisionCount: Scalars['Int']['input'];
  source: Scalars['String']['input'];
  summary?: InputMaybe<Scalars['String']['input']>;
  tags: Array<Scalars['String']['input']>;
  textContent: Scalars['String']['input'];
  thumbnailUrl?: InputMaybe<Scalars['URL']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  url: Scalars['URL']['input'];
  voteCount: Scalars['Int']['input'];
  wikidotId: Scalars['String']['input'];
};

export type InsertWikidotRevisionsInput = {
  wikidotRevisions: Array<WikidotRevisionInput>;
};

export type InsertWikidotVoteRecordsInput = {
  wikidotVoteRecords: Array<WikidotVoteRecordInput>;
};

export type IntFilter = {
  /** Match numbers that equal the provided value. */
  eq?: InputMaybe<Scalars['Int']['input']>;
  /** Match numbers that are greater than the provided value. */
  gt?: InputMaybe<Scalars['Int']['input']>;
  /** Match numbers that are equal to or greater than the provided value. */
  gte?: InputMaybe<Scalars['Int']['input']>;
  /** Match numbers that are less than the provided value. */
  lt?: InputMaybe<Scalars['Int']['input']>;
  /** Match numbers that are equal to or less than the provided value. */
  lte?: InputMaybe<Scalars['Int']['input']>;
  /** Match numbers that don't equal the provided value. */
  neq?: InputMaybe<Scalars['String']['input']>;
};

export type PageAlternateTitleInput = {
  collectionId: Scalars['String']['input'];
  collectionKey: Scalars['String']['input'];
  pageUrl: Scalars['URL']['input'];
  source?: InputMaybe<Scalars['URL']['input']>;
  title: Scalars['String']['input'];
};

export type PageAlternateTitlesQueryFilter = {
  _and?: InputMaybe<Array<PageAlternateTitlesQueryFilter>>;
  _not?: InputMaybe<PageAlternateTitlesQueryFilter>;
  _or?: InputMaybe<Array<PageAlternateTitlesQueryFilter>>;
  title?: InputMaybe<CaseInsensitiveStringFilter>;
};

export type PageAttributionInput = {
  collectionId: Scalars['String']['input'];
  collectionKey: Scalars['String']['input'];
  date?: InputMaybe<Scalars['DateTime']['input']>;
  order: Scalars['Int']['input'];
  pageUrl: Scalars['URL']['input'];
  source: Scalars['URL']['input'];
  type: PageAttributionType;
  user: Scalars['String']['input'];
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
  eq?: InputMaybe<PageAttributionType>;
  neq?: InputMaybe<PageAttributionType>;
};

export type PageAttributionsQueryFilter = {
  _and?: InputMaybe<Array<PageAttributionsQueryFilter>>;
  _not?: InputMaybe<PageAttributionsQueryFilter>;
  _or?: InputMaybe<Array<PageAttributionsQueryFilter>>;
  type?: InputMaybe<PageAttributionTypeQueryFilter>;
  user?: InputMaybe<UserQueryFilter>;
};

export type PageQueryFilter = {
  _and?: InputMaybe<Array<PageQueryFilter>>;
  _not?: InputMaybe<PageQueryFilter>;
  _or?: InputMaybe<Array<PageQueryFilter>>;
  alternateTitles?: InputMaybe<PageAlternateTitlesQueryFilter>;
  attributions?: InputMaybe<PageAttributionsQueryFilter>;
  /**
   * Experimental, may change or be removed without notice. Use with caution.
   *
   * Whether the page has an entry in the *logged-in account's* diary.
   * If the access token isn't linked to an account or if the sufficient scope is
   * not present, this will fail.
   *
   * **Notice:** This field requires the `MANAGE_DIARY_ENTRIES` scope.
   */
  inDiary?: InputMaybe<BooleanFilter>;
  /**
   * Whether the page has an entry in the diary of the account linked to the
   * provided discord account's ID. Only usable by the discord bot. Any other use
   * of this field will fail.
   *
   * **Notice:** This field requires the `MANAGE_DISCORD_GUILDS` privilege.
   */
  inDiaryByDiscordIntegrationId?: InputMaybe<StringFilter>;
  onWikidotPage?: InputMaybe<WikidotPageQueryFilter>;
  url?: InputMaybe<PrefixStringFilter>;
};

export type PageUrlReferenceQueryFilter = {
  _and?: InputMaybe<Array<PageUrlReferenceQueryFilter>>;
  _not?: InputMaybe<PageUrlReferenceQueryFilter>;
  _or?: InputMaybe<Array<PageUrlReferenceQueryFilter>>;
  alternateTitles?: InputMaybe<PageAlternateTitlesQueryFilter>;
  attributions?: InputMaybe<PageAttributionsQueryFilter>;
  page?: InputMaybe<PageQueryFilter>;
  url?: InputMaybe<PrefixStringFilter>;
};

export type PagesSort = {
  key?: InputMaybe<PagesSortKey>;
  order?: InputMaybe<SortOrder>;
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
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Match strings that don't equal the provided value. */
  neq?: InputMaybe<Scalars['String']['input']>;
  /** Match strings that start with the provided substring. */
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

export type ReadingListItemInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  insertedAt: Scalars['DateTime']['input'];
  pageUrl: Scalars['URL']['input'];
  tierId?: InputMaybe<Scalars['ID']['input']>;
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
  color: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};

export type ReadingListView =
  | 'ORDERED_LIST'
  | 'TIER_LIST';

export type SendMagicEmailInput = {
  emailAddress: Scalars['String']['input'];
  intent: SendMagicEmailInputIntent;
  ipAddress: Scalars['String']['input'];
};

export type SendMagicEmailInputIntent =
  | 'CHANGE_EMAIL_ADDRESS'
  | 'CREATE_ACCOUNT'
  | 'SIGN_IN';

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
  eq?: InputMaybe<Scalars['String']['input']>;
  /** Match strings that don't equal the provided value. */
  neq?: InputMaybe<Scalars['String']['input']>;
};

export type SubmitCrawlerHintInput = {
  pageUrl: Scalars['URL']['input'];
  type: CrawlerHintType;
};

export type UpdateApplicationInput = {
  aboutUrl?: InputMaybe<Scalars['URL']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  grantType?: InputMaybe<ApplicationGrantType>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  redirectUris?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type UpdateDiaryEntryInput = {
  comment?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  timestamp?: InputMaybe<Scalars['DateTime']['input']>;
};

export type UpdateDiscordGuildInfoInput = {
  defaultSiteUrl?: InputMaybe<Scalars['URL']['input']>;
  guildId: Scalars['String']['input'];
  managedRoleMessageId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDiscordGuildManagedRoleInput = {
  config: DiscordGuildManagedRoleConfigInput;
  guildId: Scalars['String']['input'];
  roleId: Scalars['String']['input'];
};

export type UpdateDiscordUserInfoInput = {
  defaultSiteUrl?: InputMaybe<Scalars['URL']['input']>;
  discordId: Scalars['String']['input'];
};

export type UpdateReadingListInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  items?: InputMaybe<Array<ReadingListItemInput>>;
  privacy?: InputMaybe<ReadingListPrivacy>;
  tiers?: InputMaybe<Array<ReadingListTierInput>>;
  title?: InputMaybe<Scalars['String']['input']>;
  view?: InputMaybe<ReadingListView>;
};

export type UpdateWikidotPageContentInput = {
  commentCount: Scalars['Int']['input'];
  createdAt: Scalars['DateTime']['input'];
  createdByDisplayName: Scalars['String']['input'];
  createdByUnixName?: InputMaybe<Scalars['String']['input']>;
  createdByWikidotId?: InputMaybe<Scalars['String']['input']>;
  isHidden: Scalars['Boolean']['input'];
  isUserPage: Scalars['Boolean']['input'];
  parentUrl?: InputMaybe<Scalars['URL']['input']>;
  rating: Scalars['Float']['input'];
  revisionCount: Scalars['Int']['input'];
  source: Scalars['String']['input'];
  summary?: InputMaybe<Scalars['String']['input']>;
  tags: Array<Scalars['String']['input']>;
  textContent: Scalars['String']['input'];
  thumbnailUrl?: InputMaybe<Scalars['URL']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  url: Scalars['URL']['input'];
  voteCount: Scalars['Int']['input'];
  wikidotId: Scalars['String']['input'];
};

export type UpdateWikidotPageMetadataInput = {
  commentCount: Scalars['Int']['input'];
  createdByDisplayName: Scalars['String']['input'];
  createdByUnixName?: InputMaybe<Scalars['String']['input']>;
  createdByWikidotId?: InputMaybe<Scalars['String']['input']>;
  parentUrl?: InputMaybe<Scalars['URL']['input']>;
  rating: Scalars['Float']['input'];
  url: Scalars['URL']['input'];
  voteCount: Scalars['Int']['input'];
};

export type UserQueryFilter = {
  _and?: InputMaybe<Array<UserQueryFilter>>;
  _not?: InputMaybe<UserQueryFilter>;
  _or?: InputMaybe<Array<UserQueryFilter>>;
  displayName?: InputMaybe<CaseInsensitiveStringFilter>;
};

export type VerifyMagicEmailInput = {
  code: Scalars['String']['input'];
  emailAddress: Scalars['String']['input'];
  ipAddress: Scalars['String']['input'];
};

export type WikidotPageQueryFilter = {
  _and?: InputMaybe<Array<WikidotPageQueryFilter>>;
  _not?: InputMaybe<WikidotPageQueryFilter>;
  _or?: InputMaybe<Array<WikidotPageQueryFilter>>;
  alternateTitles?: InputMaybe<PageAlternateTitlesQueryFilter>;
  attributions?: InputMaybe<PageAttributionsQueryFilter>;
  category?: InputMaybe<StringFilter>;
  children?: InputMaybe<WikidotPageQueryFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  isHidden?: InputMaybe<BooleanFilter>;
  isUserPage?: InputMaybe<BooleanFilter>;
  parent?: InputMaybe<PageUrlReferenceQueryFilter>;
  rating?: InputMaybe<IntFilter>;
  tags?: InputMaybe<StringFilter>;
  title?: InputMaybe<CaseInsensitiveStringFilter>;
  url?: InputMaybe<PrefixStringFilter>;
};

export type WikidotRevisionInput = {
  /** Optional because comments can be blank. */
  comment?: InputMaybe<Scalars['String']['input']>;
  index: Scalars['Int']['input'];
  pageWikidotId: Scalars['String']['input'];
  timestamp: Scalars['DateTime']['input'];
  /** Optional because old revisions don't have a type. */
  type?: InputMaybe<WikidotRevisionType>;
  userDisplayName?: InputMaybe<Scalars['String']['input']>;
  userUnixName?: InputMaybe<Scalars['String']['input']>;
  /** Optional because revisions can be attributed to anonymous users or IP addresses. */
  userWikidotId?: InputMaybe<Scalars['String']['input']>;
  wikidotId: Scalars['String']['input'];
};

export type WikidotRevisionType =
  /** When a file attachment on the page is added or removed. Flagged as type "F". */
  | 'FILES_CHANGED'
  /** The first revision of a page. Flagged as type "N". */
  | 'PAGE_CREATED'
  /** When the source of the page is changed. Flagged as type "S". */
  | 'SOURCE_CHANGED'
  /** When tags are changed. Flagged as type "A". */
  | 'TAGS_CHANGED'
  /** When the title of the page is changed. Flagged as type "T". */
  | 'TITLE_CHANGED';

export type WikidotVoteRecordInput = {
  direction: Scalars['Int']['input'];
  pageWikidotId: Scalars['String']['input'];
  timestamp: Scalars['DateTime']['input'];
  userDisplayName?: InputMaybe<Scalars['String']['input']>;
  userUnixName?: InputMaybe<Scalars['String']['input']>;
  userWikidotId: Scalars['String']['input'];
};

export type GetCurrentDefaultReadingListItemsQueryVariables = Exact<{
  discordId: Scalars['String']['input'];
}>;


export type GetCurrentDefaultReadingListItemsQuery = { discordUserInfo: { account?: { defaultReadingList: { id: string, slug: string, items: Array<{ comment?: string | null, insertedAt: string, page: { url: string } }> } } | null } };

export type UpdateCurrentDefaultReadingListItemsMutationVariables = Exact<{
  input: UpdateReadingListInput;
}>;


export type UpdateCurrentDefaultReadingListItemsMutation = { updateReadingList: { readingList: { id: string } } };

export type AuthorNamesByRankQueryVariables = Exact<{
  rank: Scalars['Int']['input'];
  siteUrl?: InputMaybe<Scalars['URL']['input']>;
}>;


export type AuthorNamesByRankQuery = { usersByRank_v1: Array<{ id: string, displayName: string, statistics?: { rank: number, totalRating: number } | null }> };

type BasicUserEmbedInfo_UserWikidotNameReference_Fragment = { __typename: 'UserWikidotNameReference', displayName: string };

type BasicUserEmbedInfo_WikidotUser_Fragment = { __typename: 'WikidotUser', wikidotId: string, displayName: string, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null };

export type BasicUserEmbedInfoFragment =
  | BasicUserEmbedInfo_UserWikidotNameReference_Fragment
  | BasicUserEmbedInfo_WikidotUser_Fragment
;

type AllSitesUserEmbedInfo_UserWikidotNameReference_Fragment = { statistics?: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
        | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
        | { __typename: 'WikidotPage', title: string, rating?: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
       }> } };

type AllSitesUserEmbedInfo_WikidotUser_Fragment = { statistics?: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
        | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
        | { __typename: 'WikidotPage', title: string, rating?: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
       }> } };

export type AllSitesUserEmbedInfoFragment =
  | AllSitesUserEmbedInfo_UserWikidotNameReference_Fragment
  | AllSitesUserEmbedInfo_WikidotUser_Fragment
;

type SiteSpecificUserEmbedInfo_UserWikidotNameReference_Fragment = { userPage?: { url: string } | null, statistics?: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
        | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
        | { __typename: 'WikidotPage', title: string, rating?: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
       }> } };

type SiteSpecificUserEmbedInfo_WikidotUser_Fragment = { userPage?: { url: string } | null, statistics?: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
        | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
        | { __typename: 'WikidotPage', title: string, rating?: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
       }> } };

export type SiteSpecificUserEmbedInfoFragment =
  | SiteSpecificUserEmbedInfo_UserWikidotNameReference_Fragment
  | SiteSpecificUserEmbedInfo_WikidotUser_Fragment
;

export type SiteSpecificAuthorInfoByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  siteUrl: Scalars['URL']['input'];
  siteUrlString: Scalars['String']['input'];
}>;


export type SiteSpecificAuthorInfoByIdQuery = { user?:
    | { __typename: 'UserWikidotNameReference', displayName: string, userPage?: { url: string } | null, statistics?: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
            | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
            | { __typename: 'WikidotPage', title: string, rating?: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
           }> } }
    | { __typename: 'WikidotUser', wikidotId: string, displayName: string, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null, userPage?: { url: string } | null, statistics?: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
            | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
            | { __typename: 'WikidotPage', title: string, rating?: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
           }> } }
   | null };

export type AllSitesAuthorInfoByIdQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type AllSitesAuthorInfoByIdQuery = { user?:
    | { __typename: 'UserWikidotNameReference', displayName: string, statistics?: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
            | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
            | { __typename: 'WikidotPage', title: string, rating?: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
           }> } }
    | { __typename: 'WikidotUser', wikidotId: string, displayName: string, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null, statistics?: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
            | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
            | { __typename: 'WikidotPage', title: string, rating?: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
           }> } }
   | null };

export type SearchUsersQueryVariables = Exact<{
  query: Scalars['String']['input'];
  siteUrl?: InputMaybe<Scalars['URL']['input']>;
}>;


export type SearchUsersQuery = { searchUsers_v1: Array<{ id: string, wikidotUser?: { id: string } | null }> };

type PageEmbedInfo_RuFoundationPage_Fragment = { __typename: 'RuFoundationPage', url: string, attributions: Array<{ type: PageAttributionType, date?: string | null, order: number, user:
      | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
      | { __typename: 'WikidotUser', displayName: string }
     }>, alternateTitles: Array<{ title: string }> };

type PageEmbedInfo_WikidotPage_Fragment = { __typename: 'WikidotPage', title: string, rating?: number | null, voteCount: number, tags: Array<string>, createdAt: string, thumbnailUrl?: string | null, summary?: string | null, url: string, attributions: Array<{ type: PageAttributionType, date?: string | null, order: number, user:
      | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
      | { __typename: 'WikidotUser', displayName: string }
     }>, alternateTitles: Array<{ title: string }> };

export type PageEmbedInfoFragment =
  | PageEmbedInfo_RuFoundationPage_Fragment
  | PageEmbedInfo_WikidotPage_Fragment
;

export type KillAgentSourceInfoQueryVariables = Exact<{
  url: Scalars['URL']['input'];
  siteUrl: Scalars['URL']['input'];
}>;


export type KillAgentSourceInfoQuery = { wikidotPage?: { url: string, title: string, rating?: number | null, alternateTitles: Array<{ title: string }>, attributions: Array<{ type: PageAttributionType, date?: string | null, order: number, user:
        | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
        | { __typename: 'WikidotUser', displayName: string }
       }> } | null };

export type LastCreatedQueryVariables = Exact<{
  siteUrl: Scalars['URL']['input'];
  siteUrlPrefix: Scalars['String']['input'];
  cutoffTime: Scalars['DateTime']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
  after?: InputMaybe<Scalars['ID']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  before?: InputMaybe<Scalars['ID']['input']>;
}>;


export type LastCreatedQuery = { pages: { pageInfo: { hasPreviousPage: boolean, hasNextPage: boolean, startCursor?: string | null, endCursor?: string | null }, edges: Array<{ node:
        | { __typename: 'RuFoundationPage', url: string, attributions: Array<{ type: PageAttributionType, date?: string | null, order: number, user:
              | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
              | { __typename: 'WikidotUser', displayName: string }
             }>, alternateTitles: Array<{ title: string }> }
        | { __typename: 'WikidotPage', title: string, rating?: number | null, createdAt: string, tags: Array<string>, url: string, attributions: Array<{ type: PageAttributionType, date?: string | null, order: number, user:
              | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
              | { __typename: 'WikidotUser', displayName: string }
             }>, alternateTitles: Array<{ title: string }> }
       }> } };

export type PageByUrlQueryVariables = Exact<{
  url: Scalars['URL']['input'];
  siteUrl: Scalars['URL']['input'];
}>;


export type PageByUrlQuery = { wikidotPage?: { __typename: 'WikidotPage', title: string, rating?: number | null, voteCount: number, tags: Array<string>, createdAt: string, thumbnailUrl?: string | null, summary?: string | null, url: string, attributions: Array<{ type: PageAttributionType, date?: string | null, order: number, user:
        | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
        | { __typename: 'WikidotUser', displayName: string }
       }>, alternateTitles: Array<{ title: string }> } | null };

export type ListPagesQueryVariables = Exact<{
  filter: PageQueryFilter;
  sort: PagesSort;
  siteUrl: Scalars['URL']['input'];
}>;


export type ListPagesQuery = { pages: { pageInfo: { hasNextPage: boolean }, edges: Array<{ node:
        | { __typename: 'RuFoundationPage', url: string, attributions: Array<{ type: PageAttributionType, date?: string | null, order: number, user:
              | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
              | { __typename: 'WikidotUser', displayName: string }
             }>, alternateTitles: Array<{ title: string }> }
        | { __typename: 'WikidotPage', title: string, rating?: number | null, voteCount: number, tags: Array<string>, createdAt: string, thumbnailUrl?: string | null, summary?: string | null, url: string, attributions: Array<{ type: PageAttributionType, date?: string | null, order: number, user:
              | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
              | { __typename: 'WikidotUser', displayName: string }
             }>, alternateTitles: Array<{ title: string }> }
       }> }, aggregatePages: { _count: number } };

export type RandomPageQueryVariables = Exact<{
  siteUrl: Scalars['URL']['input'];
  filter: PageQueryFilter;
}>;


export type RandomPageQuery = { randomPage_v1?:
    | { __typename: 'RuFoundationPage', url: string, attributions: Array<{ type: PageAttributionType, date?: string | null, order: number, user:
          | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
          | { __typename: 'WikidotUser', displayName: string }
         }>, alternateTitles: Array<{ title: string }> }
    | { __typename: 'WikidotPage', title: string, rating?: number | null, voteCount: number, tags: Array<string>, createdAt: string, thumbnailUrl?: string | null, summary?: string | null, url: string, attributions: Array<{ type: PageAttributionType, date?: string | null, order: number, user:
          | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
          | { __typename: 'WikidotUser', displayName: string }
         }>, alternateTitles: Array<{ title: string }> }
   | null, aggregatePages: { _count: number } };

export type GetDefaultReadingListQueryVariables = Exact<{
  discordId: Scalars['String']['input'];
}>;


export type GetDefaultReadingListQuery = { discordUserInfo: { account?: { defaultReadingList: { slug: string, title: string, updatedAt: string, privacy: ReadingListPrivacy, items: Array<{ comment?: string | null, page: { url: string, page?:
              | { __typename: 'RuFoundationPage', alternateTitles: Array<{ title: string }> }
              | { __typename: 'WikidotPage', title: string, rating?: number | null, alternateTitles: Array<{ title: string }> }
             | null } }> } } | null } };

export type GetPageCountQueryVariables = Exact<{
  filter: PageQueryFilter;
}>;


export type GetPageCountQuery = { aggregatePages: { _count: number } };

export type ManagedRoleConfigFragment = { roleId: string, config:
    | { __typename: 'DiscordGuildManagedRoleMemberConfig', wikiUrl: string }
    | { __typename: 'DiscordGuildManagedRoleOpenConfig', disableAutoAssign: boolean }
    | { __typename: 'DiscordGuildManagedRolePageConfig', minPageCount: number, siteUrls: Array<string>, minRating?: number | null, minAgeHours?: number | null, withTags: Array<string>, excludeTags: Array<string> }
   };

export type GetWikidotUsernameFromDiscordIdQueryVariables = Exact<{
  discordId: Scalars['String']['input'];
}>;


export type GetWikidotUsernameFromDiscordIdQuery = { discordUserInfo: { account?: { wikidotIntegration?: { displayName: string, unixName: string, wikidotId: string } | null } | null } };

export type GetGuildRolesQueryVariables = Exact<{
  guildId: Scalars['String']['input'];
}>;


export type GetGuildRolesQuery = { discordGuildInfo: { managedRoles: Array<{ roleId: string, config:
        | { __typename: 'DiscordGuildManagedRoleMemberConfig', wikiUrl: string }
        | { __typename: 'DiscordGuildManagedRoleOpenConfig', disableAutoAssign: boolean }
        | { __typename: 'DiscordGuildManagedRolePageConfig', minPageCount: number, siteUrls: Array<string>, minRating?: number | null, minAgeHours?: number | null, withTags: Array<string>, excludeTags: Array<string> }
       }> } };

export type UpdateManagedRoleMutationVariables = Exact<{
  input: UpdateDiscordGuildManagedRoleInput;
}>;


export type UpdateManagedRoleMutation = { updateDiscordGuildManagedRole: { discordGuildManagedRole: { roleId: string, config:
        | { __typename: 'DiscordGuildManagedRoleMemberConfig', wikiUrl: string }
        | { __typename: 'DiscordGuildManagedRoleOpenConfig', disableAutoAssign: boolean }
        | { __typename: 'DiscordGuildManagedRolePageConfig', minPageCount: number, siteUrls: Array<string>, minRating?: number | null, minAgeHours?: number | null, withTags: Array<string>, excludeTags: Array<string> }
       } } };

export type DeleteManagedRoleMutationVariables = Exact<{
  input: DeleteDiscordGuildManagedRoleInput;
}>;


export type DeleteManagedRoleMutation = { deleteDiscordGuildManagedRole: { ok: boolean } };

export type SearchPagesQueryVariables = Exact<{
  query: Scalars['String']['input'];
  siteUrl: Scalars['URL']['input'];
}>;


export type SearchPagesQuery = { searchPages_v1: Array<
    | { __typename: 'RuFoundationPage', url: string, attributions: Array<{ type: PageAttributionType, date?: string | null, order: number, user:
          | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
          | { __typename: 'WikidotUser', displayName: string }
         }>, alternateTitles: Array<{ title: string }> }
    | { __typename: 'WikidotPage', title: string, rating?: number | null, voteCount: number, tags: Array<string>, createdAt: string, thumbnailUrl?: string | null, summary?: string | null, url: string, attributions: Array<{ type: PageAttributionType, date?: string | null, order: number, user:
          | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
          | { __typename: 'WikidotUser', displayName: string }
         }>, alternateTitles: Array<{ title: string }> }
  > };

export type SiteSpecificAuthorInfoByDiscordIdQueryVariables = Exact<{
  discordId: Scalars['String']['input'];
  siteUrl: Scalars['URL']['input'];
  siteUrlString: Scalars['String']['input'];
}>;


export type SiteSpecificAuthorInfoByDiscordIdQuery = { discordUserInfo: { account?: { wikidotIntegration?: { wikidotUser?: { __typename: 'WikidotUser', wikidotId: string, displayName: string, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null, userPage?: { url: string } | null, statistics?: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
                | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
                | { __typename: 'WikidotPage', title: string, rating?: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
               }> } } | null } | null } | null } };

export type AllSitesAuthorInfoByDiscordIdQueryVariables = Exact<{
  discordId: Scalars['String']['input'];
}>;


export type AllSitesAuthorInfoByDiscordIdQuery = { discordUserInfo: { account?: { wikidotIntegration?: { wikidotUser?: { __typename: 'WikidotUser', wikidotId: string, displayName: string, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null, statistics?: { rank: number, totalRating: number, meanRating: number, pageCount: number, pageCountScp: number, pageCountTale: number, pageCountGoiFormat: number, pageCountArtwork: number, pageCountLevel: number, pageCountEntity: number, pageCountObject: number } | null, attributedPages: { edges: Array<{ node:
                | { __typename: 'RuFoundationPage', url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
                | { __typename: 'WikidotPage', title: string, rating?: number | null, createdAt: string, tags: Array<string>, url: string, alternateTitles: Array<{ title: string }>, attributions: Array<{ date?: string | null }> }
               }> } } | null } | null } | null } };

export type UpdateDiscordGuildInfoMutationVariables = Exact<{
  input: UpdateDiscordGuildInfoInput;
}>;


export type UpdateDiscordGuildInfoMutation = { updateDiscordGuildInfo: { discordGuildInfo: { defaultSiteUrl: string } } };

export type UpdateDiscordUserInfoMutationVariables = Exact<{
  input: UpdateDiscordUserInfoInput;
}>;


export type UpdateDiscordUserInfoMutation = { updateDiscordUserInfo: { discordUserInfo: { defaultSiteUrl?: string | null } } };

export type GetGuildContextInfoQueryVariables = Exact<{
  userId: Scalars['String']['input'];
  guildId: Scalars['String']['input'];
}>;


export type GetGuildContextInfoQuery = { discordGuildInfo: { defaultSiteUrl: string }, discordUserInfo: { defaultSiteUrl?: string | null } };

export type GetDmContextInfoQueryVariables = Exact<{
  userId: Scalars['String']['input'];
}>;


export type GetDmContextInfoQuery = { discordUserInfo: { defaultSiteUrl?: string | null } };

export type GenerateSitesScriptQueryVariables = Exact<{ [key: string]: never; }>;


export type GenerateSitesScriptQuery = { sites: Array<{ platform: SitePlatform, type: SiteType, url: string, displayName: string, recentlyCreatedUrl?: string | null }> };

export type AttributionEmbedInfoFragment = { type: PageAttributionType, date?: string | null, order: number, user:
    | { __typename: 'UserWikidotNameReference', displayName: string, wikidotUser?: { userPage?: { url: string } | null, linkedAccount?: { patreonIntegration?: { isActive: boolean } | null } | null } | null }
    | { __typename: 'WikidotUser', displayName: string }
   };
