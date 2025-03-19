import type {PaperlessDocument} from "./paperless-document.ts";

export interface PaperlessSearchResult {
    count?: number;
    next?: string;
    previous?: string;
    all?: number[];
    results?: PaperlessDocument[];
}
