import { TaskItem, TaskStatus } from "../types/tasks";
import { TaskAnalysisService } from "./task-analysis.service";

export interface RawSiyuanBlock {
  id: string;
  markdown: string;
  content: string;
  fcontent: string;
  box: string;
  root_id: string;
  path: string;
  created: string;
  updated: string;
  type: string;
  subtype: string;
  [key: string]: any; // Allow for additional properties
}

export class TaskFactory {
  /**
   * Creates a TaskItem from raw Siyuan block data
   */
  static createTaskItem(
    rawBlock: RawSiyuanBlock,
    boxName: string,
    docPath: string
  ): TaskItem {
    return {
      id: rawBlock.id,
      markdown: rawBlock.markdown,
      content: rawBlock.content,
      fcontent: rawBlock.fcontent,
      box: rawBlock.box,
      boxName,
      root_id: rawBlock.root_id,
      path: rawBlock.path,
      created: rawBlock.created,
      updated: rawBlock.updated,
      type: rawBlock.type,
      subtype: rawBlock.subtype,
      status: this.detectTaskStatus(rawBlock.markdown),
      priority: TaskAnalysisService.detectPriority(rawBlock.fcontent),
      docPath,
    };
  }

  /**
   * Creates multiple TaskItems from raw Siyuan block data
   */
  static async createTaskItems(
    rawBlocks: RawSiyuanBlock[],
    getBoxName: (boxId: string) => Promise<string>,
    getDocPath: (docId: string) => Promise<string>
  ): Promise<TaskItem[]> {
    const tasks: TaskItem[] = [];

    for (const block of rawBlocks) {
      const boxName = await getBoxName(block.box);
      const docPath = await getDocPath(block.root_id);
      tasks.push(this.createTaskItem(block, boxName, docPath));
    }

    return tasks;
  }

  /**
   * Detects task status from markdown content
   */
  private static detectTaskStatus(
    markdown: string
  ): TaskStatus.TODO | TaskStatus.DONE {
    return TaskAnalysisService.isTodo(markdown)
      ? TaskStatus.TODO
      : TaskStatus.DONE;
  }
}
