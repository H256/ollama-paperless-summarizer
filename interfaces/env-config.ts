/**
 * Stellt die Umgebungs-Konfiguration für den API-Zugriff dar.
 */
export interface EnvConfig {
    apiKey: string;
    paperlessUrl: string;
    saveTxtSummary?: number;
    saveTxtPath?:string;
}
