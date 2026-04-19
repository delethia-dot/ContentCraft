import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";

// ─── Airtable API helpers ──────────────────────────────────────────────────────

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

function getAirtableToken(): string {
  const token = process.env.AIRTABLE_API_TOKEN;
  if (!token) throw new Error("AIRTABLE_API_TOKEN is not configured");
  return token;
}

async function airtableCreateRecord(
  baseId: string,
  tableName: string,
  fields: Record<string, unknown>
): Promise<{ id: string }> {
  const token = getAirtableToken();
  const url = `${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableName)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Airtable error (${res.status}): ${err}`);
  }
  const data = (await res.json()) as { id: string };
  return data;
}

async function airtableEnsureFields(
  baseId: string,
  tableName: string,
  fieldDefs: Array<{ name: string; type: string; options?: Record<string, unknown> }>
): Promise<void> {
  const token = getAirtableToken();
  // Get existing fields
  const metaUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) {
    console.warn("Could not fetch Airtable table metadata:", await metaRes.text());
    return;
  }
  const metaData = (await metaRes.json()) as { tables: Array<{ name: string; fields: Array<{ name: string }> }> };
  const table = metaData.tables.find((t) => t.name === tableName);
  if (!table) {
    console.warn(`Table "${tableName}" not found in base ${baseId}`);
    return;
  }
  const existingNames = new Set(table.fields.map((f) => f.name));

  // Create missing fields
  for (const fieldDef of fieldDefs) {
    if (!existingNames.has(fieldDef.name)) {
      const createUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${table.name}/fields`;
      // Airtable meta API requires tableId not name — find tableId
      const tableId = (metaData.tables.find((t) => t.name === tableName) as any)?.id;
      if (!tableId) continue;
      const createUrlById = `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields`;
      const createRes = await fetch(createUrlById, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: fieldDef.name, type: fieldDef.type, ...(fieldDef.options ? { options: fieldDef.options } : {}) }),
      });
      if (!createRes.ok) {
        console.warn(`Could not create field "${fieldDef.name}":`, await createRes.text());
      } else {
        console.log(`Created Airtable field: ${fieldDef.name}`);
      }
    }
  }
}

// ─── Field definitions for ContentCraft table ─────────────────────────────────

const CONTENTCRAFT_TABLE = "Table 1";
const CONTENTCRAFT_FIELDS: Array<{ name: string; type: string }> = [
  { name: "Type", type: "singleLineText" },
  { name: "Title", type: "singleLineText" },
  { name: "Platform", type: "singleLineText" },
  { name: "Niche", type: "singleLineText" },
  { name: "Content Type", type: "singleLineText" },
  { name: "Hook", type: "multilineText" },
  { name: "Body", type: "multilineText" },
  { name: "CTA", type: "multilineText" },
  { name: "Full Content", type: "multilineText" },
  { name: "Hashtags", type: "multilineText" },
  { name: "Caption", type: "multilineText" },
  { name: "Tool", type: "singleLineText" },
  { name: "Prompt", type: "multilineText" },
  { name: "Date Saved", type: "dateTime", options: { timeZone: "client", dateFormat: { name: "iso" }, timeFormat: { name: "24hour" } } } as any,
  { name: "Source", type: "singleLineText" },
];

// ─── BSW Content Calendar field names ─────────────────────────────────────────

const BSW_TABLE = "Content";

// ─── Router ───────────────────────────────────────────────────────────────────

export const airtableRouter = router({

  /**
   * Ensure all required columns exist in the ContentCraft table.
   * Called once from the app on first push to that base.
   */
  ensureContentCraftFields: publicProcedure.mutation(async () => {
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!baseId) throw new Error("AIRTABLE_BASE_ID is not configured");
    await airtableEnsureFields(baseId, CONTENTCRAFT_TABLE, CONTENTCRAFT_FIELDS);
    return { ok: true };
  }),

  /**
   * Push a saved idea to BSW Content Calendar (specific fields only).
   */
  pushIdeaToBSW: publicProcedure
    .input(
      z.object({
        title: z.string(),
        hook: z.string(),
        body: z.string(),
        cta: z.string(),
        fullContent: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const baseId = process.env.AIR_Table_Base_ID_BSW;
      if (!baseId) throw new Error("AIR_Table_Base_ID_BSW is not configured");

      const contentIdea = [
        input.hook,
        input.body,
        input.cta,
      ].filter(Boolean).join("\n\n");

      const record = await airtableCreateRecord(baseId, BSW_TABLE, {
        "Source": "ContentCraft",
        "Content Idea": contentIdea,
        "hook options": input.hook,
        "Date Created": new Date().toISOString().split("T")[0],
      });
      return { ok: true, recordId: record.id };
    }),

  /**
   * Push a saved caption to BSW Content Calendar.
   */
  pushCaptionToBSW: publicProcedure
    .input(
      z.object({
        caption: z.string(),
        hashtags: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const baseId = process.env.AIR_Table_Base_ID_BSW;
      if (!baseId) throw new Error("AIR_Table_Base_ID_BSW is not configured");

      const record = await airtableCreateRecord(baseId, BSW_TABLE, {
        "Source": "ContentCraft",
        "Captions CC": input.caption,
        "Hashtags CC": input.hashtags ?? "",
        "Date Created": new Date().toISOString().split("T")[0],
      });
      return { ok: true, recordId: record.id };
    }),

  /**
   * Push any saved item (idea, caption, analysis, prompt, visual) to the ContentCraft base.
   */
  pushToContentCraft: publicProcedure
    .input(
      z.object({
        type: z.enum(["idea", "caption", "analysis", "prompt", "visual"]),
        title: z.string(),
        platform: z.string().optional(),
        niche: z.string().optional(),
        contentType: z.string().optional(),
        hook: z.string().optional(),
        body: z.string().optional(),
        cta: z.string().optional(),
        fullContent: z.string().optional(),
        hashtags: z.string().optional(),
        caption: z.string().optional(),
        tool: z.string().optional(),
        prompt: z.string().optional(),
        dateSaved: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const baseId = process.env.AIRTABLE_BASE_ID;
      if (!baseId) throw new Error("AIRTABLE_BASE_ID is not configured");

      const fields: Record<string, unknown> = {
        "Source": "ContentCraft",
        "Type": input.type.charAt(0).toUpperCase() + input.type.slice(1),
        "Title": input.title,
      };
      if (input.platform) fields["Platform"] = input.platform;
      if (input.niche) fields["Niche"] = input.niche;
      if (input.contentType) fields["Content Type"] = input.contentType;
      if (input.hook) fields["Hook"] = input.hook;
      if (input.body) fields["Body"] = input.body;
      if (input.cta) fields["CTA"] = input.cta;
      if (input.fullContent) fields["Full Content"] = input.fullContent;
      if (input.hashtags) fields["Hashtags"] = input.hashtags;
      if (input.caption) fields["Caption"] = input.caption;
      if (input.tool) fields["Tool"] = input.tool;
      if (input.prompt) fields["Prompt"] = input.prompt;
      if (input.dateSaved) fields["Date Saved"] = input.dateSaved;

      const record = await airtableCreateRecord(baseId, CONTENTCRAFT_TABLE, fields);
      return { ok: true, recordId: record.id };
    }),
});
