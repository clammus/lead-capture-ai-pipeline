# Lead Capture Pipeline Workflow
  
This pipeline handles incoming lead data from a webhook, processes it, saves it to Google Sheets, and uses an AI model to generate a summary of the lead's message.

## Steps

1. **Incoming Lead Form (WebhookTrigger)**
   - **Trigger Type:** Webhook
   - **Endpoint:** `POST /api/webhook/lead-capture`
   - **Description:** Listens for incoming POST requests containing lead details (`name`, `email`, `message`).

2. **Extract & Format Data (DataMapper)**
   - **Type:** DataMapper
   - **Description:** Maps the incoming HTTP payload to internal workflow variables. It extracts `name`, `email`, and `message`, and also generates a timestamp (`receivedAt`) for when the lead was captured.

3. **Push to Google Sheets (GoogleSheetsConnector)**
   - **Type:** GoogleSheetsConnector
   - **Description:** Appends the mapped lead data (Name, Email, Message, Date) as a new row in a designated Google Sheets spreadsheet using the credentials provided in the environment variables.

4. **Generate Lead Summary (LLMCompletion)**
   - **Type:** LLMCompletion
   - **Model:** Google Gemini (`gemini-2.5-flash-lite`)
   - **Description:** Sends the lead's name and message to the Gemini AI model with a prompt to act as a sales assistant and generate a brief, 1 or 2 sentence summary of the incoming message.

5. **Workflow Complete (SuccessTerminator)**
   - **Type:** SuccessTerminator
   - **Description:** Gracefully ends the pipeline execution after all previous steps are successfully completed.
