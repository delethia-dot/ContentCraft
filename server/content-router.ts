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
        tool: z.enum(["midjourney", "dalle", "sora", "runway", "stable-diffusion", "kling"]),
        mediaType: z.enum(["image", "video"]),
        style: z.string(),
        mood: z.string(),
        subject: z.string(),
        platform: platformSchema,
        aspectRatio: z.string(),
        niche: z.string().optional(),
        additionalDetails: z.string().optional(),
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

Tool syntax guide: ${toolGuides[tool]}

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
