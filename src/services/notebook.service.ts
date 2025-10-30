import { lsNotebooks, getHPathByID, getDocInfo } from "../api";
import { Notebook } from "../types/tasks";
import { Logger } from "./logger.service";

export type IconRender =
  | { kind: "emoji"; text: string }
  | { kind: "image"; src: string };

export class NotebookService {
  private static notebooksCache: Notebook[] = [];
  private static docIconCache: Map<string, IconRender>;

  /**
   * Get notebook name by box ID
   */
  static async getNotebookName(boxId: string): Promise<string> {
    if (this.notebooksCache.length === 0) {
      await this.loadNotebooks();
    }

    const notebook = this.notebooksCache.find((nb) => nb.id === boxId);
    return notebook ? notebook.name : "Unknown Notebook";
  }

  /**
   * Get document path by document ID
   */
  static async getDocumentPath(docId: string): Promise<string> {
    if (!docId) return "Unknown Document";

    try {
      const response = await getHPathByID(docId);
      if (!response) return "Unknown Document";

      // Remove leading "/" if present
      return response.startsWith("/") ? response.slice(1) : response;
    } catch (err) {
      console.error("Error fetching document path:", err);
      return "Error/Unknown Document";
    }
  }

  /**
   * Load notebooks from the API
   */
  private static async loadNotebooks(): Promise<void> {
    try {
      const response = await lsNotebooks();
      this.notebooksCache = response.notebooks || [];
    } catch (err) {
      console.error("Error fetching notebooks:", err);
      this.notebooksCache = [];
    }
  }

  /**
   * Get notebook icon by box ID
   */
  static async getNotebookIcon(boxId: string): Promise<IconRender> {
    if (this.notebooksCache.length === 0) {
      await this.loadNotebooks();
    }

    const notebook = this.notebooksCache.find((nb) => nb.id === boxId);
    if (!notebook?.icon) return { kind: "emoji", text: "🗃" };

    // Convert Unicode code point to emoji
    return this.convertUnicodeToEmoji(notebook.icon);
  }

  /**
   * Get document icon by document ID
   */
  static async getDocumentIcon(docId: string): Promise<IconRender> {
    if (!docId) return { kind: "emoji", text: "📄" };
    try {
      // Simple in-memory cache for doc icons
      if (!this.docIconCache) this.docIconCache = new Map<string, IconRender>();
      if (this.docIconCache.has(docId)) {
        return this.docIconCache.get(docId)!;
      }

      const docInfo = await getDocInfo(docId);
      const iconCode = docInfo?.icon || docInfo?.ial?.icon;
      const icon: IconRender = iconCode
        ? this.convertUnicodeToEmoji(iconCode)
        : ({ kind: "emoji", text: "📄" } as const);
      this.docIconCache.set(docId, icon);
      return icon;
    } catch (err) {
      Logger.error(`Error fetching document icon: ${docId}`, err);
      return { kind: "emoji", text: "📄" };
    }
  }

  /**
   * Convert Unicode code point to emoji character
   * Examples: "1f970" -> "🥰", "1f4d3" -> "📓"
   */
  private static convertUnicodeToEmoji(unicode: string): IconRender {
    try {
      // Support custom emoji files like "apple.svg", "smile.png"
      const fileIconMatch = /^(?:[\w-]+)\.(svg|png|jpe?g|gif|webp)$/i.exec(
        unicode.trim()
      );
      if (fileIconMatch) {
        const safeName = unicode.trim();
        console.log(
          "plugin:siyuan-tasks",
          "fileIconMatch image",
          `/emojis/${safeName}`
        );
        return { kind: "image", src: `/emojis/${safeName}` };
      }

      // Normalize and handle various formats:
      // - "1f970"
      // - "U+1F970"
      // - "\\u1f970"
      // - "2600" (e.g., ☀)
      // - "2600-fe0f" (variation selector)
      // - "1f469-1f3fd" (skin tone sequences)

      const normalized = unicode.trim().toLowerCase();

      // If the input already contains non-hex characters (likely an emoji), return as-is
      // Acceptable separators are '-' (hyphen) and space, optional prefixes 'u+' or '\\u'
      const hexSequenceRegex =
        /^(?:u\+|\\u)?[0-9a-f]+(?:[-\s](?:u\+|\\u)?[0-9a-f]+)*$/i;
      if (!hexSequenceRegex.test(normalized)) {
        return { kind: "emoji", text: unicode };
      }

      // Split on hyphen or space to support sequences
      const parts = normalized.split(/[\-\s]+/).filter(Boolean);
      const codePoints: number[] = [];

      for (const part of parts) {
        const cleaned = part.replace(/^u\+|^\\u/i, "");
        const value = parseInt(cleaned, 16);
        if (!Number.isFinite(value)) continue;
        codePoints.push(value);
      }

      if (codePoints.length === 0) return { kind: "emoji", text: unicode };
      return { kind: "emoji", text: String.fromCodePoint(...codePoints) };
    } catch (error) {
      console.warn(`Failed to convert Unicode ${unicode} to emoji:`, error);
      return { kind: "emoji", text: "🗃" }; // Fallback to default icon
    }
  }

  /**
   * Clear the notebooks cache (useful for testing or when data might be stale)
   */
  static clearCache(): void {
    this.notebooksCache = [];
  }

  /**
   * Get all notebooks (for debugging or other uses)
   */
  static getNotebooks(): Notebook[] {
    return [...this.notebooksCache];
  }
}
