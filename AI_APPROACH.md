# AI Approach

This document explains how AI is integrated into the Meeting Intelligence Service, including prompt design, citation strategy, hallucination prevention, output validation, and known limitations.

---

## AI Provider

- **Provider:** Groq
- **Model:** `llama-3.3-70b-versatile`
- **Temperature:** `0.1` (low, for deterministic and grounded output)
- **Response format:** `{ type: "json_object" }` (enforces valid JSON)

---

## Prompt Design

The AI analysis uses a two-message approach:

### System Prompt
The system prompt establishes strict rules for the model:

```
You are a meeting analysis assistant. Your task is to analyze meeting transcripts 
and extract structured insights.

CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:
1. ONLY use information that is EXPLICITLY stated in the transcript.
2. DO NOT invent, hallucinate, or infer any information not directly present.
3. DO NOT create attendees, action items, decisions, or outcomes not explicitly mentioned.
4. Every insight MUST include at least one citation with the exact timestamp.
5. Citations must reference EXACT timestamps that appear in the transcript.
6. If the transcript doesn't contain enough information for a category, return an empty array.
```

### User Prompt
The user prompt provides the formatted transcript:

```
Analyze the following meeting transcript and extract insights. 
Remember: ONLY reference information explicitly present in the transcript.

Transcript:
[00:10] John: We should launch next Friday.
[00:20] Alice: I will prepare release notes.
```

### Output Schema
The model is instructed to return a specific JSON structure:
```json
{
  "summary": [{ "text": "...", "citations": [{ "timestamp": "00:10" }] }],
  "actionItems": [{ "task": "...", "assignee": "...", "dueDate": null, "citations": [...] }],
  "decisions": [{ "text": "...", "citations": [...] }],
  "followUps": [{ "text": "...", "citations": [...] }]
}
```

---

## Citation Strategy

Every generated insight **must** include at least one citation referencing the transcript segment(s) from which it was derived.

### How Citations Work
1. The transcript is formatted with timestamps: `[00:10] John: We should launch next Friday.`
2. The model is instructed to cite exact timestamps from the transcript
3. Each citation is an object: `{ "timestamp": "00:10" }`
4. Post-processing validates that every cited timestamp exists in the actual transcript

### Citation Validation (Post-Processing)
After receiving the AI response, the system:
1. Collects all valid timestamps from the original transcript into a Set
2. For each generated insight, filters citations to only those with valid timestamps
3. **Removes any insight where all citations are invalid** — this ensures no unsupported content reaches the user

```javascript
const filterByCitations = (items) => {
  return items
    .map((item) => ({
      ...item,
      citations: item.citations.filter((c) => validTimestamps.has(c.timestamp))
    }))
    .filter((item) => item.citations.length > 0); // Remove items with no valid citations
};
```

---

## Hallucination Prevention

Multiple layers of defense against hallucination:

### Layer 1: Prompt Engineering
- Explicit "DO NOT invent" instructions in the system prompt
- Instructions to return empty arrays when information is not available
- Emphasis on "ONLY" and "EXPLICITLY stated" in multiple places

### Layer 2: Low Temperature
- Temperature set to `0.1` to minimize creative/random output
- Encourages the model to stick closely to the transcript content

### Layer 3: JSON Mode
- `response_format: { type: "json_object" }` ensures the model returns valid JSON
- Prevents free-form text that might contain hallucinated content

### Layer 4: Citation Validation
- All cited timestamps are verified against the actual transcript
- Content with invalid citations is stripped from the response
- Validation stats are logged for monitoring (raw count vs. validated count)

### Layer 5: Response Parsing Safety
- JSON parsing handles markdown code blocks that models sometimes add
- Graceful error handling if the response is malformed

---

## Output Validation Strategy

1. **Parse JSON** — Strip markdown fences if present, then `JSON.parse()`
2. **Validate structure** — Ensure `summary`, `actionItems`, `decisions`, `followUps` arrays exist
3. **Validate citations** — Cross-reference every cited timestamp against the transcript
4. **Remove invalid content** — Any insight with zero valid citations is removed
5. **Log validation metrics** — Track how many insights were generated vs. how many survived validation

---

## Known Limitations

### 1. Non-deterministic Output
Even with low temperature, LLM outputs can vary between runs. The same transcript may produce slightly different summaries or different levels of detail.

### 2. Implicit vs. Explicit Information
The model may occasionally extract implicit information (e.g., inferring a decision from a suggestion). Our strict citation validation mitigates this but cannot fully eliminate it.

### 3. Timestamp Granularity
Citations reference transcript entry timestamps, not specific words. If multiple topics are discussed in a single transcript entry, the citation covers the entire entry.

### 4. Assignee Detection
The model attempts to detect assignees from natural language ("I will do X" → assignee is the speaker). This heuristic may miss assignees in ambiguous phrasing.

### 5. Complex Transcripts
Very long transcripts may exceed token limits. The current implementation sends the full transcript in a single request. For production use, chunking strategies would be needed.

### 6. Language Support
The current prompt is English-only. Multi-language transcripts may produce inconsistent results.

### 7. Model Availability
The system depends on Groq's API availability. If Groq is down, the analyze endpoint will return an error rather than cached/fallback results.
