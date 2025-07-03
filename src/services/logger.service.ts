import { LogEntry } from "@/types/log-entry";

export enum LogLevel {
  OFF = -1,
  DEBUG = 0,
  BREADCRUMB = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

const PLUGIN = "plugin:siyuan-tasks";
export const DEFAULT_LOGLEVEL =
  process.env.NODE_ENV === "production" ? LogLevel.ERROR : LogLevel.DEBUG;

export class LoggerService {
  private static logs: LogEntry[] = [];
  private static readonly MAX_LOGS = 20;

  constructor(
    private name: string,
    private verbosity: LogLevel = DEFAULT_LOGLEVEL
  ) {}

  get prefix() {
    if (process.env.NODE_ENV === "production") {
      return this.name ? `${PLUGIN}:${this.name} |` : `${PLUGIN} |`;
    } else {
      return this.name + " | ";
    }
  }

  private addLog(level: LogLevel, args: unknown[]) {
    const formattedArgs = args.map((arg) =>
      typeof arg === "object" ? JSON.stringify(arg) : arg
    );
    LoggerService.logs.push({
      timestamp: Date.now(),
      level,
      service: this.name,
      args: [...formattedArgs],
    });
    if (LoggerService.logs.length > LoggerService.MAX_LOGS) {
      LoggerService.logs.shift();
    }
  }

  private shouldOutputToConsole(level: LogLevel): boolean {
    return this.verbosity !== LogLevel.OFF && level >= this.verbosity;
  }

  addBreadcrumb(action: string, ...args: unknown[]) {
    if (this.shouldOutputToConsole(LogLevel.DEBUG)) {
      console.debug(this.prefix, action, ...args);
    }
    this.addLog(LogLevel.BREADCRUMB, [action]);
  }

  debug(...args: unknown[]) {
    if (this.shouldOutputToConsole(LogLevel.DEBUG)) {
      console.debug(this.prefix, ...args);
    }
    this.addLog(LogLevel.DEBUG, args);
  }

  info(...args: unknown[]) {
    if (this.shouldOutputToConsole(LogLevel.INFO)) {
      console.info(this.prefix, ...args);
    }
    this.addLog(LogLevel.INFO, args);
  }

  warn(...args: unknown[]) {
    if (this.shouldOutputToConsole(LogLevel.WARN)) {
      console.warn(this.prefix, ...args);
    }
    this.addLog(LogLevel.WARN, args);
  }

  error(...args: unknown[]) {
    if (this.shouldOutputToConsole(LogLevel.ERROR)) {
      console.error(this.prefix, ...args);
    }
    this.addLog(LogLevel.ERROR, args);
  }

  static clearLogs() {
    LoggerService.logs = [];
  }

  static getLogs(): string[] {
    return LoggerService.logs.map((log) => {
      const timestamp = new Date(log.timestamp).toISOString();
      const level = LogLevel[log.level];
      const service = log.service ? `${log.service} |` : "";
      const message = log.args.join(" ");
      return `${timestamp} [${level}] ${service} ${message}`;
    });
  }
}

export const Logger = new LoggerService(PLUGIN, DEFAULT_LOGLEVEL);
