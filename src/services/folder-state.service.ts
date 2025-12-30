import { getFile, putFile } from "../api";
import { Logger } from "./logger.service";

type FoldedDirsData = string[];

export class FolderStateService {
  private static readonly STORAGE_BASE_PATH =
    "/data/storage/petal/siyuan-tasks";
  private static readonly FOLDED_DIRS_FILE = "folded-dirs.json";

  private static readonly TODAY_TASKS_FOLDER_ID = "today-tasks-folder";

  /**
   * Get the file path for the folded directories list
   */
  private static getFoldedDirsFilePath(): string {
    return `${this.STORAGE_BASE_PATH}/${this.FOLDED_DIRS_FILE}`;
  }

  /**
   * Load the list of folded directory IDs
   */
  static async loadFoldedDirs(): Promise<string[]> {
    try {
      const filePath = this.getFoldedDirsFilePath();
      const data = await getFile<FoldedDirsData | FileNotFound>(filePath);

      // Handle 404 response which might be returned as a success object
      if (this.isFileNotFound(data)) {
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      // File doesn't exist or error - return empty list
      Logger.debug("loadFoldedDirs: error or no file", {
        error: String(error),
      });
      return [];
    }
  }

  private static isFileNotFound(data: unknown): data is FileNotFound {
    return (
      typeof data === "object" &&
      data !== null &&
      "code" in data &&
      (data as FileNotFound).code === 404
    );
  }

  /**
   * Save the list of folded directory IDs
   */
  static async saveFoldedDirs(foldedIds: string[]): Promise<void> {
    try {
      const filePath = this.getFoldedDirsFilePath();
      await putFile(
        filePath,
        false,
        new Blob([JSON.stringify(foldedIds)], { type: "application/json" })
      );
    } catch (error) {
      Logger.error("Failed to save folded directories:", error);
      throw error;
    }
  }

  /**
   * Check if a folder is expanded (not in the folded list)
   */
  static async isFolderExpanded(folderId: string): Promise<boolean> {
    const foldedIds = await this.loadFoldedDirs();
    return !foldedIds.includes(folderId);
  }

  /**
   * Set the expansion state of a folder
   * @param folderId The ID of the folder
   * @param isExpanded Whether the folder should be expanded (true) or folded (false)
   */
  static async setFolderExpanded(
    folderId: string,
    isExpanded: boolean
  ): Promise<void> {
    const foldedIds = await this.loadFoldedDirs();
    const set = new Set(foldedIds);

    if (isExpanded) {
      set.delete(folderId);
    } else {
      set.add(folderId);
    }

    await this.saveFoldedDirs(Array.from(set));
  }

  static async isTodayFolderExpanded(): Promise<boolean> {
    return this.isFolderExpanded(this.TODAY_TASKS_FOLDER_ID);
  }

  static async setTodayFolderExpanded(isExpanded: boolean): Promise<void> {
    return this.setFolderExpanded(this.TODAY_TASKS_FOLDER_ID, isExpanded);
  }
}
