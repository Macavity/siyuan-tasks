import { lsNotebooks, getHPathByID } from "../api";
import { Notebook } from "../types/tasks";

export class NotebookService {
  private static notebooksCache: Notebook[] = [];

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
      return response || "Unknown Document";
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
