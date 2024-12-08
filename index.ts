import ollama from 'ollama';
import type {EnvConfig, PaperlessDocument, PaperlessSearchResult, SummarizerConfiguration} from "./interfaces";
import fs from 'node:fs';
import path from 'node:path';

/**
 * Error message indicating that essential environment variables are not set.
 *
 * This variable holds a string that specifies the environment variables
 * required for the program to operate correctly. Specifically, it states that
 * the environment variables PAPERLESS_TOKEN and PAPERLESS_URL must be set.
 *
 * If these environment variables are missing, the program will not execute
 * as expected, and this error message should be displayed to inform the user
 * about the missing configuration.
 */
const ERR_MISSING_ENV_VARIABLES = "The environment variables PAPERLESS_TOKEN and PAPERLESS_URL must be set in order to run the program.";
/**
 * SummarizerConfiguration object that defines the default settings for the text summarization process.
 *
 * @property {number} CONTEXT_LENGTH - The maximum length of the context in characters that the summarization model should process.
 * @property {string} MODEL_NAME - The name of the summarization model to be used.
 * @property {string} SUMMARY_MARKER - A marker or identifier used to denote the start of the summary in the text.
 * @property {string} SUMMARY_PROMPT - The default prompt prefixed to the text to guide the summarization model.
 */
const CONFIG: SummarizerConfiguration = {
    CONTEXT_LENGTH: 8096,
    MODEL_NAME: 'llama3.2',
    SUMMARY_MARKER: 'AI_SUMMARY',
    SUMMARY_PROMPT: 'Summarize the given text: '
};


/**
 * Retrieves and returns environment configuration variables required for the application.
 *
 * This function fetches environment variables such as `PAPERLESS_TOKEN`, `PAPERLESS_URL`,
 * `OUTPUT_TXT`, and `OUTPUT_PATH`, providing default values in case any of the variables
 * are not set. It also initializes several global configuration settings that are used
 * in different parts of the application.
 *
 * The function ensures that critical environment variables are validated through the
 * `validateEnvironmentVariables` function to ensure the application can function properly.
 *
 * @returns {EnvConfig} An object containing the retrieved and processed environment
 * configuration variables.
 */
const getEnvironmentVariables = (): EnvConfig => {
    const apiKey = process.env.PAPERLESS_TOKEN ?? '';
    const paperlessUrl = process.env.PAPERLESS_URL ?? '';
    const saveTxtSummary = Number(process.env.OUTPUT_TXT) ?? 0;
    const saveTxtPath = process.env.OUTPUT_PATH ?? '';
    validateEnvironmentVariables(apiKey, paperlessUrl);

    CONFIG.MODEL_NAME = process.env.MODEL_NAME ?? 'llama3.2';
    CONFIG.CONTEXT_LENGTH = parseInt(process.env.CONTEXT_LENGTH ?? '8096');
    CONFIG.SUMMARY_MARKER = process.env.SUMMARY_MARKER ?? 'AI_SUMMARY';
    CONFIG.SUMMARY_PROMPT = process.env.SUMMARY_PROMPT ?? 'Summarize the given text: ';

    return {apiKey, paperlessUrl, saveTxtPath, saveTxtSummary};
};


/**
 * Validates the presence of critical environment variables required for the application.
 *
 * This function checks whether the necessary environment variables 'apiKey' and 'paperlessUrl'
 * are provided. If either of the variables is missing, it throws an error indicating
 * the absence of required environment variables.
 *
 * @param {string} [apiKey] - The API key required for authentication.
 * @param {string} [paperlessUrl] - The URL for the paperless service.
 * @throws Will throw an error if either 'apiKey' or 'paperlessUrl' is not provided.
 */
const validateEnvironmentVariables = (apiKey?: string, paperlessUrl?: string) => {
    if (!apiKey || !paperlessUrl) {
        throw new Error(ERR_MISSING_ENV_VARIABLES);
    }
};


/**
 * Asynchronously fetches a document from a specified URL with optional headers.
 *
 * This function performs a network request to the provided URL using the fetch API.
 * It sends any headers provided in the request and expects a JSON response.
 * If the response is unsuccessful, it throws an error with the response's status text.
 *
 * @param {string} url - The URL to fetch the document from.
 * @param {HeadersInit} headers - An object containing any custom headers to include in the request.
 * @returns {Promise<PaperlessDocument>} A promise that resolves with the fetched document as a `PaperlessDocument` object.
 * @throws {Error} If the network request fails with a non-OK status.
 */
const fetchDocument = async (url: string, headers: HeadersInit): Promise<PaperlessDocument> => {
    const response = await fetch(url, {headers});
    if (!response.ok) {
        throw new Error(`Error on document fetch request: ${response.statusText}`);
    }
    return response.json();
};


/**
 * Asynchronously posts a comment to a specified URL.
 *
 * This function sends a POST request to the provided URL with the given headers and note content
 * formatted as JSON. It returns a promise that resolves to a PaperlessDocument object, representing
 * the response data upon a successful request. If the request fails, an error is thrown with the
 * relevant status information.
 *
 * @param {string} url - The endpoint to which the comment is to be posted.
 * @param {HeadersInit} headers - The headers to include in the POST request.
 * @param {string} note - The note content to post to the given URL.
 * @returns {Promise<PaperlessDocument>} A promise resolving to a PaperlessDocument if the request is successful.
 * @throws {Error} If the response status is not OK, indicating a failed request.
 */
const postComment = async (url: string, headers: HeadersInit, note: string): Promise<PaperlessDocument> => {
    const response = await fetch(url, {headers, method: 'POST', body: JSON.stringify({note})});
    if (!response.ok) {
        throw new Error(`Error during note posting-request: ${response.statusText}`);
    }
    return response.json();
};

/**
 * Initializes HTTP headers for a request with authorization.
 *
 * This function creates a new Headers object and appends an
 * authorization token to it. The token is constructed using
 * the provided API key.
 *
 * @param {string} apiKey - The API key to be used for authorization.
 * @returns {Headers} A Headers object containing the authorization token.
 */
const initHeaders = (apiKey: string): Headers => {
    const headers = new Headers();
    headers.append('Authorization', `Token ${apiKey}`);
    return headers;
};

/**
 * Asynchronously generates a summarized version of the given text.
 *
 * This function utilizes a model to process and condense the provided text into a summary.
 * Optionally, the generated summary can be displayed in real-time in the console output.
 *
 * @param text - The text to be summarized.
 * @param display - A boolean flag indicating whether the generated summary should be displayed in real-time during its construction. Defaults to false.
 * @returns A promise that resolves to a string containing the summarized text.
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
 * Asynchronously processes document pages to identify and return a list of document IDs
 * that lack an AI-generated summary. This function iterates through paginated document results
 * fetched from a specified URL and checks each document for the presence of a summary note.
 * If no summary is found, the document's ID is added to a list of unsummarized documents.
 *
 * @param {HeadersInit} headers - The headers to include in the request for fetching document pages.
 *
 * @returns {Promise<number[]>} A promise that resolves to an array of document IDs that do not have an AI-generated summary.
 *
 * @throws Will throw an error if the fetch request for a document page fails.
 */
const processDocumentPages = async (headers: HeadersInit) => {
    // we loop through all document pages and check the returned comments... if no ai summary is found, we add the id to process later

    let hasPages = true;
    let nextPage = `${envConfig.paperlessUrl}/documents/?ordering=-id`
    const unsummarizedIds: number[] = []
    while (hasPages) {
        const response = await fetch(nextPage, {headers});
        if (!response.ok) {
            throw new Error(`Fehler bei der Suchanfrage: ${response.statusText}`);
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
 * The main function orchestrates the processing and summarization of documents.
 * It initializes the necessary headers with an API key, processes document pages,
 * fetches each unsummarized document, generates a summary, and posts the summary
 * as a comment to the document. Additionally, it saves the summary to a file if configured.
 *
 * @return {Promise<void>} A Promise that resolves when all document processing is complete.
 */
async function main(): Promise<void> {
    const headers = initHeaders(envConfig.apiKey);

    const unsummarizedDocumentIds = await processDocumentPages(headers);
    for (const id of unsummarizedDocumentIds) {
        console.log(`Verarbeite Dokument mit ID ${id}...`);
        try {
            const document = await fetchDocument(`${envConfig.paperlessUrl}/documents/${id}/`, headers);
            const {content} = document;
            if (!content) {
                throw new Error('Antwort enthält nicht alle notwendigen Eigenschaften');
            }

            const summary = await summarizeText(content);
            // jetzt noch pushen
            headers.set('Content-Type', 'application/json');

            console.log(`Posting document summary for document with ID ${id}...`)

            await postComment(
                `${envConfig.paperlessUrl}/documents/${id}/notes/`,
                headers,
                `${summary}\n\nModel-Configuration:${JSON.stringify(CONFIG)}\n${CONFIG.SUMMARY_MARKER}`);

            if (envConfig.saveTxtSummary) {
                saveSummaryToFile(id, summary);
            }

        } catch (error) {
            console.error(`Fehler beim Verarbeiten des Dokuments mit ID ${id}:`, error);
        }
    }
}

/**
 * Saves a summary text to a file with a specific ID as the filename.
 * The file is created in the directory specified by the environment
 * configuration's saveTxtPath. If the directory does not exist, it
 * will be created. If the file already exists, it will be overwritten.
 *
 * @param {number} id - The unique identifier used to name the summary file.
 * @param {string} summary - The content to be written into the summary file.
 * @return {void}
 */
function saveSummaryToFile(id: number, summary: string): void {
    const outPath = path.resolve(envConfig.saveTxtPath || '');
    if (!fs.existsSync(outPath)) {
        fs.mkdirSync(outPath, {recursive: true});
    }
    const filePath = path.join(outPath, `${id}_summary.txt`);

    // Überprüft, ob die Datei existiert - falls ja, wird sie überschrieben
    fs.writeFileSync(filePath, summary, 'utf8');
}

/**
 * Represents the configuration settings derived from environment variables.
 *
 * envConfig is an instance of EnvConfig, which encapsulates environment-specific
 * settings for the application. The exact contents and structure of EnvConfig depend
 * on the implementation of `getEnvironmentVariables()` function, which gathers and
 * organizes environmental data essential for the application's runtime configuration.
 *
 * This variable is typically initialized at the application's startup to ensure
 * that all necessary environment configurations are readily available. It can be
 * used throughout the codebase to adapt the application behavior based on different
 * environments such as development, testing, and production.
 */
const envConfig: EnvConfig = getEnvironmentVariables();
main().catch(console.error);


