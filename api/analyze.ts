import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function: AI-Powered Task Analysis
 * Uses Google Gemini API to analyze user productivity
 * Endpoint: POST /api/analyze
 */

async function analyzeWithGemini(taskData: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const prompt = `Analyze this task completion data and provide 2-3 sentences of actionable insights. Be specific about patterns and recommendations.

Last 7 Days Summary:
- Total Tasks: ${taskData.totalTasks}
- Completed: ${taskData.completed}
- Missed: ${taskData.missed}
- Completion Rate: ${taskData.completionRate}%

Priority Breakdown:
- High Priority: ${taskData.highPriority} created, ${taskData.highCompleted} done (${taskData.highRate}%)
- Medium Priority: ${taskData.mediumPriority} created, ${taskData.mediumCompleted} done (${taskData.mediumRate}%)
- Low Priority: ${taskData.lowPriority} created, ${taskData.lowCompleted} done (${taskData.lowRate}%)

Daily Performance:
${taskData.dailyPerformance}

Provide actionable, specific insights about productivity patterns and recommendations.`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const insight = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate insight';
    return insight;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const taskData = req.body;

    // Validate required fields
    if (!taskData || typeof taskData !== 'object') {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    // Generate AI insight
    const insight = await analyzeWithGemini(taskData);

    res.status(200).json({
      success: true,
      insight: insight,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate insight',
    });
  }
}
