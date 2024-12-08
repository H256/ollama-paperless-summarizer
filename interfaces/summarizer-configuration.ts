/**
 * Interface representing the configuration settings for a summarizer.
 *
 * @property {number} [CONTEXT_LENGTH] - Optional. Specifies the length of the context to be considered for summarization.
 * @property {string} [DOC_URL_SEGMENT] - Optional. Specifies the URL segment for the documentation.
 * @property {string} MODEL_NAME - Specifies the name of the summarization model to be used.
 */
export interface SummarizerConfiguration {
    CONTEXT_LENGTH?: number;
    MODEL_NAME: string;
    SUMMARY_MARKER: string;
    SUMMARY_PROMPT: string;
}
