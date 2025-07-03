import { TaskStatus, TaskPriority } from "../types/tasks";

/**
 * Service for analyzing task markdown and extracting task-related information.
 *
 * This service handles:
 * - Task status detection (todo/done)
 * - Priority detection from SiYuan emoji indicators
 * - Text extraction and cleaning
 * - Task analysis utilities
 *
 * Priority indicators (SiYuan emoji):
 * - ❗ (type ":!") = High priority (red single chevron up)
 * - ‼️ (type ":!!") = Urgent priority (red double chevron up)
 * - "low" = Low priority (green chevron down)
 * - No indicator = Normal priority (no icon)
 *
 * Example usage:
 * ```typescript
 * const analysis = TaskAnalysisService.analyzeTask("- [ ] ❗ Important task");
 * // Returns: { status: TaskStatus.TODO, priority: TaskPriority.HIGH, text: "Important task", hasPriority: true }
 * ```
 */
export class TaskAnalysisService {
  /**
   * Check if a task is a todo item (unchecked)
   */
  static isTodo(markdown: string): boolean {
    return /^-\s*\[ \]/.test(markdown);
  }

  /**
   * Check if a task is a done item (checked)
   */
  static isDone(markdown: string): boolean {
    return /^-\s*\[[xX]\]/.test(markdown);
  }

  /**
   * Detect task status from markdown
   */
  static detectStatus(markdown: string): TaskStatus {
    if (this.isTodo(markdown)) return TaskStatus.TODO;
    if (this.isDone(markdown)) return TaskStatus.DONE;
    return TaskStatus.ALL;
  }

  /**
   * Detect priority from markdown using SiYuan emoji indicators
   */
  static detectPriority(markdown: string): TaskPriority {
    const lowerMarkdown = markdown.toLowerCase();

    // Urgent priority: ‼️ (double exclamation)
    if (markdown.includes("‼️")) {
      return TaskPriority.URGENT;
    }

    // High priority: ❗ (single exclamation)
    if (markdown.includes("❗")) {
      return TaskPriority.HIGH;
    }

    // Low priority: "low"
    if (lowerMarkdown.includes("low")) {
      return TaskPriority.LOW;
    }

    return TaskPriority.NORMAL;
  }

  /**
   * Extract clean task text by removing priority indicators
   */
  static extractTaskText(taskText: string = ""): string {
    taskText = taskText.replace(/[❗‼️]/g, "").trim(); // Remove emoji indicators
    taskText = taskText.replace(/\blow\b/gi, "").trim(); // Remove "low" word

    return taskText;
  }

  /**
   * Check if a task has any priority indicator
   */
  static hasPriority(markdown: string): boolean {
    return this.detectPriority(markdown) !== TaskPriority.NORMAL;
  }

  /**
   * Get all task analysis data from markdown
   */
  static analyzeTask(markdown: string): {
    status: TaskStatus;
    priority: TaskPriority;
    text: string;
    hasPriority: boolean;
  } {
    const status = this.detectStatus(markdown);
    const priority = this.detectPriority(markdown);
    const text = this.extractTaskText(markdown);
    const hasPriority = this.hasPriority(markdown);

    return {
      status,
      priority,
      text,
      hasPriority,
    };
  }
}
