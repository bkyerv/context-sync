import { ProjectStatus } from "./types";

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.IDEA]: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  [ProjectStatus.PLANNING]: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  [ProjectStatus.IN_PROGRESS]: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  [ProjectStatus.COMPLETED]: "bg-green-500/20 text-green-400 border-green-500/50",
  [ProjectStatus.STUCK]: "bg-red-500/20 text-red-400 border-red-500/50",
};

export const MOCK_PROJECTS = []; // Empty start to force user to create
