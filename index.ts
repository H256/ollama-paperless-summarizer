import ollama from 'ollama';
import type {PaperlessSearchResult} from "./interfaces";
import {getEnvironmentVariables} from './utils/envUtils';
import {fetchDocument, initHeaders, postComment} from './utils/apiUtils';
import {saveSummaryToFile} from "./utils/fileUtils.ts";
import {CONFIG} from "./config/config.ts";

/**
 * Asynchronously generates a summary of the given text using a predefined model and prompt configuration.
 *
 * @param {string} text - The input text to summarize.
 * @param {boolean} [display=false] - Optional flag to indicate whether the summary should be displayed in real-time during streaming.
 * @returns {Promise<string>} - A promise that resolves to the summarized text.
 */
const summarizeText = async (text: string, display: boolean = false): Promise<string> => {
    const summary = await ollama.generate({
        model: CONFIG.MODEL_NAME,
        prompt: `${CONFIG.SUMMARY_PROMPT} ${text}`,
        stream: true,
        //options: {num_ctx: CONFIG.CONTEXT_LENGTH}
    });
    let summarizedText = '';
    for await (const part of summary) {
        summarizedText += part.response;
        if (display) process.stdout.write(part.response);
    }
    return summarizedText;
};

/**
 * Asynchronously processes document pages to identify and collect document IDs that lack AI-generated summaries.
 *
 * This function iterates through paginated document data retrieved from the provided base URL.
 * It checks each document's notes for a specific marker indicating the presence of an AI summary.
 * If the marker is absent, the ID of the document is added to a list for further processing.
 *
 * @param {string} baseUrl - The base URL used to fetch paginated document data.
 * @param {HeadersInit} headers - HTTP headers used for the fetch requests.
 * @returns {Promise<number[]>} A promise that resolves to an array of document IDs that lack AI-generated summaries.
 * @throws {Error} Throws an error if the network request fails or returns a response other than a 2xx status.
 */
const processDocumentPages = async (baseUrl: string, headers: HeadersInit) => {
    // we loop through all document pages and check the returned comments... if no ai summary is found, we add the id to process later
    let hasPages = true;
    let nextPage = `${baseUrl}/documents/?ordering=-id`
    const unsummarizedIds: number[] = []
    while (hasPages) {
        const response = await fetch(nextPage, {headers});
        if (!response.ok) {
            throw new Error(`Error on search request: ${response.statusText}`);
        }

        const page: PaperlessSearchResult = await response.json();

        if (!page.results) {
            continue;
        }

        for (const d of page.results) {
            if (!d.id) continue;
            const {notes} = d
            if (!notes || !notes.some(note => note.note?.includes(CONFIG.SUMMARY_MARKER))) {
                unsummarizedIds.push(d.id);
            }
        }

        if (!page.next) {
            hasPages = false;
        } else {
            nextPage = page.next;
            console.log(`Page processed...\n${unsummarizedIds.length} missing summaries found until now.\nContinue with next page on ${page.next}`);
        }


    }
    return unsummarizedIds;
}

/**
 * Main function that orchestrates the process of fetching unsummarized documents,
 * generating summaries, and posting the summaries back to the server. It also provides
 * optional functionality to save the summaries to a local file.
 *
 * @return {Promise<void>} A promise that resolves when the main processing tasks are completed.
 */
async function main(): Promise<void> {
    const envConfig = getEnvironmentVariables();
    const headers = initHeaders(envConfig.apiKey);

    const unsummarizedDocumentIds = await processDocumentPages(envConfig.paperlessUrl, headers);
    for (const id of unsummarizedDocumentIds) {
        console.log(`Processing document with ID ${id}...`);
        try {
            const document = await fetchDocument(`${envConfig.paperlessUrl}/documents/${id}/`, headers);
            const {content} = document;
            if (!content) {
                throw new Error('Malformed document content. Skipping document.');
            }

            const summary = await summarizeText(content);
            // jetzt noch pushen
            headers.set('Content-Type', 'application/json');

            console.log(`Posting document summary for document with ID ${id}...`)

            await postComment(
                envConfig.paperlessUrl,
                id,
                headers,
                `${summary}\n\nModel-Configuration:${JSON.stringify(CONFIG)}\n${CONFIG.SUMMARY_MARKER}`);

            if (envConfig.saveTxtSummary) {
                saveSummaryToFile(id, summary, envConfig.saveTxtPath);
            }

        } catch (error) {
            console.error(`Error while processing document ${id}:`, error);
        }
    }
}

main().catch(console.error);


