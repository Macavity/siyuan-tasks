import { sql } from "../api";
import { TaskRange, TaskStatus, DocInfo, BoxInfo } from "../types/tasks";
import { TaskAnalysisService } from "./task-analysis.service";
import { RawSiyuanBlock } from "./task-factory.service";

// TODO
export async function fetchTasksFromDB(
  range: TaskRange,
  status: TaskStatus,
  getCurrentDocInfo: () => DocInfo,
  getCurrentBoxInfo: () => BoxInfo
): Promise<RawSiyuanBlock[]> {
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
  return filterTasksByStatus(tasksResult, status);
}

export function filterTasksByStatus(
  tasks: RawSiyuanBlock[],
  status: TaskStatus
): RawSiyuanBlock[] {
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
