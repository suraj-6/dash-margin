import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function scoreAnnotation(
  highlightedText: string,
  annotationText: string,
  annotationType: 'insight' | 'question' | 'challenge' | 'connection'
): Promise<{
  score: number;
  breakdown: {
    relevance: number;
    specificity: number;
    originality: number;
    reasoning: number;
  };
}> {

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-preview-05-20',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 256,
      responseMimeType: 'application/json'
    }
  });

  const prompt = `
You are evaluating the quality of a margin annotation on an article.

THE HIGHLIGHTED PASSAGE:
"${highlightedText}"

THE USER'S ANNOTATION (Type: ${annotationType}):
"${annotationText}"

Score this annotation on 4 dimensions (0-25 each):

1. RELEVANCE (0-25): How well does the annotation engage with the specific ideas in the highlighted passage? Does it reference specific concepts from the text?

2. SPECIFICITY (0-25): Is the annotation precise and specific, or vague and generic? Does it make a concrete point?

3. ORIGINALITY (0-25): Does the annotation add a new perspective, connection, or insight? Or is it obvious/surface-level?

4. REASONING (0-25): Is there clear logic or argumentation? Does the annotation explain WHY the user thinks this?

Respond ONLY in this exact JSON format with no additional text:
{
  "relevance": <number between 0-25>,
  "specificity": <number between 0-25>,
  "originality": <number between 0-25>,
  "reasoning": <number between 0-25>,
  "brief_explanation": "<one sentence explaining the overall score>"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse JSON response
    const parsed = JSON.parse(text);
    
    // Validate and clamp scores to 0-25 range
    const relevance = Math.min(25, Math.max(0, Number(parsed.relevance) || 0));
    const specificity = Math.min(25, Math.max(0, Number(parsed.specificity) || 0));
    const originality = Math.min(25, Math.max(0, Number(parsed.originality) || 0));
    const reasoning = Math.min(25, Math.max(0, Number(parsed.reasoning) || 0));
    
    return {
      score: relevance + specificity + originality + reasoning,
      breakdown: {
        relevance,
        specificity,
        originality,
        reasoning
      }
    };
  } catch (error) {
    console.error('Gemini scoring error:', error);
    // Return default scores on error
    return {
      score: 50,
      breakdown: {
        relevance: 12,
        specificity: 13,
        originality: 12,
        reasoning: 13
      }
    };
  }
}

// Alternative: Score multiple annotations in batch (more efficient)
export async function scoreAnnotationsBatch(
  annotations: Array<{
    id: string;
    highlightedText: string;
    annotationText: string;
    annotationType: 'insight' | 'question' | 'challenge' | 'connection';
  }>
): Promise<Map<string, number>> {
  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-preview-05-20',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  });

  const annotationsForPrompt = annotations.map((a, index) => `
ANNOTATION ${index + 1} (ID: ${a.id}):
Highlighted: "${a.highlightedText}"
Annotation (${a.annotationType}): "${a.annotationText}"
`).join('\n');

  const prompt = `
Score these ${annotations.length} margin annotations. For each, evaluate:
- RELEVANCE (0-25): Engagement with highlighted text
- SPECIFICITY (0-25): Precision vs vagueness  
- ORIGINALITY (0-25): New perspective vs obvious
- REASONING (0-25): Clear logic and argumentation

${annotationsForPrompt}

Respond in this exact JSON format:
{
  "scores": [
    { "id": "<annotation_id>", "total": <0-100>, "relevance": <0-25>, "specificity": <0-25>, "originality": <0-25>, "reasoning": <0-25> }
  ]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    
    const scoreMap = new Map<string, number>();
    parsed.scores.forEach((s: any) => {
      scoreMap.set(s.id, s.total);
    });
    
    return scoreMap;
  } catch (error) {
    console.error('Batch scoring error:', error);
    // Return default scores
    const scoreMap = new Map<string, number>();
    annotations.forEach(a => scoreMap.set(a.id, 50));
    return scoreMap;
  }
}

// Helper function to update user depth level based on their scores
export async function checkLevelUp(userId: string, supabase: any): Promise<boolean> {
  // Get user's current stats
  const { data: profile } = await supabase
    .from('profiles')
    .select('depth_level, articles_read, annotations_count')
    .eq('id', userId)
    .single();

  if (!profile) return false;

  // Get average quality score of user's annotations
  const { data: annotations } = await supabase
    .from('annotations')
    .select('quality_score')
    .eq('user_id', userId);

  if (!annotations || annotations.length === 0) return false;

  const avgScore = annotations.reduce((sum: number, a: any) => sum + (a.quality_score || 0), 0) / annotations.length;

  // Level up logic
  let newLevel = profile.depth_level;
  
  if (profile.depth_level === 0 && profile.articles_read >= 3) {
    newLevel = 1; // Reader → Highlighter
  } else if (profile.depth_level === 1 && profile.articles_read >= 5) {
    newLevel = 2; // Highlighter → Annotator
  } else if (profile.depth_level === 2 && avgScore >= 60 && profile.annotations_count >= 10) {
    newLevel = 3; // Annotator → Voice
  } else if (profile.depth_level === 3 && avgScore >= 75 && profile.annotations_count >= 30) {
    newLevel = 4; // Voice → Contributor
  }

  if (newLevel !== profile.depth_level) {
    await supabase
      .from('profiles')
      .update({ depth_level: newLevel })
      .eq('id', userId);
    return true;
  }

  return false;
}

// Utility: Check annotation quality before publishing (real-time feedback)
export async function quickQualityCheck(
  highlightedText: string,
  annotationText: string
): Promise<{
  isAcceptable: boolean;
  suggestion?: string;
}> {
  
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-preview-05-20',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 150,
      responseMimeType: 'application/json'
    }
  });

  const prompt = `
Quickly evaluate if this annotation is specific and meaningful:

HIGHLIGHTED TEXT: "${highlightedText}"
ANNOTATION: "${annotationText}"

Check:
1. Is the annotation at least 20 characters?
2. Does it relate to the highlighted text specifically?
3. Is it more than just "I agree" or "Nice point"?

Respond in JSON:
{
  "isAcceptable": true/false,
  "suggestion": "<brief improvement suggestion if not acceptable, null if acceptable>"
}
`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch {
    // Default to acceptable on error (don't block users)
    return { isAcceptable: true };
  }
}
