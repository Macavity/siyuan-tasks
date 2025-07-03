import { sql } from "../api";
import {
  TaskRange,
  TaskStatus,
  TaskItem,
  DocInfo,
  BoxInfo,
  TaskPriority,
} from "../types/tasks";
import { TaskAnalysisService } from "./task-analysis.service";

export async function fetchTasksFromDB(
  range: TaskRange,
  status: TaskStatus,
  getCurrentDocInfo: () => DocInfo,
  getCurrentBoxInfo: () => BoxInfo
): Promise<TaskItem[]> {
  let sqlQuery = "SELECT * FROM blocks WHERE type = 'i' AND subtype = 't'";

  if (range === TaskRange.DOC && getCurrentDocInfo()?.rootID) {
    sqlQuery += ` AND root_id = '${getCurrentDocInfo().rootID}'`;
  } else if (range === TaskRange.BOX && getCurrentBoxInfo()?.box) {
    sqlQuery += ` AND box = '${getCurrentBoxInfo().box}'`;
  }

  sqlQuery += " ORDER BY created ASC LIMIT 2000";

  const tasksResult = await sql(sqlQuery);
  if (!tasksResult || tasksResult.length === 0) {
    return [];
  }

  // Filter by status
  const filtered = filterTasksByStatus(tasksResult, status);

  // Map to TaskItem[] (add priority detection here, but leave notebook/doc path to the store)
  return filtered.map((task: any) => ({
    ...task,
    priority: TaskAnalysisService.detectPriority(task.fcontent),
  }));
}

export function filterTasksByStatus(tasks: any[], status: TaskStatus): any[] {
  return tasks.filter((task) => {
    if (status === TaskStatus.TODO)
      return TaskAnalysisService.isTodo(task.markdown);
    if (status === TaskStatus.DONE)
      return TaskAnalysisService.isDone(task.markdown);
    return (
      TaskAnalysisService.isTodo(task.markdown) ||
      TaskAnalysisService.isDone(task.markdown)
    );
  });
}
