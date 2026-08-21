export interface WordResult {
  id: number;
  reading: string;
  spellings: string[];
}

export interface IndexedWord extends WordResult {
  first: string;
  last: string;
}

export interface DictionaryMetadata {
  source: string;
  release: string;
  sourceUrl: string;
  sha256: string;
  generatedAt: string;
  wordCount: number;
}

export interface DictionaryIndex {
  metadata: DictionaryMetadata;
  byFirst: Record<string, IndexedWord[]>;
  byLast: Record<string, IndexedWord[]>;
}

export interface DictionaryIndexAsset {
  metadata: DictionaryMetadata;
  byFirst?: Record<string, IndexedWord[]>;
  byLast?: Record<string, IndexedWord[]>;
}

export interface SearchResponse {
  first: string | null;
  last: string | null;
  page: number;
  limit: number;
  total: number;
  pageCount: number;
  results: WordResult[];
  candidates: WordResult[];
}
