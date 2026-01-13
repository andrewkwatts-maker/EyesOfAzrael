const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const https = require('https');

// Load .env file
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fsSync.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    }
  } catch (error) {
    // .env file not found
  }
}

loadEnv();

/**
 * Gemini Project Advisor
 *
 * Communicates with Gemini API to get technical advice and project management guidance.
 */

class GeminiAdvisor {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.conversationHistory = [];
  }

  async askGemini(prompt, context = '') {
    return new Promise((resolve, reject) => {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

      const data = JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          topP: 0.95
        }
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            if (response.error) {
              reject(new Error(response.error.message));
              return;
            }
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
            resolve(text);
          } catch (error) {
            reject(new Error(`Parse error: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(120000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(data);
      req.end();
    });
  }

  async getProjectContext() {
    const context = [];

    // Read CLAUDE.md
    try {
      const claudeMd = await fs.readFile(path.join(__dirname, '..', 'CLAUDE.md'), 'utf8');
      context.push('## Project Documentation (CLAUDE.md)\n' + claudeMd.substring(0, 3000));
    } catch {}

    // Read content audit report
    try {
      const auditReport = await fs.readFile(path.join(__dirname, '..', 'reports', 'content-standards-report.json'), 'utf8');
      const audit = JSON.parse(auditReport);
      context.push(`## Content Audit Summary
- Total Assets: ${audit.summary.total}
- Meets Standard: ${audit.summary.meetsStandard} (${audit.summary.percentageMeetsStandard}%)
- Needs Enhancement: ${audit.summary.needsEnhancement}`);
    } catch {}

    // Get git status
    try {
      const { execSync } = require('child_process');
      const gitStatus = execSync('git status --short', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
      context.push('## Git Status\n' + gitStatus.substring(0, 1000));
    } catch {}

    return context.join('\n\n');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const prompt = args.join(' ') || 'What should be the next priority for this mythology encyclopedia project?';

  const advisor = new GeminiAdvisor();

  if (!advisor.apiKey) {
    console.error('GEMINI_API_KEY not set in .env');
    process.exit(1);
  }

  console.log('Getting project context...\n');
  const context = await advisor.getProjectContext();

  console.log('Asking Gemini for advice...\n');
  console.log('Question:', prompt);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    const systemPrompt = `You are a technical advisor and project manager for "Eyes of Azrael", a mythology encyclopedia web application.

PROJECT CONTEXT:
${context}

You are helping to:
1. Review and improve content quality (aiming for 3+ pages per asset)
2. Ensure proper cross-linking between mythology entities
3. Maintain schema compliance and data integrity
4. Plan and prioritize enhancement tasks

Please provide specific, actionable advice. Be concise but thorough.`;

    const response = await advisor.askGemini(prompt, systemPrompt);
    console.log('GEMINI ADVISOR RESPONSE:\n');
    console.log(response);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { GeminiAdvisor };
