export enum TaskRange {
  DOC = "doc",
  BOX = "box",
  WORKSPACE = "workspace",
}

export enum TaskStatus {
  ALL = "all",
  TODO = "todo",
  DONE = "done",
}

export enum TaskPriority {
  NORMAL = "normal",
  LOW = "low",
  HIGH = "high",
  URGENT = "urgent",
}

export enum TaskDisplayMode {
  ONLY_TASKS = "only_tasks",
  NOTEBOOK_DOCUMENT_TASKS = "notebook_document_tasks",
  NOTEBOOK_TASKS = "notebook_tasks",
}

export interface TaskItem {
  id: string;
  /** the raw markdown content */
  markdown: string;
  /** content without markdown */
  content: string;
  /** Trimmed content */
  fcontent: string;
  box: string;
  boxName: string;
  root_id: string;
  path: string;
  created: string;
  updated: string;
  type: string;
  subtype: string;
  status: TaskStatus.TODO | TaskStatus.DONE;
  priority: TaskPriority;
  docPath?: string;
}

export interface DocInfo {
  id: string;
  rootID: string;
  name: string;
}

export interface BoxInfo {
  box: string;
  name: string;
}

export interface Notebook {
  id: string;
  name: string;
  closed?: boolean;
  [key: string]: unknown;
}

export interface TaskState {
  tasks: TaskItem[];
  loading: boolean;
  error: string;
  currentDocInfo: DocInfo;
  currentBoxInfo: BoxInfo;
  notebooksCache: Notebook[];
  currentRange: TaskRange;
  currentStatus: TaskStatus;
}

export interface GroupedTasks {
  [boxId: string]: {
    notebook: string;
    documents: {
      [docId: string]: {
        docPath: string;
        tasks: TaskItem[];
      };
    };
  };
}
