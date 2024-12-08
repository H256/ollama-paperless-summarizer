# Ollama AI document summarizer for PaperlessNGX
This is a document summarization application using BunJS and Ollama AI server to generate AI-powered summaries of documents stored in a Paperless service.

This is a research project on how AI can be used to do useful stuff.
Feel free to use it, but use it at your own risk.

## Features
- Fetches documents from a specified Paperless URL.
- Generates AI-based summaries using the Ollama server with the specified Llama model.
- Posts the generated summaries back to the Paperless service as comments.
- Supports saving the generated summaries locally as text files.

## Requirements
- Node.js and [BunJS](https://bun.sh/) installed.
- Access to a [Paperless](https://docs.paperless-ngx.com/) service API.
- Running instance of [Ollama](https://ollama.com/) AI server.

## Installation
1. **Clone the repository:**
``` bash
   git clone <repository-url>
   cd <project-directory>
```
1. **Install dependencies:**
   Make sure you have BunJS installed. Then run:
``` bash
   bun install
```
## Configuration
Set up the following environment variables:
- `PAPERLESS_TOKEN`: Your API token for authenticating with the Paperless service.
- `PAPERLESS_URL`: The base URL for your Paperless service.
- `OUTPUT_TXT`: Set to `1` if you want to save summaries as text files, otherwise `0`.
- `OUTPUT_PATH`: Directory path where text summaries should be saved (if `OUTPUT_TXT` is `1`).
- Optional: Override default values for the summarization model settings by setting:
    - `MODEL_NAME`: Specify the model to use (default is `llama3.2`).
    - `CONTEXT_LENGTH`: Set the max context length for the summarizer (default is `8096`).
    - `SUMMARY_MARKER`: Define a custom marker for identifying AI-generated summaries.

## Usage
To run the application and start processing documents, execute:
``` bash
bun run src/index.ts
```
The script will:
1. Fetch documents from Paperless service without an AI-generated summary.
2. Generate summaries using the configured AI model.
3. Post the generated summaries as comments on each document.
4. Optionally save summaries to the local file system.

## Resetting summaries
To reset a summary, simply remove all corresponding notes on the document, that
contain your `SUMMARY_MARKER`, wich is 'AI_SUMMARY' by default.

## Notes
- Ensure that your environment variables are correctly set up; otherwise, the script will throw an error.
- Ollama AI server should be running and configured with the required models to generate summaries.

## License
This project is open-source and available under the [MIT License]().

This project was created using `bun init` in bun v1.1.34. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
