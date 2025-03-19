# Ollama AI document summarizer for PaperlessNGX

This is a document summarization application using BunJS and Ollama AI server to generate AI-powered summaries of
documents stored in a Paperless service.

This is a research project on how AI can be used to do useful stuff.
Feel free to use it, but use it at your own risk.

## Features

- Fetches documents from a specified Paperless URL.
- Generates AI-based summaries using the Ollama server with the specified model (llama3.2 by default).
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
    - `SUMMARY_PROMPT`: Sets the prompt for the summarizer (default is `Summarize the given text:`)
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

## Remove Generated Notes

If you need to remove AI-generated notes from your documents in Paperless, you can use the `cleanupnotes` script. This
script uses BunJS to identify and delete notes marked with a specific identifier (e.g., `SUMMARY_MARKER`, which is
`AI_SUMMARY` by default).

### Usage

To run the script, execute:

```bash
bun run cleanupnotes.ts <all|number>
```

- **`all`**: Deletes *all* AI-generated notes marked with the configured `SUMMARY_MARKER`.
- **`number`**: Deletes AI-generated notes on one *document*, where `number` is the ID of the document you want the
  script to process.

### Examples

1. **Delete all AI-generated notes:**

    ```bash
    bun run cleanupnotes.ts all
    ```

   This will find and delete all notes containing the `SUMMARY_MARKER` from every document in your Paperless library.

2. **Delete AI-generated notes from document 10:**

    ```bash
    bun run cleanupnotes.ts 10
    ```

   This will process document with the ID 10 and remove any notes that match the `SUMMARY_MARKER`.

### Considerations

- Ensure the `PAPERLESS_TOKEN` and `PAPERLESS_URL` environment variables are correctly configured.
- The `SUMMARY_MARKER` must match the marker used for generating summaries (`AI_SUMMARY` by default).
- If the operation encounters issues (e.g., malformed responses, invalid pagination), it will log errors without
  crashing the process.

### Practical Notes

- The script supports paginated requests for efficient processing of large document sets.
- Logs provide feedback on processed pages and deleted notes, making debugging easier.
- If you're running the script in a restricted environment, consider adjusting API request timing (default timeout is 30
  seconds).

## License

This project is open-source and available under the [MIT License]().

This project was created using `bun init` in bun v1.1.34. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
