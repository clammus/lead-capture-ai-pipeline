# Lead Capture Pipeline Workflow
  
This pipeline handles incoming lead data from a webhook, processes it, validates its integrity, uses an AI model to analyze its intent and urgency, and finally saves the enriched record to Google Sheets.

## Steps

1. **Incoming Lead Form (WebhookTrigger)**
   - **Trigger Type:** Webhook
   - **Endpoint:** `POST /api/webhook/lead-capture`
   - **Description:** Listens for incoming POST requests containing lead details (`name`, `email`, `message`).

2. **Extract & Format Data (DataMapper)**
   - **Type:** DataMapper
   - **Description:** Maps the incoming HTTP payload to internal workflow variables. It extracts `name`, `email`, and `message`, and also generates a timestamp (`receivedAt`) for when the lead was captured.

3. **Validate Lead Data (Validator)**
   - **Type:** Validator
   - **Description:** Checks the extracted payload for missing fields (`name`, `email`, `message`) and runs a regex validation on the email address format. It adds a status of `Valid` or `Invalid` to the internal state without dropping the record.

4. **Analyze Intent and Urgency (LLMCompletion)**
   - **Type:** LLMCompletion
   - **Model:** Google Gemini (`gemini-2.5-flash-lite`)
   - **Description:** Sends the lead's message to the Gemini AI model and retrieves a structured JSON object containing exactly two keys: `Intent` (e.g., Sales, Support) and `Urgency` (e.g., High, Medium, Low).

5. **Push to Google Sheets (GoogleSheetsConnector)**
   - **Type:** GoogleSheetsConnector
   - **Description:** Appends the mapped lead data along with the new validation status, intent, and urgency as a new row (A:G) in a designated Google Sheets spreadsheet using the credentials provided in the environment variables.

6. **Workflow Complete (SuccessTerminator)**
   - **Type:** SuccessTerminator
   - **Description:** Gracefully ends the pipeline execution after all previous steps are successfully completed.
