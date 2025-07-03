import {
  TaskItem,
  TaskDisplayMode,
  GroupedTasks,
  TaskPriority,
} from "../types/tasks";
import { TaskAnalysisService } from "./task-analysis.service";

export class TaskProcessingService {
  /**
   * Compare two task arrays to see if they've changed
   */
  static hasTasksChanged(
    currentTasks: TaskItem[],
    newTasks: TaskItem[]
  ): boolean {
    // Quick length check
    if (currentTasks.length !== newTasks.length) {
      return true;
    }

    // Compare each task by ID and key properties
    for (let i = 0; i < currentTasks.length; i++) {
      const current = currentTasks[i];
      const newTask = newTasks[i];

      if (
        current.id !== newTask.id ||
        current.markdown !== newTask.markdown ||
        current.status !== newTask.status ||
        current.priority !== newTask.priority ||
        current.updated !== newTask.updated
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Sort tasks by different criteria
   */
  static sortTasks(tasks: TaskItem[], sortBy: string): TaskItem[] {
    const sortedTasks = [...tasks];

    switch (sortBy) {
      case "priority":
        sortedTasks.sort((a, b) => {
          const priorityOrder = {
            [TaskPriority.URGENT]: 0,
            [TaskPriority.HIGH]: 1,
            [TaskPriority.NORMAL]: 2,
            [TaskPriority.LOW]: 3,
          };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
        break;
      case "updated":
        sortedTasks.sort(
          (a, b) =>
            new Date(b.updated).getTime() - new Date(a.updated).getTime()
        );
        break;
      case "content":
        sortedTasks.sort((a, b) => {
          const textA = TaskAnalysisService.extractTaskText(
            a.markdown
          ).toLowerCase();
          const textB = TaskAnalysisService.extractTaskText(
            b.markdown
          ).toLowerCase();
          return textA.localeCompare(textB);
        });
        break;
      case "created":
      default:
        sortedTasks.sort(
          (a, b) =>
            new Date(a.created).getTime() - new Date(b.created).getTime()
        );
        break;
    }

    return sortedTasks;
  }

  /**
   * Group tasks for different display modes
   */
  static groupTasksForDisplay(
    tasks: TaskItem[],
    displayMode: TaskDisplayMode
  ): TaskItem[] | GroupedTasks {
    if (displayMode === TaskDisplayMode.ONLY_TASKS) {
      return tasks;
    }

    // Group by notebook and optionally by document
    const groups: GroupedTasks = {};

    for (const task of tasks) {
      if (!groups[task.box]) {
        groups[task.box] = {
          notebook: task.boxName,
          documents: {},
        };
      }

      const docKey =
        displayMode === TaskDisplayMode.NOTEBOOK_DOCUMENT_TASKS
          ? task.root_id
          : "all";
      const docPath =
        displayMode === TaskDisplayMode.NOTEBOOK_DOCUMENT_TASKS
          ? task.docPath || "Unknown Document"
          : "";

      if (!groups[task.box].documents[docKey]) {
        groups[task.box].documents[docKey] = {
          docPath,
          tasks: [],
        };
      }

      groups[task.box].documents[docKey].tasks.push(task);
    }

    return groups;
  }

  /**
   * Check if tasks are grouped
   */
  static isGroupedTasks(
    tasks: TaskItem[] | GroupedTasks
  ): tasks is GroupedTasks {
    return !Array.isArray(tasks);
  }
}
