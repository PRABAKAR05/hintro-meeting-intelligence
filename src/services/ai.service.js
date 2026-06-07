const Groq = require('groq-sdk');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * AI Service using Groq for meeting analysis.
 * Generates summaries, action items, decisions, and follow-ups
 * grounded in the provided transcript with citations.
 */

let groqClient = null;

const getClient = () => {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: config.groq.apiKey });
  }
  return groqClient;
};

/**
 * Build the transcript text for the prompt.
 */
const formatTranscript = (transcript) => {
  return transcript
    .map((entry) => `[${entry.timestamp}] ${entry.speaker}: ${entry.text}`)
    .join('\n');
};

/**
 * Build the system prompt for meeting analysis.
 * Strictly instructs the model to only use transcript content.
 */
const buildSystemPrompt = () => {
  return `You are a meeting analysis assistant. Your task is to analyze meeting transcripts and extract structured insights.

CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:
1. ONLY use information that is EXPLICITLY stated in the transcript. 
2. DO NOT invent, hallucinate, or infer any information not directly present in the transcript.
3. DO NOT create attendees, action items, decisions, or outcomes that are not explicitly mentioned.
4. Every insight you generate MUST include at least one citation with the exact timestamp from the transcript.
5. Citations must reference EXACT timestamps that appear in the transcript — do not create new timestamps.
6. If the transcript does not contain enough information for a category, return an empty array for that category.

You must respond with ONLY valid JSON in the following format (no markdown, no code blocks, no extra text):
{
  "summary": [
    {
      "text": "A concise summary point derived from the transcript",
      "citations": [{"timestamp": "exact timestamp from transcript"}]
    }
  ],
  "actionItems": [
    {
      "task": "Specific task mentioned in the transcript",
      "assignee": "Person who was assigned or volunteered (use exact name from transcript, or null if unspecified)",
      "dueDate": "Due date if explicitly mentioned (or null)",
      "citations": [{"timestamp": "exact timestamp from transcript"}]
    }
  ],
  "decisions": [
    {
      "text": "A decision that was explicitly made during the meeting",
      "citations": [{"timestamp": "exact timestamp from transcript"}]
    }
  ],
  "followUps": [
    {
      "text": "A follow-up action or topic that was explicitly discussed",
      "citations": [{"timestamp": "exact timestamp from transcript"}]
    }
  ]
}`;
};

/**
 * Validate that all cited timestamps exist in the transcript.
 * Removes content with invalid citations.
 */
const validateCitations = (analysis, transcript) => {
  const validTimestamps = new Set(transcript.map((entry) => entry.timestamp));

  const filterByCitations = (items) => {
    return items
      .map((item) => {
        const validCitations = (item.citations || []).filter((c) =>
          validTimestamps.has(c.timestamp)
        );
        return { ...item, citations: validCitations };
      })
      .filter((item) => item.citations.length > 0); // Remove items with no valid citations
  };

  return {
    summary: filterByCitations(analysis.summary || []),
    actionItems: filterByCitations(analysis.actionItems || []),
    decisions: filterByCitations(analysis.decisions || []),
    followUps: filterByCitations(analysis.followUps || []),
  };
};

/**
 * Parse the AI response, handling potential JSON formatting issues.
 */
const parseAIResponse = (responseText) => {
  // Strip markdown code blocks if present
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned);
};

/**
 * Analyze a meeting transcript using Groq AI.
 * @param {Array} transcript - Array of transcript entries
 * @param {string} traceId - Request trace ID for logging
 * @returns {object} Validated analysis with citations
 */
const analyzeMeeting = async (transcript, traceId = '') => {
  const client = getClient();
  const formattedTranscript = formatTranscript(transcript);

  logger.info('Starting AI meeting analysis', { traceId, transcriptLength: transcript.length });

  const chatCompletion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(),
      },
      {
        role: 'user',
        content: `Analyze the following meeting transcript and extract insights. Remember: ONLY reference information explicitly present in the transcript.\n\nTranscript:\n${formattedTranscript}`,
      },
    ],
    temperature: 0.1, // Low temperature for deterministic, grounded output
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const responseText = chatCompletion.choices[0]?.message?.content;

  if (!responseText) {
    throw new Error('Empty response from Groq AI');
  }

  logger.debug('Raw AI response received', { traceId, responseLength: responseText.length });

  // Parse and validate
  const rawAnalysis = parseAIResponse(responseText);
  const validatedAnalysis = validateCitations(rawAnalysis, transcript);

  // Log validation stats
  const rawCount =
    (rawAnalysis.summary?.length || 0) +
    (rawAnalysis.actionItems?.length || 0) +
    (rawAnalysis.decisions?.length || 0) +
    (rawAnalysis.followUps?.length || 0);
  const validCount =
    validatedAnalysis.summary.length +
    validatedAnalysis.actionItems.length +
    validatedAnalysis.decisions.length +
    validatedAnalysis.followUps.length;

  logger.info('AI analysis validated', {
    traceId,
    rawInsights: rawCount,
    validInsights: validCount,
    removed: rawCount - validCount,
  });

  return validatedAnalysis;
};

module.exports = { analyzeMeeting, validateCitations, parseAIResponse, formatTranscript };
