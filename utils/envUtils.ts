import type {EnvConfig} from "../interfaces";

const ERR_MISSING_ENV_VARIABLES = "The environment variables PAPERLESS_TOKEN and PAPERLESS_URL must be set in order to run the program.";

/**
 * Validates the presence of necessary environment variables required for application functionality.
 *
 * This function checks if the provided `apiKey` and `paperlessUrl` values are defined. If either of them
 * is missing or undefined, it throws an error indicating that required environment variables are not set.
 *
 * @param {string} [apiKey] - The API key for authentication purposes. This is an optional parameter.
 * @param {string} [paperlessUrl] - The URL for the Paperless component. This is an optional parameter.
 * @throws Will throw an error if either `apiKey` or `paperlessUrl` is undefined or missing.
 */
export const validateEnvironmentVariables = (apiKey?: string, paperlessUrl?: string): void => {
    if (!apiKey || !paperlessUrl) {
        throw new Error(ERR_MISSING_ENV_VARIABLES);
    }
};

/**
 * Retrieves and validates the necessary environment variables used within the application.
 *
 * This function reads environment variables, providing default values if necessary,
 * and validates that all required variables are properly set. It returns an object
 * containing the values of these environment variables, structured for application use.
 *
 * @returns {EnvConfig} An object containing the API key, Paperless URL, save text file path,
 *                      and save text summary flag extracted from the environment variables.
 * @throws {Error} If required environment variables are not properly set or invalid.
 */
export const getEnvironmentVariables = (): EnvConfig => {
    const apiKey = process.env.PAPERLESS_TOKEN ?? '';
    const paperlessUrl = process.env.PAPERLESS_URL ?? '';
    const saveTxtSummary = Number(process.env.OUTPUT_TXT) || 0;
    const saveTxtPath = process.env.OUTPUT_PATH ?? '';
    validateEnvironmentVariables(apiKey, paperlessUrl);

    return {apiKey, paperlessUrl, saveTxtPath, saveTxtSummary};
};
