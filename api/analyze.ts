export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const taskData = await req.json();

    // 1. Get the Groq API Key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("Configuration Error: GROQ_API_KEY environment variable is not set in Vercel.");
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Server Configuration Error: GROQ_API_KEY not configured. Please add it to Vercel Environment Variables.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Prepare the prompt
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

    console.log("Calling Groq API with model: llama-3.3-70b-versatile");

    // 3. Call Groq API (OpenAI compatible format)
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a productivity expert analyzing user task data. Provide concise, actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
        top_p: 1
      }),
    });

    // Log response status for debugging
    console.log("Groq API Response Status:", groqResponse.status);

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq API Error:", groqResponse.status, errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `Groq API error (${groqResponse.status}): ${errorText}. Check your API key in Vercel Environment Variables.`
      }), {
        status: groqResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await groqResponse.json();
    
    // Groq returns data in OpenAI format
    const insight = data.choices?.[0]?.message?.content || 'Unable to generate insight';

    return new Response(JSON.stringify({
      success: true,
      insight: insight,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Analysis execution error:', error.message || error);
    return new Response(JSON.stringify({
      success: false,
      error: `Server error: ${error.message || 'Failed to generate insight'}. Check server logs for details.`,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}