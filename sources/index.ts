import type { Plugin, Project, Workspace } from "@yarnpkg/core";
import { execute } from "@yarnpkg/shell";
import { LeafCommand } from "./commands/Leaf";
import { LeafActivateCommand } from "./commands/LeafActivate";
import { LeafDisableCommand } from "./commands/LeafDisable";
import { findWorkspaceLeafs } from "./utils/findLeafs";

/*!
 * Yarn Leaf Plugin
 * https://github.com/jantimon/yarn-plugin-leaf
 *
 * The `yarn-plugin-leaf` plugin adds `leaf` modules. Leaf modules are standalone
 * modules with a standalone package.json and yarn.lock file.
 *
 * In contrast to workspace modules leaf modules and all of their dependencies are only
 * installed on demand.
 *
 * List existing leafs
 *
 * ```
 *   yarn leaf
 * ```
 *
 * Activate a leaf module and install all it's dependencies:
 *
 * ```
 *   yarn leaf activate my-special-package
 * ```
 *
 * Disable a leaf module and uninstall all it's dependencies:
 *
 * ```
 *   yarn leaf disable my-special-package
 * ```
 *
 * Updates of all active leaf modules will run automatically
 * during your normal yarn install run
 *
 * ```
 *   yarn
 * ```
 *
 * Update the `yarn leaf` module:
 * ```
 *   yarn plugin import https://raw.githubusercontent.com/jantimon/yarn-plugin-leaf/main/bundles/%40yarnpkg/plugin-leaf.js
 * ```
 */
const projectTasks = new WeakMap<Project, Array<Promise<string[]>>>();

const plugin: Plugin = {
  commands: [LeafCommand, LeafActivateCommand, LeafDisableCommand],
  hooks: {
    validateWorkspace(workspace: Workspace) {
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
