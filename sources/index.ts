import type { Plugin, Project, Workspace } from "@yarnpkg/core";
import { execute } from "@yarnpkg/shell";
import {
  LeafActivateCommand,
  LeafCommand,
  LeafDisableCommand,
} from "./commands/Leaf";
import { findWorkspaceLeafs } from "./utils/findLeafs";

const projectTasks = new WeakMap<Project, Array<Promise<string[]>>>();

const plugin: Plugin = {
  commands: [LeafCommand, LeafActivateCommand, LeafDisableCommand],
  hooks: {
    validateWorkspace(workspace: Workspace) {
      // Get the raw package.json
      const { optionalWorkspaces } = workspace.manifest.raw;
      if (!optionalWorkspaces || !Array.isArray(optionalWorkspaces)) {
        return;
      }
      // Keep a task list for the current project
      const tasksFromCache = projectTasks.get(workspace.project);
      const tasks = tasksFromCache || [];
      if (!tasksFromCache) {
        projectTasks.set(workspace.project, tasks);
      }
      // Add tasks for each optional workspace
      tasks.push(
        findWorkspaceLeafs(workspace).then(async (manifestPromises) => {
          return Promise.all(
            manifestPromises.map(async (manifestPromise) => {
              const { manifest, hasNodeModules, absolutePath } =
                await manifestPromise;
              if (!hasNodeModules) {
                return `Skipping ${manifest.raw.name}`;
              }
              await execute("yarn", [], { cwd: absolutePath });
              return `✨ Updated ${manifest.raw.name}`;
            })
          );
        })
      );
    },
    afterAllInstalled: async (project: Project) => {
      const tasks = projectTasks.get(project);
      if (tasks) {
        const taskResults = await Promise.all(tasks);
        taskResults.forEach((taskResult) =>
          taskResult.forEach((message) => {
            console.log(message);
          })
        );
      }
    },
  },
};

export default plugin;
