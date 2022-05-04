import { BaseCommand, WorkspaceRequiredError } from "@yarnpkg/cli";
import {
  Configuration,
  formatUtils,
  MessageName,
  Project,
  Report,
  StreamReport,
  Workspace,
} from "@yarnpkg/core";
import { PortablePath, ppath, xfs } from "@yarnpkg/fslib";
import { execute } from "@yarnpkg/shell";
import { Command, Option, Usage } from "clipanion";
import { findWorkspaceLeafs } from "../utils/findLeafs";

export class LeafActivateCommand extends BaseCommand {
  static paths = [[`leaf`, `activate`]];

  static usage: Usage = Command.Usage({
    description: "install leaf workspace modules",
    details: `
      This command allows to install modules which are excluded from the ordinary installation.
    `,
    examples: [
      ["Activate a leaf workspace", "yarn leaf activate @tools/git-hooks"],
    ],
  });

  patterns = Option.Rest();

  async execute() {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    );
    const { project, workspace } = await Project.find(
      configuration,
      this.context.cwd
    );

    if (!workspace) {
      throw new WorkspaceRequiredError(project.cwd, this.context.cwd);
    }

    const report = await StreamReport.start(
      { configuration, stdout: this.context.stdout },
      async (report) => {
        const leafPromise = findWorkspaceLeafs(workspace);
        await Promise.all(
          this.patterns.map((leaf) =>
            executeLeaf(
              configuration,
              workspace,
              report,
              "activate",
              leaf,
              leafPromise
            )
          )
        );
      }
    );

    return report.exitCode();
  }
}

export class LeafDisableCommand extends BaseCommand {
  static paths = [[`leaf`, `disable`]];

  static usage: Usage = Command.Usage({
    description: "uninstall leaf workspace modules",
    details: `
      This command allows to uninstall modules which are excluded from the ordinary installation.
    `,
    examples: [
      ["Disable a leaf workspace", "yarn leaf disable @tools/git-hooks"],
    ],
  });

  patterns = Option.Rest();

  async execute() {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    );
    const { project, workspace } = await Project.find(
      configuration,
      this.context.cwd
    );

    if (!workspace) {
      throw new WorkspaceRequiredError(project.cwd, this.context.cwd);
    }

    const report = await StreamReport.start(
      { configuration, stdout: this.context.stdout },
      async (report) => {
        const leafPromise = findWorkspaceLeafs(workspace);
        await Promise.all(
          this.patterns.map((leaf) =>
            executeLeaf(
              configuration,
              workspace,
              report,
              "disable",
              leaf,
              leafPromise
            )
          )
        );
      }
    );

    return report.exitCode();
  }
}

export class LeafCommand extends BaseCommand {
  static paths = [[`leaf`]];

  static usage: Usage = Command.Usage({
    description: "leaf workspace modules",
    details: `
      This command allows to install modules which are excluded from the ordinary installation.
    `,
    examples: [
      ["Activate a leaf workspace", "yarn leaf activate @tools/git-hooks"],
      ["Disable a leaf workspace", "yarn leaf disable @tools/git-hooks"],
      ["View all leaf workspaces", "yarn leaf"],
    ],
  });
  async execute() {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    );
    const { project, workspace } = await Project.find(
      configuration,
      this.context.cwd
    );

    if (!workspace) {
      throw new WorkspaceRequiredError(project.cwd, this.context.cwd);
    }

    const report = await StreamReport.start(
      { configuration, stdout: this.context.stdout },
      async (report) => {
        const leafs = await findWorkspaceLeafs(workspace);
        report.reportInfo(
          MessageName.UNNAMED,
          `Found ${leafs.length} leaf module${leafs.length === 1 ? "" : "s"}.`
        );
        report.reportInfo(
          MessageName.UNNAMED,
          formatUtils.prettyList(
            configuration,
            leafs.map(
              (leaf) =>
                `${leaf.hasNodeModules ? "✔" : "𐄂"} ${leaf.manifest.name.name}`
            ),
            "green"
          )
        );
      }
    );

    return report.exitCode();
  }
}

async function executeLeaf(
  configuration: Configuration,
  workspace: Workspace,
  report: Report,
  action: "activate" | "disable",
  leafName: string,
  leafPromise: ReturnType<typeof findWorkspaceLeafs>
) {
  const availableLeafs = await leafPromise;
  const leaf = availableLeafs.find(
    (availableLeaf) => availableLeaf.manifest.name.name === leafName
  );

  if (!leaf) {
    report.reportError(
      MessageName.UNNAMED,
      formatUtils.pretty(
        configuration,
        `Could not find leaf '${leafName}'`,
        "red"
      )
    );
    return;
  }

  if (action === "activate" && !leaf.hasNodeModules) {
    await execute("yarn", [], { cwd: leaf.absolutePath });
  }
  if (action === "disable" && leaf.hasNodeModules) {
    await xfs.removePromise(
      ppath.join(leaf.absolutePath, "node_modules" as PortablePath),
      { recursive: true }
    );
  }

  report.reportInfo(
    MessageName.UNNAMED,
    formatUtils.pretty(
      configuration,
      `leaf '${leafName}' is now ${action}`,
      "green"
    )
  );
}
