import type {PaperlessNote, PaperlessSearchResult} from "./interfaces";
import {getEnvironmentVariables} from './utils/envUtils';
import {deleteComment, fetchDocument, initHeaders} from './utils/apiUtils';
import {CONFIG} from "./config/config.ts";

const args = process.argv.slice(2);

if (args.length !== 1 || (args[0] !== 'all' && isNaN(parseInt(args[0], 10)))) {
    throw new Error('Usage: node script.js <all|number>');
}


const command = args[0];


/**
 * Asynchronously finds and deletes summaries based on a specified marker from documents retrieved from a paginated API.
 *
 * @param {string} baseUrl - The base URL of the API endpoint to retrieve documents.
 * @param {HeadersInit} headers - The headers to be included in the fetch request, such as authorization tokens or content types.
 * @returns {Promise<void>} Resolves when all found summaries have been processed and deleted, or when the operation is terminated.
 *
 * This function performs the following tasks:
 * 1. Iteratively fetches paginated document data from the specified API.
 * 2. Parses the returned JSON response and validates its structure.
 * 3. Identifies and filters summaries based on a predefined marker.
 * 4. Attempts to delete the identified summaries using a helper function (`deleteComment`).
 *
 * Key considerations:
 * - Each API request is time-limited to 30 seconds using an `AbortController`.
 * - Handles paginated responses by following the `next` field from the API, ensuring all pages are processed.
 * - Logs detailed error messages for failed API requests, invalid JSON responses, missing or malformed fields, and failed deletions.
 * - Prevents invalid `next` URLs by ensuring they conform to the base URL.
 *
 * Errors are logged directly, and the function will stop further processing if an invalid next-page URL is encountered.
 */
const findAndDeleteSummaries = async (baseUrl: string, headers: HeadersInit) => {
    // find all AI notes and delete them
    if (!CONFIG.SUMMARY_MARKER) {
        throw new Error('SUMMARY_MARKER is undefined');
    }

    let nextPage: string | null = `${baseUrl}/documents/?ordering=-id`
    while (nextPage) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
            const response = await fetch(nextPage, {headers, signal: controller.signal});
            if (!response.ok) {
                throw new Error(`Fehler bei der Suchanfrage: ${response.statusText}`);
            }

            let page: PaperlessSearchResult;
            try {
                page = await response.json();
            } catch (error) {
                console.error(`Failed to parse JSON response: ${error}`);
                return;
            }


            if (!page.results || !Array.isArray(page.results)) {
                console.error(`Invalid results format for page. Skipping page.`);
                continue;
            }

            for (const d of page.results) {
                const {notes} = d
                if (!d.id || !notes || !Array.isArray(d.notes)) {
                    console.error(`Skipping invalid document: ${JSON.stringify(d)}`);
                    continue;
                }

                await Promise.allSettled(
                    notes
                        .filter(note => typeof note.note === 'string' && note.note.includes(CONFIG.SUMMARY_MARKER))
                        .map(async note => {
                            try {
                                console.log(`Deleting note with ID ${note.id} for document with ID ${d.id}...`)
                                await deleteComment(baseUrl, d.id as number, note.id, headers);
                            } catch (error) {
                                console.error(`Error deleting note with ID ${note.id}: ${error}`);
                            }
                        })
                );

            }

            nextPage = page.next?.toString() || null;
            if (nextPage && !nextPage.startsWith(baseUrl)) {
                console.error(`Received invalid next page URL: ${nextPage}`);
                break;
            }
            console.log(`Page processed...\nContinue with next page on ${page.next}`);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.error('Request timeout');
            } else {
                throw error;
            }
        } finally {
            clearTimeout(timeout);
        }

    }
}

/**
 * Deletes AI-generated notes from a specific document in the Paperless system.
 * The method fetches all notes associated with the document, filters for those that include a specific marker,
 * and deletes them asynchronously.
 *
 * @param {string} paperlessUrl - The base URL of the Paperless API.
 * @param {number} documentId - The ID of the document from which AI-generated notes should be deleted.
 * @param {Headers} headers - The headers to include in the API requests, typically for authorization.
 *
 * @return {Promise<void>} A promise that resolves when all targeted notes have been processed, either deleted or skipped.
 */
async function deleteAiNotesAtDocument(paperlessUrl: string, documentId: number, headers: Headers): Promise<void> {
    let url = new URL(`${paperlessUrl}/documents/${documentId}/notes/`)
    console.log(`Checking for AI-Notes at document with ID ${documentId}`)
    let notes: PaperlessNote[];
    try {
        notes = await fetchDocument(url.toString(), headers);
    } catch (error) {
        console.error(`Failed to fetch notes for document ${documentId}: ${error}`);
        return;
    }

    if (!Array.isArray(notes)) {
        throw new Error(`Unexpected data format for notes at document ID ${documentId}`);
    }

    console.log(`Found ${notes?.length} notes at document with ID ${documentId}`)
    await Promise.allSettled(
        notes
            .filter(note => note.note?.includes(CONFIG.SUMMARY_MARKER))
            .map(async note => {
                try {
                    await deleteComment(paperlessUrl, documentId, note.id, headers);
                } catch (error) {
                    console.error(`Error deleting note with ID ${note.id}: ${error}`);
                }
            })
    );

}

/**
 * Main function to manage the deletion of summaries or AI-generated notes based on the provided input.
 * The function retrieves environment configurations, validates input parameters, and performs actions accordingly.
 * It supports deleting summaries for all documents or deleting notes for a specific document ID.
 *
 * @return {Promise<void>} A promise that resolves when the operation completes successfully or rejects with an error if validation or execution fails.
 */
async function main(): Promise<void> {
    const envConfig = getEnvironmentVariables();
    const headers = initHeaders(envConfig.apiKey);

    try {
        new URL(envConfig.paperlessUrl);
    } catch (error) {
        throw new Error(`Invalid Paperless API URL: ${envConfig.paperlessUrl}`);
    }


    if (!headers || typeof headers.append !== 'function') {
        throw new Error('Headers initialization failed. Ensure API key is valid.');
    }

    const documentId = parseInt(command, 10);
    if (command !== 'all' && (isNaN(documentId) || documentId <= 0)) {
        throw new Error('Invalid command. Use "all" or a positive number as document ID.');
    }

    if (command === 'all') {
        await findAndDeleteSummaries(envConfig.paperlessUrl, headers);
    } else {
        // process document id with notes
        await deleteAiNotesAtDocument(envConfig.paperlessUrl, parseInt(command || '-999'), headers)
    }
}

main().catch(console.error);


