export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  // 1. Check Request Method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 2. Parse Body
    const taskData = await req.json();

    // 3. Check API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Server Error: GEMINI_API_KEY is missing from Environment Variables.");
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Server Configuration Error: API Key missing' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Construct Prompt
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

    // 5. Call Google Gemini
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API Error:", geminiResponse.status, errorText);
      throw new Error(`Gemini API responded with ${geminiResponse.status}: ${errorText}`);
    }

    const data = await geminiResponse.json();
    const insight = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate insight';

    return new Response(JSON.stringify({
      success: true,
      insight: insight,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Analysis execution error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to generate insight',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}