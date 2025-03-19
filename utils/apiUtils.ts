import type {PaperlessDocument} from "../interfaces";

/**
 * Initializes and returns a Headers object with an Authorization token.
 *
 * @param {string} apiKey - A string representing the API key to be used for authorization.
 * @returns {Headers} A Headers object containing the Authorization header with the provided API key.
 */
export const initHeaders = (apiKey: string): Headers => {
    const headers = new Headers();
    headers.append('Authorization', `Token ${apiKey}`);
    return headers;
};

/**
 * Asynchronously fetches a document from the specified URL with the provided headers.
 * Sends an HTTP GET request to retrieve the document and returns its JSON content.
 * Throws an error if the request fails or if the response status is not OK.
 *
 * @param {string} url - The URL of the document to fetch.
 * @param {HeadersInit} headers - The headers to include in the request.
 * @returns {Promise<any>} A promise that resolves to the JSON content of the fetched document.
 * @throws {Error} If the HTTP request fails or the response status is not OK.
 */
export const fetchDocument = async (url: string, headers: HeadersInit) => {
    const response = await fetch(url, {method: 'GET', headers,});

    if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
    }

    return response.json();
};


/**
 * Sends a POST request to add a comment (note) to a specific document.
 *
 * @param {string} baseUrl - The base URL of the API.
 * @param {number} documentId - The ID of the document to which the note will be added.
 * @param {HeadersInit} headers - The headers to include in the fetch request.
 * @param {string} note - The content of the note to be added.
 * @returns {Promise<PaperlessDocument>} A promise that resolves to the updated document object.
 * @throws {Error} If the request fails or the response status is not OK.
 */
export const postComment = async (baseUrl: string, documentId: number, headers: HeadersInit, note: string): Promise<PaperlessDocument> => {
    const url = new URL(`${baseUrl}/documents/${documentId.toString()}/notes/`);
    const response = await fetch(url, {headers, method: 'POST', body: JSON.stringify({note})});
    if (!response.ok) {
        throw new Error(`Error during note posting-request: ${response.statusText}`);
    }
    return response.json();
};

/**
 * Deletes a specific comment (note) from a document via an HTTP DELETE request.
 *
 * @param {string} baseUrl - The base URL of the API.
 * @param {number} documentId - The unique identifier of the document containing the note.
 * @param {number} noteId - The unique identifier of the note to be deleted.
 * @param {HeadersInit} headers - The headers to include in the HTTP request.
 * @returns {Promise<number>} A promise that resolves to the HTTP status code of the response.
 * @throws {Error} If the HTTP DELETE request fails or receives a non-OK response.
 */
export const deleteComment = async (baseUrl: string, documentId: number, noteId: number, headers: HeadersInit): Promise<number> => {
    const url = new URL(`${baseUrl}/documents/${documentId.toString()}/notes/`);
    url.searchParams.append('id', noteId.toString());

    const response = await fetch(url, {headers, method: 'DELETE'});
    if (!response.ok) {
        throw new Error(`Error during note deletion-request: ${response.statusText}`);
    }
    return response.status;
}
