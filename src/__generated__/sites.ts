const SITES = [
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-wiki.wikidot.com",
    "displayName": "SCP Wiki - English",
    "recentlyCreatedUrl": "https://scp-wiki.wikidot.com/new-pages-feed",
    "tagConfigUrl": "https://05command.wdfiles.com/local--code/tech-hub-tag-list-crom-search/1",
    "shortName": "scp-wiki-english"
  },
  {
    "platform": "WIKIDOT",
    "type": "WANDERERS_LIBRARY",
    "url": "http://wanderers-library.wikidot.com",
    "displayName": "The Wanderers' Library - English",
    "recentlyCreatedUrl": "https://wanderers-library.wikidot.com/system:most-recently-created",
    "tagConfigUrl": "https://wanderers-library.wdfiles.com/local--code/tagging-guide/1",
    "shortName": "the-wanderers-library-english"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-int.wikidot.com",
    "displayName": "SCP Wiki - International",
    "recentlyCreatedUrl": "https://scp-int.wikidot.com/system:recent-changes",
    "tagConfigUrl": null,
    "shortName": "scp-wiki-international"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-wiki-cn.wikidot.com",
    "displayName": "SCP Wiki - Chinese",
    "recentlyCreatedUrl": "https://scp-wiki-cn.wikidot.com/most-recently-created",
    "tagConfigUrl": null,
    "shortName": "scp-wiki-chinese"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://fondationscp.wikidot.com",
    "displayName": "SCP Wiki - French",
    "recentlyCreatedUrl": "https://fondationscp.wikidot.com/most-recently-created",
    "tagConfigUrl": null,
    "shortName": "scp-wiki-french"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-pl.wikidot.com",
    "displayName": "SCP Wiki - Polish",
    "recentlyCreatedUrl": "https://scp-pl.wikidot.com/ostatnio-stworzone",
    "tagConfigUrl": "https://scp-pl.wdfiles.com/local--code/tag-search/1",
    "shortName": "scp-wiki-polish"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://lafundacionscp.wikidot.com",
    "displayName": "SCP Wiki - Spanish",
    "recentlyCreatedUrl": "https://lafundacionscp.wikidot.com/recientemente-creados",
    "tagConfigUrl": "https://cuarteldelo5.wdfiles.com/local--code/tag-search-config/1",
    "shortName": "scp-wiki-spanish"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-jp.wikidot.com",
    "displayName": "SCP Wiki - Japanese",
    "recentlyCreatedUrl": "https://scp-jp.wikidot.com/new-pages-feed",
    "tagConfigUrl": null,
    "shortName": "scp-wiki-japanese"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scpko.wikidot.com",
    "displayName": "SCP Wiki - Korean",
    "recentlyCreatedUrl": "https://scpko.wikidot.com/most-recently-created",
    "tagConfigUrl": "https://scpko.wdfiles.com/local--code/toml-tag-list/1",
    "shortName": "scp-wiki-korean"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-th.wikidot.com",
    "displayName": "SCP Wiki - Thai",
    "recentlyCreatedUrl": "https://scp-th.wikidot.com/most-recently-created",
    "tagConfigUrl": null,
    "shortName": "scp-wiki-thai"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-wiki-de.wikidot.com",
    "displayName": "SCP Wiki - German",
    "recentlyCreatedUrl": "https://scp-wiki-de.wikidot.com/most-recently-created",
    "tagConfigUrl": null,
    "shortName": "scp-wiki-german"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://fondazionescp.wikidot.com",
    "displayName": "SCP Wiki - Italian",
    "recentlyCreatedUrl": null,
    "tagConfigUrl": null,
    "shortName": "scp-wiki-italian"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-ukrainian.wikidot.com",
    "displayName": "SCP Wiki - Ukrainian",
    "recentlyCreatedUrl": "https://scp-ukrainian.wikidot.com/most-recently-created",
    "tagConfigUrl": null,
    "shortName": "scp-wiki-ukrainian"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-pt-br.wikidot.com",
    "displayName": "SCP Wiki - Portuguese",
    "recentlyCreatedUrl": "https://scp-pt-br.wikidot.com/most-recently-created",
    "tagConfigUrl": null,
    "shortName": "scp-wiki-portuguese"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-cs.wikidot.com",
    "displayName": "SCP Wiki - Czech",
    "recentlyCreatedUrl": "https://scp-cs.wikidot.com/most-recently-created",
    "tagConfigUrl": "https://scp-cs.wdfiles.com/local--code/system:search-config/1",
    "shortName": "scp-wiki-czech"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-zh-tr.wikidot.com",
    "displayName": "SCP Wiki - Traditional Chinese",
    "recentlyCreatedUrl": "https://scp-zh-tr.wikidot.com/system:recent-changes",
    "tagConfigUrl": "https://scp-zh-tr.wdfiles.com/local--code/component:tag-search/1",
    "shortName": "scp-wiki-traditional-chinese"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-vn.wikidot.com",
    "displayName": "SCP Wiki - Vietnamese",
    "recentlyCreatedUrl": "https://scp-vn.wikidot.com/most-recently-created",
    "tagConfigUrl": "https://scp-vn.wdfiles.com/local--code/tag-guide/1",
    "shortName": "scp-wiki-vietnamese"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-ru.wikidot.com",
    "displayName": "SCP Wiki - Russian (old)",
    "recentlyCreatedUrl": "https://scp-ru.wikidot.com/most-recently-created",
    "tagConfigUrl": null,
    "shortName": "scp-wiki-russian-old"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-el.wikidot.com",
    "displayName": "SCP Wiki - Greek (unofficial)",
    "recentlyCreatedUrl": "https://scp-el.wikidot.com/most-recently-created",
    "tagConfigUrl": null,
    "shortName": "scp-wiki-greek-unofficial"
  },
  {
    "platform": "WIKIDOT",
    "type": "SCP_WIKI",
    "url": "http://scp-id.wikidot.com",
    "displayName": "SCP Wiki - Indonesian (unofficial)",
    "recentlyCreatedUrl": "https://scp-id.wikidot.com/new-pages-feed",
    "tagConfigUrl": null,
    "shortName": "scp-wiki-indonesian-unofficial"
  },
  {
    "platform": "WIKIDOT",
    "type": "WANDERERS_LIBRARY",
    "url": "http://wanderers-library-pl.wikidot.com",
    "displayName": "The Wanderers' Library - Polish",
    "recentlyCreatedUrl": "https://wanderers-library-pl.wikidot.com/system:most-recently-created",
    "tagConfigUrl": null,
    "shortName": "the-wanderers-library-polish"
  },
  {
    "platform": "WIKIDOT",
    "type": "WANDERERS_LIBRARY",
    "url": "http://wanderers-library-jp.wikidot.com",
    "displayName": "The Wanderers' Library - Japanese",
    "recentlyCreatedUrl": "https://wanderers-library-jp.wikidot.com/system:most-recently-created",
    "tagConfigUrl": null,
    "shortName": "the-wanderers-library-japanese"
  },
  {
    "platform": "WIKIDOT",
    "type": "WANDERERS_LIBRARY",
    "url": "http://wanderers-library-cs.wikidot.com",
    "displayName": "The Wanderers' Library - Czech",
    "recentlyCreatedUrl": "https://wanderers-library-cs.wikidot.com/system:most-recently-created",
    "tagConfigUrl": null,
    "shortName": "the-wanderers-library-czech"
  },
  {
    "platform": "WIKIDOT",
    "type": "WANDERERS_LIBRARY",
    "url": "http://wanderers-library-ko.wikidot.com",
    "displayName": "The Wanderers' Library - Korean",
    "recentlyCreatedUrl": "https://wanderers-library-ko.wikidot.com/system:most-recently-created",
    "tagConfigUrl": null,
    "shortName": "the-wanderers-library-korean"
  },
  {
    "platform": "WIKIDOT",
    "type": "WANDERERS_LIBRARY",
    "url": "http://wanderers-library-vn.wikidot.com",
    "displayName": "The Wanderers' Library - Vietnamese",
    "recentlyCreatedUrl": "https://wanderers-library-vn.wikidot.com/system:most-recently-created",
    "tagConfigUrl": "https://wanderers-library-vn.wikidot.com/tag-search/code/1",
    "shortName": "the-wanderers-library-vietnamese"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://backrooms-wiki.wikidot.com",
    "displayName": "The Backrooms - English",
    "recentlyCreatedUrl": "https://backrooms-wiki.wikidot.com/most-recently-created",
    "tagConfigUrl": "https://backrooms-oversight.wdfiles.com/local--code/crom-tags/1",
    "shortName": "the-backrooms-english"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://backrooms-vn.wikidot.com",
    "displayName": "The Backrooms - Vietnamese",
    "recentlyCreatedUrl": "https://backrooms-vn.wikidot.com/new-pages-feed",
    "tagConfigUrl": null,
    "shortName": "the-backrooms-vietnamese"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://pl-backrooms-wiki.wikidot.com",
    "displayName": "The Backrooms - Polish",
    "recentlyCreatedUrl": "https://pl-backrooms-wiki.wikidot.com/new-pages-feed",
    "tagConfigUrl": null,
    "shortName": "the-backrooms-polish"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://backrooms-wiki-cn.wikidot.com",
    "displayName": "The Backrooms - Chinese",
    "recentlyCreatedUrl": "https://backrooms-wiki-cn.wikidot.com/most-recently-created",
    "tagConfigUrl": "https://backrooms-oversight-cn.wdfiles.com/local--code/crom-search-tag-list/1",
    "shortName": "the-backrooms-chinese"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://fr-backrooms-wiki.wikidot.com",
    "displayName": "The Backrooms - French",
    "recentlyCreatedUrl": "https://fr-backrooms-wiki.wikidot.com/new-pages-feed",
    "tagConfigUrl": "https://fr-backrooms-wiki.wdfiles.com/local--code/crom-tags/1",
    "shortName": "the-backrooms-french"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://ru-backrooms-wiki.wikidot.com",
    "displayName": "The Backrooms - Russian",
    "recentlyCreatedUrl": "https://ru-backrooms-wiki.wikidot.com/new-pages-feed",
    "tagConfigUrl": null,
    "shortName": "the-backrooms-russian"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://pt-br-backrooms-wiki.wikidot.com",
    "displayName": "The Backrooms - Portuguese",
    "recentlyCreatedUrl": "https://pt-br-backrooms-wiki.wikidot.com/paginas-criadas-recentemente",
    "tagConfigUrl": null,
    "shortName": "the-backrooms-portuguese"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://es-backrooms-wiki.wikidot.com",
    "displayName": "The Backrooms - Spanish",
    "recentlyCreatedUrl": "https://es-backrooms-wiki.wikidot.com/new-pages-feed",
    "tagConfigUrl": null,
    "shortName": "the-backrooms-spanish"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://japan-backrooms-wiki.wikidot.com",
    "displayName": "The Backrooms - Japanese",
    "recentlyCreatedUrl": "https://japan-backrooms-wiki.wikidot.com/most-recently-created",
    "tagConfigUrl": null,
    "shortName": "the-backrooms-japanese"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://it-backrooms-wiki.wikidot.com",
    "displayName": "The Backrooms - Italian",
    "recentlyCreatedUrl": null,
    "tagConfigUrl": null,
    "shortName": "the-backrooms-italian"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://de-backrooms-wiki.wikidot.com",
    "displayName": "The Backrooms - German",
    "recentlyCreatedUrl": null,
    "tagConfigUrl": null,
    "shortName": "the-backrooms-german"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://id-backrooms-wiki.wikidot.com",
    "displayName": "The Backrooms - Indonesian",
    "recentlyCreatedUrl": "http://id-backrooms-wiki.wikidot.com/most-recently-created",
    "tagConfigUrl": null,
    "shortName": "the-backrooms-indonesian"
  },
  {
    "platform": "WIKIDOT",
    "type": "BACKROOMS",
    "url": "http://th-backrooms-wiki.wikidot.com",
    "displayName": "The Backrooms - Thai",
    "recentlyCreatedUrl": "https://th-backrooms-wiki.wikidot.com/most-recently-created",
    "tagConfigUrl": null,
    "shortName": "the-backrooms-thai"
  },
  {
    "platform": "WIKIDOT",
    "type": "CHAOS_INSURGENCY",
    "url": "http://ci-cn-wiki.wikidot.com",
    "displayName": "Chaos Insurgency - Chinese",
    "recentlyCreatedUrl": "https://ci-cn-wiki.wikidot.com/new-page/p/1",
    "tagConfigUrl": null,
    "shortName": "chaos-insurgency-chinese"
  },
  {
    "platform": "WIKIDOT",
    "type": "OTHER",
    "url": "http://nationarea.wikidot.com",
    "displayName": "The Nationarea",
    "recentlyCreatedUrl": "https://nationarea.wikidot.com/most-recently-pages",
    "tagConfigUrl": null,
    "shortName": "the-nationarea"
  }
] as const;

export default SITES;
