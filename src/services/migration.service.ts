import { Plugin } from "siyuan";
import { Logger } from "./logger.service";
import { readDir, removeFile } from "../api";
import { STORAGE_NAME_V1, STORAGE_NAME_V2 } from "../constants";
import { PluginConfig } from "../stores/config.store";

export class MigrationService {
  private static readonly STORAGE_BASE_PATH = "/data/storage/petal/siyuan-tasks";

  static async migrateSettings(plugin: Plugin): Promise<void> {
    try {
      // readDir returns ReadDirEntry[] or throws on error
      const entries = await readDir(this.STORAGE_BASE_PATH);
      
      if (!entries) {
          Logger.debug("Storage directory not found or empty.");
          return;
      }

      // Check if V1 settings file exists
      const v1Exists = entries.some(entry => entry.name === STORAGE_NAME_V1);
      
      if (!v1Exists) {
        Logger.debug("V1 settings file not found, no migration needed.");
        return;
      }

      Logger.info("Migrating settings from V1 to V2...");
      
      // Load V1 settings
      const v1Settings = await plugin.loadData(STORAGE_NAME_V1) as PluginConfig;
      
      if (v1Settings && Object.keys(v1Settings).length > 0) {
        // Save as V2 settings
        await plugin.saveData(STORAGE_NAME_V2, v1Settings);
        Logger.info("Migration completed successfully.");

        // Remove V1 file
        try {
          const v1Path = `${this.STORAGE_BASE_PATH}/${STORAGE_NAME_V1}`;
          await removeFile(v1Path);
          Logger.info(`Removed old settings file: ${v1Path}`);
        } catch (removeError) {
          Logger.warn(`Failed to remove old settings file: ${removeError}`);
        }
      } else {
        Logger.warn("V1 settings file found but empty or invalid.");
      }
      
    } catch (error) {
      Logger.error("Failed to migrate settings:", error);
    }
  }
}
