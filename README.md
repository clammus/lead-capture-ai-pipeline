# Lead Capture AI Pipeline

This project contains the Antigravity workflow definitions. It sets up an end-to-end pipeline that captures a lead from an HTTP endpoint, maps the data, saves it to Google Sheets, and runs an AI completion to summarize the lead message.

## Files Included

- `workflow.json`: Defines the nodes and their execution order (the Directed Acyclic Graph).
- `logic.json`: Defines how each node operates, including field mappings, environment variable references, and the LLM prompt.
- `.env.example`: Template showing required environment variables.

## Workflow Execution Flow

1. **WebhookTrigger (`node-1-trigger`)**: Listens on `/api/webhook/lead-capture` for a POST request. Expected payload: `name`, `email`, `message`.
2. **DataMapper (`node-2-processing`)**: Extracts and formats the incoming data. Attaches a timestamp.
3. **GoogleSheetsConnector (`node-3-google-sheets`)**: Appends the captured lead as a new row in Google Sheets using a service account.
4. **LLMCompletion (`node-4-ai`)**: Calls Gemini API to generate a short summary of the lead message.

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:
GEMINI_API_KEY=
GOOGLE_SHEETS_ID=
GOOGLE_SERVICE_ACCOUNT_PATH=
## How to Test

1. Load `workflow.json` and `logic.json` into the Antigravity workflow builder.
2. Click **Run/Execute Workflow**.
3. Send a test request:

```bash
curl -X POST http://localhost:PORT/api/webhook/lead-capture \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com", "message": "I am interested in enterprise pricing."}'
```

4. Verify the node outputs in the Antigravity UI and check Google Sheets for the new row.
