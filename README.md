<<<<<<< HEAD
# Antigravity HW1 - Lead Capture to CRM Workflow

This project contains the Antigravity workflow definitions for HW1. It sets up an end-to-end pipeline that takes a lead from an HTTP endpoint, maps the data, pushes it to a Mock CRM, and runs an AI completion to summarize the lead.

## Files Included
- \`workflow.json\`: Defines the nodes and their execution order (the Directed Acyclic Graph). Shows the structure of the workflow.
- \`logic.json\`: Defines exactly how each node operates, storing the API keys, mapping definitions, the HTTP endpoint paths, and the LLM prompts.

## Workflow Execution Flow
1. **WebhookTrigger (\`node-1-trigger\`)**: Listens on \`/api/webhook/lead-capture\` for a POST request. The expected payload is JSON containing \`name\`, \`email\`, and \`message\`.
2. **DataMapper (\`node-2-processing\`)**: Extracts the nested properties from the incoming HTTP request and formats them. Also attaches a timestamp.
3. **RestApiConnector (\`node-3-crm\`)**: A mock POST request connecting to a CRM API to save the captured lead.
4. **LLMCompletion (\`node-4-ai\`)**: Triggers an AI model to summarize the user's \`message\` to save time for the sales team.

## How to Test
To test this flow inside the Antigravity environment:
1. Load \`workflow.json\` and \`logic.json\` into the UI workflow builder.
2. Click **Run/Execute Workflow**.
3. Use a tool like Postman, cURL, or the built-in HTTP sender to POST data to the endpoint:
   \`\`\`bash
   curl -X POST http://localhost:PORT/api/webhook/lead-capture \\
     -H "Content-Type: application/json" \\
     -d '{"name": "Alice QA", "email": "alice@example.com", "message": "I found your product online and want to know about enterprise pricing."}'
   \`\`\`
4. Verify the node outputs within the Antigravity UI.
=======
# lead-capture-ai-pipeline
>>>>>>> 1be8f69c115c0cb8528c08a86900d06f4ad88e28
