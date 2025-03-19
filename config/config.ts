import type {SummarizerConfiguration} from "../interfaces";

export const CONFIG: SummarizerConfiguration = {
    CONTEXT_LENGTH: parseInt(process.env.CONTEXT_LENGTH ?? '8096'),
    MODEL_NAME: process.env.MODEL_NAME ?? 'llama3.2',
    SUMMARY_MARKER: process.env.SUMMARY_MARKER ?? 'AI_SUMMARY',
    SUMMARY_PROMPT: process.env.SUMMARY_PROMPT ?? 'Summarize the given text: ',
};
