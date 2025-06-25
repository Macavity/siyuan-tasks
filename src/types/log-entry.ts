import { LogLevel } from "@/services/logger.service";

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  service: string | null;
  args: unknown[];
}
