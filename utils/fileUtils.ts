import path from "node:path";
import fs from "node:fs";

/**
 * Saves a textual summary to a specified file. The file is named based on the given `id`
 * and stored at the provided `savePath` directory. If the directory does not exist, it is created.
 * If a file with the same name already exists, it will be overwritten.
 *
 * @param {number} id - A unique identifier used to name the summary file.
 * @param {string} summary - The summary content to be saved in the file.
 * @param {string} [savePath] - The directory where the summary file will be saved. If not provided, the default path is used.
 * @returns {void}
 */
export const saveSummaryToFile = (id: number, summary: string, savePath?: string): void => {
    const outPath = path.resolve(savePath || '');
    if (!fs.existsSync(outPath)) {
        fs.mkdirSync(outPath, {recursive: true});
    }
    const filePath = path.join(outPath, `${id}_summary.txt`);

    // Überprüft, ob die Datei existiert - falls ja, wird sie überschrieben
    fs.writeFileSync(filePath, summary, 'utf8');
}
