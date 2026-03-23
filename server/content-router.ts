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

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert social media content strategist. Generate exactly 5 unique, high-quality content ideas. Return ONLY valid JSON with no markdown.`,
          },
          {
            role: "user",
            content: `Generate 5 ${contentType} content ideas for ${platform} in the "${niche}" niche.
Platform style: ${platformGuide[platform]}

Return JSON in this exact format:
{
  "ideas": [
    {
      "id": "unique-string-id",
      "title": "Compelling content title",
      "hook": "Opening hook that stops the scroll (1-2 sentences)",
      "body": "Main content body with key points (2-4 sentences)",
      "cta": "Clear call to action",
      "platform": "${platform}",
      "contentType": "${contentType}",
      "niche": "${niche}",
      "createdAt": "ISO date string"
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
