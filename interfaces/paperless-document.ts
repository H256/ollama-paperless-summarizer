import type {PaperlessNote} from "./paperless-note.ts";

/**
 * Interface für ein Dokument im paperless System.
 */
export interface PaperlessDocument {
    content?: string;
    created?: string;
    id?: number;
    title?: string;
    notes?: PaperlessNote[];
}
