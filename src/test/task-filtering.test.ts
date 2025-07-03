import { describe, it, expect, beforeEach, vi } from "vitest";
import { taskStore, type TaskItem } from "../stores/task.store";
import { TaskStatus, TaskPriority } from "../types/tasks";
import { configStore } from "../stores/config.store";
import { get } from "svelte/store";
import { TaskRange } from "../types/tasks";

// Mock the API functions
vi.mock("../api", () => ({
  sql: vi.fn(),
  lsNotebooks: vi.fn(),
  getHPathByID: vi.fn(),
}));

describe("Task Filtering and Sorting", () => {
  const mockTasks: TaskItem[] = [
    {
      id: "1",
      markdown: "- [ ] ❗ High priority task",
      content: "- [ ] ❗ High priority task",
      box: "box1",
      boxName: "Notebook 1",
      root_id: "doc1",
      path: "/path1",
      created: "2024-01-01T00:00:00Z",
      updated: "2024-01-01T00:00:00Z",
      type: "i",
      subtype: "t",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
    },
    {
      id: "2",
      markdown: "- [x] Completed task",
      content: "- [x] Completed task",
      box: "box1",
      boxName: "Notebook 1",
      root_id: "doc1",
      path: "/path1",
      created: "2024-01-02T00:00:00Z",
      updated: "2024-01-02T00:00:00Z",
      type: "i",
      subtype: "t",
      status: TaskStatus.DONE,
      priority: TaskPriority.NORMAL,
    },
    {
      id: "3",
      markdown: "- [ ] ‼️ Urgent task",
      content: "- [ ] ‼️ Urgent task",
      box: "box1",
      boxName: "Notebook 1",
      root_id: "doc1",
      path: "/path1",
      created: "2024-01-03T00:00:00Z",
      updated: "2024-01-03T00:00:00Z",
      type: "i",
      subtype: "t",
      status: TaskStatus.TODO,
      priority: TaskPriority.URGENT,
    },
  ];

  beforeEach(() => {
    // Reset stores
    taskStore.setTasks([]);
    configStore.set({
      autoRefresh: true,
      refreshInterval: 30,
      showCompleted: true,
      maxTasks: 100,
      sortBy: "created",
      displayMode: "only_tasks" as any,
      loading: false,
    });
  });

  it("should filter out completed tasks when showCompleted is false", () => {
    // Set up tasks
    taskStore.setTasks(mockTasks);

    // Set showCompleted to false
    configStore.setShowCompleted(false);

    // Get filtered tasks (this would normally be done in the component)
    const tasks = get(taskStore);
    const filteredTasks = tasks.tasks.filter((task) => {
      if (!get(configStore).showCompleted && task.status === TaskStatus.DONE) {
        return false;
      }
      return true;
    });

    expect(filteredTasks).toHaveLength(2);
    expect(filteredTasks.every((task) => task.status === TaskStatus.TODO)).toBe(
      true
    );
  });

  it("should sort tasks by priority when sortBy is priority", () => {
    // Set up tasks
    taskStore.setTasks(mockTasks);

    // Set sortBy to priority
    configStore.setSortBy("priority");

    // Sort tasks
    const sortedTasks = taskStore.sortTasks(mockTasks, "priority");

    expect(sortedTasks[0].priority).toBe(TaskPriority.URGENT);
    expect(sortedTasks[1].priority).toBe(TaskPriority.HIGH);
    expect(sortedTasks[2].priority).toBe(TaskPriority.NORMAL);
  });

  it("should show completed tasks when showCompleted is true", () => {
    // Set up tasks
    taskStore.setTasks(mockTasks);

    // Set showCompleted to true
    configStore.setShowCompleted(true);

    // Get filtered tasks
    const tasks = get(taskStore);
    const filteredTasks = tasks.tasks.filter((task) => {
      if (!get(configStore).showCompleted && task.status === TaskStatus.DONE) {
        return false;
      }
      return true;
    });

    expect(filteredTasks).toHaveLength(3);
    expect(filteredTasks.some((task) => task.status === TaskStatus.DONE)).toBe(
      true
    );
  });
});
