import { z } from 'zod';

export interface BraveSearchParams {
  query: string;
  count?: number;
  country?: string;
  freshness?: 'pd' | 'pw' | 'pm' | 'py';
  search_lang?: string;
}

export interface BraveSearchResult {
  query: string;
  count: number;
  country: string;
  freshness?: string;
  search_lang: string;
  results: unknown[];
}

const VALID_FRESHNESS_VALUES = ['pd', 'pw', 'pm', 'py'] as const;
const MAX_COUNT = 10;
const DEFAULT_COUNT = 4;
const DEFAULT_COUNTRY = 'ALL';
const DEFAULT_SEARCH_LANG = 'en-gb';
const FORBIDDEN_COUNTRY = 'CZ';

export const braveSearchInputSchema = z.object({
  query: z.string().describe('Search query (keywords, not nested)'),
  count: z.number().min(1).max(MAX_COUNT).optional().describe(`Results to return (max ${MAX_COUNT})`),
  country: z.string().optional().describe('2-char country code. Must not be "CZ" — use "ALL" instead'),
  freshness: z.enum(['pd', 'pw', 'pm', 'py']).optional().describe('Time filter'),
  search_lang: z.string().optional().describe('Language code'),
});

export function buildN8NRequestUrl(
  baseUrl: string,
  params: BraveSearchParams
): string {
  const url = new URL(baseUrl);

  if (!params.query || params.query.trim() === '') {
    throw new Error('Query parameter cannot be empty');
  }

  url.searchParams.set('query', params.query);

  const count = params.count !== undefined ? Math.min(params.count, MAX_COUNT) : DEFAULT_COUNT;
  url.searchParams.set('count', count.toString());

  const country = params.country || DEFAULT_COUNTRY;
  if (country === FORBIDDEN_COUNTRY) {
    throw new Error(`Country code "${FORBIDDEN_COUNTRY}" is not allowed. Use "${DEFAULT_COUNTRY}" instead.`);
  }
  url.searchParams.set('country', country);

  if (params.freshness) {
    if (!VALID_FRESHNESS_VALUES.includes(params.freshness)) {
      throw new Error(`Freshness must be one of: ${VALID_FRESHNESS_VALUES.join(', ')}`);
    }
    url.searchParams.set('freshness', params.freshness);
  }

  const searchLang = params.search_lang || DEFAULT_SEARCH_LANG;
  url.searchParams.set('search_lang', searchLang);

  return url.toString();
}

export async function handleBraveSearch(
  params: BraveSearchParams,
  n8nUrl: string,
  n8nToken: string
): Promise<BraveSearchResult> {
  const url = buildN8NRequestUrl(n8nUrl, params);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      Authorization: `Bearer ${n8nToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`n8n request failed with status ${response.status}`);
  }

  const data = await response.json() as unknown[];

  return {
    query: params.query,
    count: params.count || DEFAULT_COUNT,
    country: params.country || DEFAULT_COUNTRY,
    freshness: params.freshness,
    search_lang: params.search_lang || DEFAULT_SEARCH_LANG,
    results: data,
  };
}

export const braveSearchTool = {
  name: 'brave_web_search',
  description: 'Search the web using Brave Search. Returns relevant web pages, news, and information. Use for finding current information, news, facts, or researching topics.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (keywords, not nested)',
      },
      count: {
        type: 'number',
        description: `Results to return (max ${MAX_COUNT})`,
        minimum: 1,
        maximum: MAX_COUNT,
      },
      country: {
        type: 'string',
        description: '2-char country code. Must not be "CZ" — use "ALL" instead',
      },
      freshness: {
        type: 'string',
        enum: ['pd', 'pw', 'pm', 'py'],
        description: 'Time filter: "pd" (past day), "pw" (past week), "pm" (past month), "py" (past year)',
      },
      search_lang: {
        type: 'string',
        description: 'Language code',
      },
    },
    required: ['query'],
  },
};