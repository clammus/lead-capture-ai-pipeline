const express = require('express');
const fs = require('fs');
const { google } = require('googleapis');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const workflow = JSON.parse(fs.readFileSync('./workflow.json', 'utf8'));
const logic = JSON.parse(fs.readFileSync('./logic.json', 'utf8'));

const app = express();
app.use(express.json());

// Interpolate template strings {{ some.path }}
function interpolate(str, state) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{\{\s*([\w$.-]+)\s*\}\}/g, (match, path) => {
    if (path.startsWith('$env.')) {
      const envKey = path.split('.')[1];
      return process.env[envKey] || '';
    }
    if (path === '$timestamp') {
      return new Date().toISOString();
    }
    const parts = path.split('.');
    let current = state;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return match; // Not found
      }
    }
    return current;
  });
}

function processObject(obj, state) {
  if (typeof obj === 'string') return interpolate(obj, state);
  if (Array.isArray(obj)) return obj.map(item => processObject(item, state));
  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = processObject(v, state);
    }
    return result;
  }
  return obj;
}

app.post('/api/webhook/lead-capture', async (req, res) => {
  const state = { incoming: { body: req.body } };
  console.log('Received POST at /api/webhook/lead-capture');
  console.log('Payload:', req.body);
  
  const triggerNode = workflow.nodes.find(n => n.type === 'WebhookTrigger');
  if (!triggerNode || !triggerNode.next || triggerNode.next.length === 0) {
      return res.status(500).json({ error: "Invalid workflow trigger" });
  }
  let currentNodeId = triggerNode.next[0];
  
  try {
    // Process nodes sequentially
    while (currentNodeId) {
      const nodeDef = workflow.nodes.find(n => n.id === currentNodeId);
      if (!nodeDef) break;
      
      const nodeConfig = logic.config[currentNodeId] || {};
      console.log(`Executing Output: ${nodeDef.id} (${nodeDef.type})`);
      
      if (nodeDef.type === 'DataMapper') {
        const mapped = {};
        for (const [key, value] of Object.entries(nodeConfig.mapping_rules)) {
          mapped[key] = interpolate(value, state);
        }
        state[nodeDef.id] = mapped;
        console.log(`Mapped Data:`, mapped);
      } 
      else if (nodeDef.type === 'Validator') {
        const input = processObject(nodeConfig.input, state);
        const { name, email, message } = input || {};
        let isValid = true;
        if (!name || !email || !message) isValid = false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) isValid = false;
        
        state[nodeDef.id] = { status: isValid ? "Valid" : "Invalid" };
        console.log(`Validation Status: ${state[nodeDef.id].status}`);
      } 
      else if (nodeDef.type === 'GoogleSheetsConnector') {
        const auth = new google.auth.GoogleAuth({
          keyFile: interpolate(nodeConfig.credentials_path, state) || './credentials.json',
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const sheets = google.sheets({ version: 'v4', auth });
        
        const data = processObject(nodeConfig.data, state);
        const spreadsheetId = interpolate(nodeConfig.spreadsheet_id, state);
        
        const range = interpolate(nodeConfig.range, state) || 'Leads!A:D';
        const request = {
          spreadsheetId,
          range: range,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [Object.values(data)],
          },
        };
        await sheets.spreadsheets.values.append(request);
        console.log(`Appended to Sheets successfully.`);
      }
      else if (nodeDef.type === 'LLMCompletion') {
         const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
         const model = genAI.getGenerativeModel({ model: nodeConfig.model || 'gemini-2.5-flash-lite' });
         
         const prompt = interpolate(nodeConfig.prompt, state);
         const result = await model.generateContent(prompt);
         let response = result.response.text();
         
         if (nodeConfig.parseJSON) {
           try {
             response = response.replace(/```json/gi, '').replace(/```/g, '').trim();
             const parsed = JSON.parse(response);
             state[nodeDef.id] = parsed;
             console.log('\n--- AI Analysis Response ---');
             console.log('Intent: ', parsed.Intent || 'Not Provided by AI');
             console.log('Urgency:', parsed.Urgency || 'Not Provided by AI');
             console.log('Summary:', parsed.Summary || 'Not Provided by AI');
             console.log('----------------------------\n');
           } catch (e) {
             state[nodeDef.id] = { Intent: "Unknown", Urgency: "Unknown", raw: response };
             console.log(`AI JSON Parse Error:`, e.message);
           }
         } else {
           state[nodeDef.id] = { summary: response };
           console.log(`AI Summary:\n${response}`);
         }
      }
      else if (nodeDef.type === 'SuccessTerminator') {
         console.log(`Workflow Complete.`);
         return res.status(200).json({ 
             success: true, 
             summary: state['node-4-ai']?.summary 
         });
      }
      
      // Move to next node
      currentNodeId = nodeDef.next && nodeDef.next.length > 0 ? nodeDef.next[0] : null;
    }
    
    // Fallback response
    if (!res.headersSent) {
       res.status(200).json({ success: true, state });
    }
  } catch (error) {
    console.error(`Error processing ${currentNodeId}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Runtime server active on port ${PORT}`);
});
