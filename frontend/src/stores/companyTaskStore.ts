/**
 * Company Task Store — Zustand global state for running/completed analyses.
 *
 * Survives route changes (not page refresh — for that, we re-fetch on mount).
 * Manages SSE connections and task lifecycle.
 */
import { create } from 'zustand';
import {
  listRunningTasks,
  connectTaskStream,
  type RunningTask,
} from '../api/company';

export interface GateResult {
  gate: number;
  skill: string;
  display_name: string;
  parsed: Record<string, any>;
  raw: string;
  parse_status?: string;
  latency_ms?: number;
  error?: string;
  replay?: boolean;
}

export interface TaskState {
  id: string;
  symbol: string;
  companyName: string;
  model: string;
  provider: string;
  status: 'running' | 'completed' | 'error';
  currentGate: number;
  gateResults: Record<number, GateResult>;
  streamText: string;
  streamGate: number;
  createdAt: string;
  // SSE cleanup function
  _cleanup?: () => void;
}

interface CompanyTaskStore {
  tasks: Record<string, TaskState>;

  // Initialize from a new analysis (called when user starts analyze/stream)
  registerTask: (id: string, info: {
    symbol: string;
    companyName: string;
    model: string;
    provider: string;
  }) => void;

  // Process an SSE event for a task
  handleEvent: (taskId: string, event: any) => void;

  // Mark task complete/error
  finishTask: (taskId: string, status: 'completed' | 'error') => void;

  // Reconnect to a running task via the reconnectable SSE endpoint
  reconnectTask: (taskId: string) => void;

  // Fetch and reconnect all running tasks (called on page mount)
  restoreRunningTasks: () => Promise<void>;

  // Remove a task from the store
  removeTask: (taskId: string) => void;

  // Cleanup all SSE connections
  cleanup: () => void;
}

export const useCompanyTaskStore = create<CompanyTaskStore>((set, get) => ({
  tasks: {},

  registerTask: (id, info) => {
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: {
          id,
          symbol: info.symbol,
          companyName: info.companyName,
          model: info.model,
          provider: info.provider,
          status: 'running',
          currentGate: 0,
          gateResults: {},
          streamText: '',
          streamGate: 0,
          createdAt: new Date().toISOString(),
        },
      },
    }));
  },

  handleEvent: (taskId, event) => {
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;

      const updated = { ...task };

      switch (event.type) {
        case 'gate_start':
          updated.currentGate = event.gate;
          updated.streamGate = event.gate;
          updated.streamText = '';
          break;

        case 'gate_text':
          updated.streamText += event.text || '';
          break;

        case 'gate_complete':
          updated.gateResults = {
            ...updated.gateResults,
            [event.gate]: {
              gate: event.gate,
              skill: event.skill,
              display_name: event.display_name,
              parsed: event.parsed || {},
              raw: event.raw || '',
              parse_status: event.parse_status,
              latency_ms: event.latency_ms,
              error: event.error,
              replay: event.replay,
            },
          };
          updated.currentGate = event.gate;
          updated.streamText = '';
          break;

        case 'result':
          updated.status = 'completed';
          break;

        case 'error':
          updated.status = 'error';
          break;

        case 'task_status':
          updated.status = event.status === 'completed' ? 'completed' : 'error';
          break;
      }

      return {
        tasks: { ...state.tasks, [taskId]: updated },
      };
    });
  },

  finishTask: (taskId, status) => {
    set((state) => {
      const task = state.tasks[taskId];
      if (!task) return state;
      return {
        tasks: {
          ...state.tasks,
          [taskId]: { ...task, status },
        },
      };
    });
  },

  reconnectTask: (taskId) => {
    const { tasks, handleEvent, finishTask } = get();
    const existing = tasks[taskId];

    // Avoid duplicate connections
    if (existing?._cleanup) {
      existing._cleanup();
    }

    const cleanup = connectTaskStream(
      taskId,
      (event) => handleEvent(taskId, event),
      () => finishTask(taskId, 'completed'),
      () => {
        // On SSE error — don't immediately mark as error,
        // the pipeline may still be running server-side.
        // The user can manually reconnect.
      },
    );

    // Store the cleanup function
    set((state) => ({
      tasks: {
        ...state.tasks,
        [taskId]: { ...state.tasks[taskId], _cleanup: cleanup },
      },
    }));
  },

  restoreRunningTasks: async () => {
    try {
      const { tasks: running } = await listRunningTasks();
      const { tasks: existing, reconnectTask } = get();

      for (const task of running) {
        // Skip if already tracked
        if (existing[task.id]) continue;

        // Register and reconnect
        set((state) => ({
          tasks: {
            ...state.tasks,
            [task.id]: {
              id: task.id,
              symbol: task.symbol,
              companyName: task.company_name,
              model: task.model,
              provider: task.provider,
              status: 'running',
              currentGate: task.current_gate || 0,
              gateResults: {},
              streamText: '',
              streamGate: 0,
              createdAt: task.created_at,
            },
          },
        }));

        reconnectTask(task.id);
      }
    } catch {
      // Silently fail — non-critical
    }
  },

  removeTask: (taskId) => {
    const task = get().tasks[taskId];
    task?._cleanup?.();
    set((state) => {
      const { [taskId]: _, ...rest } = state.tasks;
      return { tasks: rest };
    });
  },

  cleanup: () => {
    const { tasks } = get();
    Object.values(tasks).forEach((t) => t._cleanup?.());
    set({ tasks: {} });
  },
}));
