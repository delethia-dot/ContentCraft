import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";

const platformSchema = z.enum(["instagram", "facebook", "tiktok", "youtube", "linkedin"]);
const contentTypeSchema = z.enum(["post", "reel", "story", "carousel", "long-form", "short", "image", "video"]);

export const contentRouter = router({
  generateIdeas: publicProcedure
    .input(
      z.object({
        platform: platformSchema,
        contentType: contentTypeSchema,
        niche: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const { platform, contentType, niche } = input;

      const platformGuide: Record<string, string> = {
        instagram: "visual, aesthetic, short captions, hashtags, reels-friendly",
        facebook: "community-driven, longer text, shareable, emotional",
        tiktok: "trending sounds, fast hooks, entertainment-first, Gen Z/Millennial",
        youtube: "SEO-optimized titles, educational or entertaining, longer format",
        linkedin: "professional, thought leadership, career insights, B2B",
      };

      // Format-specific output instructions
      const formatInstructions: Record<string, string> = {
        video: `For each scripted video idea, include a FULL SCRIPT with:
- "script": object with "intro" (hook, first 5-10 seconds), "scenes" (array of {sceneNumber, description, dialogue, duration}), "outro" (CTA, last 10-15 seconds)
- "estimatedDuration": e.g. "3-5 minutes"
- "productionNotes": brief notes on visuals, b-roll, or on-screen text`,
        carousel: `For each carousel idea, include:
- "slides": array of {slideNumber, headline, bodyText, visualDirection} — specify EVERY slide
- "slideCount": recommended number of slides (e.g. 7)
- "coverSlide": the first slide concept that makes people swipe
- "lastSlide": the CTA/save-worthy final slide`,
        image: `For each image/graphic idea, include:
- "imageConceptDetails": object with "composition" (what to show and how), "textOverlay" (exact copy to put on the image), "colorMood" (palette/mood direction), "style" (e.g. flat design, photo, illustration)
- "toolSuggestions": array of tool recommendations (e.g. Canva template type, Midjourney prompt idea)
- "captionHint": brief note on what caption to pair with this image`,
        short: `For each short-form video idea, include:
- "shortScript": object with "hook" (exact first 3 seconds), "keyPoints" (array of 3-5 bullet talking points), "closingLine" (last line before CTA)
- "estimatedDuration": e.g. "30-60 seconds"
- "trendAngle": trending format or sound style to use`,
        reel: `For each reel idea, include:
- "shortScript": object with "hook" (exact first 3 seconds), "keyPoints" (array of 3-5 bullet talking points), "closingLine" (last line before CTA)
- "estimatedDuration": e.g. "15-30 seconds"
- "trendAngle": trending audio or visual format to use`,
        "long-form": `For each long-form content idea, include:
- "outline": object with "intro" (angle/thesis), "sections" (array of {heading, keyPoints}), "conclusion" (summary + CTA)
- "estimatedLength": e.g. "800-1200 words" or "10-15 minutes"
- "seoAngle": keyword or search intent to target`,
        post: `For each post idea, include:
- "postStructure": object with "openingLine" (scroll-stopping first line), "mainContent" (2-3 paragraphs), "closingCTA" (engagement question or action)
- "visualSuggestion": what image or graphic to pair with this post`,
        story: `For each story idea, include:
- "storyFrames": array of {frameNumber, content, interactiveElement} (e.g. poll, question sticker, swipe-up)
- "frameCount": recommended number of frames (3-7)
- "goal": awareness | engagement | traffic | sales`,
      };

      const formatKey = contentType as string;
      const extraInstructions = formatInstructions[formatKey] ?? formatInstructions["post"];

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert social media content strategist and copywriter. Generate exactly 5 unique, high-quality content ideas with FULL format-specific details. Return ONLY valid JSON with no markdown.`,
          },
          {
            role: "user",
            content: `Generate 5 ${contentType} content ideas for ${platform} in the "${niche}" niche.
Platform style: ${platformGuide[platform]}

${extraInstructions}

Return JSON in this exact format — include ALL format-specific fields described above:
{
  "ideas": [
    {
      "id": "unique-string-id",
      "title": "Compelling content title",
      "hook": "Opening hook that stops the scroll (1-2 sentences)",
      "body": "Main content summary (2-3 sentences describing the idea)",
      "cta": "Clear call to action",
      "platform": "${platform}",
      "contentType": "${contentType}",
      "niche": "${niche}",
      "createdAt": "ISO date string",
      ... (include all format-specific fields as described above)
    }
  ]
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0].message.content as string;
      const parsed = JSON.parse(raw);

      // Ensure IDs are unique and dates are set
      const ideas = parsed.ideas.map((idea: any, index: number) => ({
        ...idea,
        id: `idea-${Date.now()}-${index}`,
        createdAt: new Date().toISOString(),
      }));

      return { ideas };
    }),

  analyzeUrl: publicProcedure
    .input(
      z.object({
        url: z.string().url(),
        niche: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { url, niche } = input;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert social media content analyst. Analyze content URLs and provide detailed resonance analysis. Return ONLY valid JSON with no markdown.`,
          },
          {
            role: "user",
            content: `Analyze this social media content URL: ${url}
${niche ? `Context: The creator is in the "${niche}" niche.` : ""}

Based on the URL structure, domain, and any available context, provide a comprehensive analysis.

Return JSON in this exact format:
{
  "id": "unique-id",
  "url": "${url}",
  "title": "Inferred or estimated content title",
  "platform": "instagram|facebook|tiktok|youtube|linkedin|unknown",
  "resonanceScore": 0-100,
  "whatWorked": ["point 1", "point 2", "point 3"],
  "whatDidntWork": ["point 1", "point 2"],
  "audienceInsights": "Detailed paragraph about why this content resonated or didn't with the target audience",
  "frameworkRecommendation": "Recommended content framework (e.g., Hook-Story-Offer, AIDA, PAS) and why",
  "summary": "2-3 sentence executive summary of the analysis"
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0].message.content as string;
      const parsed = JSON.parse(raw);

      return {
        ...parsed,
        id: `analysis-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
    }),

  getTrendingIdeas: publicProcedure
    .input(
      z.object({
        niche: z.string().min(1).max(100),
        platform: z.enum(["all", "instagram", "facebook", "tiktok", "youtube", "linkedin"]).default("all"),
      })
    )
    .mutation(async ({ input }) => {
      const { niche, platform } = input;
      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const platformFilter = platform === "all" ? "across all platforms (Instagram, Facebook, TikTok, YouTube, LinkedIn)" : `specifically for ${platform}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a social media trend analyst with deep knowledge of viral content patterns. Today is ${today}. Return ONLY valid JSON with no markdown.`,
          },
          {
            role: "user",
            content: `Generate 10 trending content ideas for ${today} ${platformFilter} in the "${niche}" niche.

Consider current cultural moments, seasonal trends, platform algorithm preferences, and what's resonating with audiences right now.

Return JSON in this exact format:
{
  "ideas": [
    {
      "id": "unique-id",
      "title": "Trending content idea title",
      "description": "2-3 sentence description of the idea and why it's trending",
      "platform": "instagram|facebook|tiktok|youtube|linkedin",
      "trendScore": 60-99,
      "niche": "${niche}",
      "contentType": "post|reel|story|carousel|long-form|short",
      "date": "${new Date().toISOString()}"
    }
  ]
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0].message.content as string;
      const parsed = JSON.parse(raw);

      const ideas = parsed.ideas.map((idea: any, index: number) => ({
        ...idea,
        id: `trend-${Date.now()}-${index}`,
        date: new Date().toISOString(),
      }));

      return { ideas, generatedAt: new Date().toISOString() };
    }),

  generatePrompt: publicProcedure
    .input(
      z.object({
        tool: z.string(), // preset tool id OR custom tool name
        mediaType: z.enum(["image", "video"]),
        style: z.string(),
        mood: z.string(),
        subject: z.string(),
        platform: platformSchema,
        aspectRatio: z.string(),
        niche: z.string().optional(),
        additionalDetails: z.string().optional(),
        isCustomTool: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { tool, mediaType, style, mood, subject, platform, aspectRatio, niche, additionalDetails } = input;

      const toolGuides: Record<string, string> = {
        midjourney: "Use Midjourney v6 syntax: descriptive subject, style keywords, lighting, camera, --ar ratio, --style raw, --v 6",
        dalle: "Use DALL-E 3 syntax: clear descriptive prose, specify art style, lighting, composition, mood",
        sora: "Use OpenAI Sora syntax: describe scene, camera movement, duration, lighting, cinematic style",
        runway: "Use Runway Gen-3 syntax: describe visual scene, motion direction, camera angle, atmosphere",
        "stable-diffusion": "Use Stable Diffusion syntax: subject, style tags, quality boosters like (masterpiece:1.2), negative prompts",
        kling: "Use Kling AI syntax: describe scene cinematically, include camera movement, lighting, and mood",
      };

      // For custom tools, research their known syntax; otherwise use generic best practices
      const toolSyntaxGuide = input.isCustomTool
        ? `Research and apply the known prompt syntax and best practices for "${tool}". If you know this tool's specific syntax (e.g., Ideogram uses style tags, Adobe Firefly uses descriptive natural language, Pika uses motion descriptors), apply it. If unknown, use clear descriptive natural language with subject, style, lighting, mood, and composition details.`
        : (toolGuides[tool] ?? `Use clear descriptive language optimized for ${tool}`);

      const platformVisuals: Record<string, string> = {
        instagram: "square or portrait 4:5, vibrant colors, lifestyle aesthetic, high contrast",
        facebook: "landscape 1.91:1 or square, clean and clear, community-friendly",
        tiktok: "vertical 9:16, bold visuals, high energy, trend-aware",
        youtube: "16:9 landscape, cinematic quality, thumbnail-worthy composition",
        linkedin: "professional, clean, 1.91:1 or square, business context",
      };

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert AI prompt engineer specializing in ${mediaType} generation. You craft precise, detailed prompts that produce stunning results. Return ONLY valid JSON with no markdown.`,
          },
          {
            role: "user",
            content: `Create an optimized ${mediaType} generation prompt for ${tool}.

Details:
- Subject: ${subject}
- Style: ${style}
- Mood: ${mood}
- Platform: ${platform} (${platformVisuals[platform]})
- Aspect Ratio: ${aspectRatio}
${niche ? `- Niche: ${niche}` : ""}
${additionalDetails ? `- Additional: ${additionalDetails}` : ""}

Tool syntax guide: ${toolSyntaxGuide}

Return JSON in this exact format:
{
  "mainPrompt": "The complete optimized prompt ready to paste into ${tool}",
  "negativePrompt": "Negative prompt (for tools that support it, otherwise empty string)",
  "tips": ["Tip 1 for best results", "Tip 2", "Tip 3"],
  "variations": ["Variation prompt 1 for a different angle", "Variation prompt 2"],
  "estimatedQuality": "Brief note on expected output quality and style"
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0].message.content as string;
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        id: `prompt-${Date.now()}`,
        tool,
        mediaType,
        subject,
        platform,
        createdAt: new Date().toISOString(),
      };
    }),

  generateCaption: publicProcedure
    .input(
      z.object({
        topic: z.string().min(1).max(200),
        platform: platformSchema,
        tone: z.enum(["professional", "casual", "witty", "inspirational", "educational"]),
        niche: z.string().optional(),
        includeHashtags: z.boolean().default(true),
        includeEmojis: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const { topic, platform, tone, niche, includeHashtags, includeEmojis } = input;

      const platformGuide: Record<string, string> = {
        instagram: "Max 2200 chars. Engaging opener, story-driven, 5-30 hashtags at end, emojis welcome",
        facebook: "Max 63,206 chars. Conversational, community-focused, 1-3 hashtags, emojis optional",
        tiktok: "Max 2200 chars. Short punchy, trending language, 3-5 hashtags, lots of emojis",
        youtube: "Max 5000 chars for description. SEO-optimized, include keywords, timestamps if relevant, 3-5 hashtags",
        linkedin: "Max 3000 chars. Professional tone, thought leadership, 3-5 hashtags, minimal emojis",
      };

      const toneGuide: Record<string, string> = {
        professional: "authoritative, credible, polished, business-appropriate",
        casual: "friendly, conversational, relatable, everyday language",
        witty: "clever, humorous, playful, memorable one-liners",
        inspirational: "motivating, uplifting, empowering, call-to-action focused",
        educational: "informative, clear, structured, value-driven",
      };

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert social media copywriter. Write platform-optimized captions that drive engagement. Return ONLY valid JSON with no markdown.`,
          },
          {
            role: "user",
            content: `Write a ${tone} ${platform} caption for the topic: "${topic}"
${niche ? `Niche: ${niche}` : ""}

Platform guide: ${platformGuide[platform]}
Tone: ${toneGuide[tone]}
${includeHashtags ? "Include relevant hashtags." : "No hashtags."}
${includeEmojis ? "Include relevant emojis naturally." : "No emojis."}

Return JSON in this exact format:
{
  "caption": "The full caption text ready to post",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "characterCount": 0,
  "tips": ["Tip 1 for this platform", "Tip 2"],
  "alternativeHook": "An alternative opening line for A/B testing"
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0].message.content as string;
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        id: `caption-${Date.now()}`,
        topic,
        platform,
        tone,
        characterCount: parsed.caption?.length ?? 0,
        createdAt: new Date().toISOString(),
      };
    }),

  researchHashtags: publicProcedure
    .input(
      z.object({
        niche: z.string().min(1).max(100),
        platform: platformSchema,
        topic: z.string().min(1).max(200),
        count: z.number().min(5).max(30).default(20),
      })
    )
    .mutation(async ({ input }) => {
      const { niche, platform, topic, count } = input;

      const platformHashtagGuide: Record<string, string> = {
        instagram: "Instagram hashtags: mix of niche (10k-500k posts), mid-range (500k-2M), and broad (2M+). Avoid banned hashtags.",
        facebook: "Facebook hashtags: 1-3 highly relevant hashtags. Broad reach over niche.",
        tiktok: "TikTok hashtags: mix trending (#fyp, #foryou) with niche-specific. 3-8 hashtags.",
        youtube: "YouTube hashtags: 3-5 descriptive hashtags in description. Focus on searchability.",
        linkedin: "LinkedIn hashtags: 3-5 professional industry hashtags. Focus on thought leadership.",
      };

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a social media hashtag strategist with deep knowledge of trending hashtags across platforms. Return ONLY valid JSON with no markdown.`,
          },
          {
            role: "user",
            content: `Research and suggest ${count} hashtags for a ${platform} post about "${topic}" in the "${niche}" niche.

Platform guide: ${platformHashtagGuide[platform]}

For each hashtag, estimate:
- reach: "low" (under 100k posts), "medium" (100k-1M), "high" (1M+)
- competition: "low", "medium", "high"
- relevance: 1-10 score

Return JSON in this exact format:
{
  "hashtags": [
    {
      "tag": "hashtagname",
      "reach": "low|medium|high",
      "competition": "low|medium|high",
      "relevance": 8,
      "category": "niche|trending|broad|branded"
    }
  ],
  "strategy": "Brief 2-sentence strategy for using these hashtags on ${platform}",
  "topPick": "The single best hashtag to prioritize and why"
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0].message.content as string;
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        id: `hashtags-${Date.now()}`,
        niche,
        platform,
        topic,
        generatedAt: new Date().toISOString(),
      };
    }),

  analyzePerformance: publicProcedure
    .input(
      z.object({
        platform: platformSchema,
        contentType: contentTypeSchema,
        niche: z.string(),
        title: z.string(),
        likes: z.number().min(0),
        views: z.number().min(0),
        shares: z.number().min(0),
        comments: z.number().min(0),
        resonanceScore: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { platform, contentType, niche, title, likes, views, shares, comments, resonanceScore } = input;

      const engagementRate = views > 0 ? (((likes + shares + comments) / views) * 100).toFixed(2) : "0";

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a social media analytics expert. Analyze post performance metrics and provide actionable insights. Return ONLY valid JSON with no markdown.`,
          },
          {
            role: "user",
            content: `Analyze this ${platform} post performance:

Post: "${title}"
Niche: ${niche}
Content Type: ${contentType}
Metrics:
- Views/Reach: ${views}
- Likes: ${likes}
- Shares: ${shares}
- Comments: ${comments}
- Engagement Rate: ${engagementRate}%
${resonanceScore !== undefined ? `- AI Resonance Score (predicted): ${resonanceScore}/100` : ""}

Return JSON in this exact format:
{
  "performanceRating": "excellent|good|average|below-average|poor",
  "performanceScore": 0-100,
  "engagementRate": "${engagementRate}%",
  "benchmarkComparison": "How this compares to typical ${platform} ${contentType} in the ${niche} niche",
  "strengths": ["What worked well based on the metrics"],
  "improvements": ["What to improve next time"],
  "aiAccuracy": ${resonanceScore !== undefined ? `"How accurate the AI prediction was vs actual performance"` : `null`},
  "nextPostTips": ["Specific tip 1 for next post", "Specific tip 2", "Specific tip 3"]
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0].message.content as string;
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        id: `perf-${Date.now()}`,
        platform,
        contentType,
        niche,
        title,
        likes,
        views,
        shares,
        comments,
        engagementRate,
        resonanceScore,
        createdAt: new Date().toISOString(),
      };
    }),

  analyzeCompetitor: publicProcedure
    .input(
      z.object({
        competitorHandle: z.string().min(1).max(200),
        platform: platformSchema,
        niche: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { competitorHandle, platform, niche } = input;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a content strategy advisor. IMPORTANT: You do NOT have access to social media platforms and cannot look up real account data, follower counts, or actual posts. You must NEVER fabricate or guess follower counts, engagement rates, or account-specific facts. Instead, provide genuinely useful strategic content advice based on the niche the user has told you they are in. Return ONLY valid JSON with no markdown.`,
          },
          {
            role: "user",
            content: `The user wants to study the ${platform} account "${competitorHandle}" as inspiration. Their own niche is "${niche}".

IMPORTANT: You cannot access ${platform} or any social media. Do NOT invent follower counts, engagement rates, or claim to know what this account actually posts. Instead, provide strategic content advice that would help someone in the "${niche}" niche compete effectively on ${platform}, using the handle name only as context for tone/branding.

Return JSON in this exact format:
{
  "competitorName": "The handle as provided",
  "platform": "${platform}",
  "disclaimer": "This analysis is AI-generated strategy advice based on your niche. It does not reflect real account data, follower counts, or actual posts from this account.",
  "contentPatterns": [
    {
      "pattern": "Pattern name relevant to ${niche} on ${platform}",
      "description": "Why this pattern works for this niche and platform",
      "frequency": "Recommended frequency for this type of content"
    }
  ],
  "topContentTypes": ["content type 1 for ${niche}", "content type 2", "content type 3"],
  "postingFrequency": "Recommended posting frequency for ${platform} in ${niche} niche",
  "engagementStrengths": ["What tends to drive engagement in ${niche} on ${platform}", "Strength 2", "Strength 3"],
  "contentGaps": ["Underserved content angle in ${niche}", "Opportunity 2", "Opportunity 3"],
  "differentiationStrategy": "How to stand out in the ${niche} space on ${platform}",
  "keyTakeaways": ["Actionable strategy 1", "Actionable strategy 2", "Actionable strategy 3"]
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0].message.content as string;
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        id: `competitor-${Date.now()}`,
        competitorHandle,
        platform,
        niche,
        analyzedAt: new Date().toISOString(),
      };
    }),

  getNicheIntelligence: publicProcedure
    .input(
      z.object({
        niche: z.string().min(1).max(100),
        platform: z.enum(["all", "instagram", "facebook", "tiktok", "youtube", "linkedin"]).default("all"),
      })
    )
    .mutation(async ({ input }) => {
      const { niche, platform } = input;
      const platformContext = platform === "all" ? "across all major social platforms (Instagram, TikTok, YouTube, Facebook, LinkedIn)" : `on ${platform}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior social media strategist. Provide genuinely useful niche intelligence to help content creators understand their competitive landscape and find strategic opportunities. IMPORTANT: You are working from AI training data, not live platform analytics. Be honest and insightful. Return ONLY valid JSON with no markdown.`,
          },
          {
            role: "user",
            content: `Provide comprehensive niche intelligence for someone creating content in the "${niche}" niche ${platformContext}.

Return JSON in this exact format:
{
  "nicheOverview": "2-3 sentence summary of this niche's content landscape and opportunity level",
  "competitorLandscape": {
    "dominantAccountTypes": ["Type of account that dominates (e.g. educators, entertainers, brands)", "Type 2", "Type 3"],
    "commonContentStyles": ["Content style commonly used in this niche", "Style 2", "Style 3"],
    "postingPatterns": "Typical posting frequency and timing patterns in this niche",
    "toneAndVoice": "The dominant tone and voice used by top creators in this niche"
  },
  "contentGaps": [
    {
      "gap": "Underserved topic or angle in this niche",
      "opportunity": "Why this is an opportunity and how to capitalize on it",
      "contentFormat": "Best format to use for this gap (e.g. carousel, short video)"
    }
  ],
  "audiencePainPoints": [
    {
      "painPoint": "A real struggle or question the audience has",
      "contentAngle": "How to address this in content"
    }
  ],
  "contentPillars": [
    {
      "pillar": "Core content theme name",
      "description": "What this pillar covers and why it matters for this niche",
      "exampleTopics": ["Example topic 1", "Example topic 2", "Example topic 3"]
    }
  ],
  "quickWins": ["Immediately actionable content idea 1", "Quick win 2", "Quick win 3"]
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0].message.content as string;
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        id: `niche-intel-${Date.now()}`,
        niche,
        platform,
        generatedAt: new Date().toISOString(),
      };
    }),

  getFrameworkAdvice: publicProcedure
    .input(
      z.object({
        frameworkId: z.string(),
        platform: platformSchema,
        niche: z.string(),
        topic: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { frameworkId, platform, niche, topic } = input;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert content strategist. Provide specific, actionable advice for applying content frameworks. Return ONLY valid JSON.`,
          },
          {
            role: "user",
            content: `Give me a specific example of applying the "${frameworkId}" framework for ${platform} in the "${niche}" niche${topic ? ` on the topic: "${topic}"` : ""}.

Return JSON:
{
  "example": {
    "step1": "Specific example for first step",
    "step2": "Specific example for second step",
    "step3": "Specific example for third step"
  },
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "estimatedEngagement": "High/Medium/Low with brief reason"
}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const raw = response.choices[0].message.content as string;
      return JSON.parse(raw);
    }),
});
