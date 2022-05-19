import { BaseCommand, WorkspaceRequiredError } from "@yarnpkg/cli";
import {
  Configuration,
  formatUtils,
  MessageName,
  Project,
  StreamReport,
} from "@yarnpkg/core";
import { PortablePath, ppath, xfs } from "@yarnpkg/fslib";
import { Command, Option, Usage } from "clipanion";
import { findWorkspaceLeafs } from "../utils/findLeafs";

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
      async () => {}
    );

    const availableLeafs = await findWorkspaceLeafs(workspace);
    await Promise.all(
      this.patterns.map(async (leafName) => {
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
        if (leaf.hasNodeModules) {
          await xfs.removePromise(
            ppath.join(leaf.absolutePath, "node_modules" as PortablePath),
            { recursive: true }
          );
        }
        report.reportInfo(
          MessageName.UNNAMED,
          formatUtils.pretty(
            configuration,
            `leaf '${leafName}' has been disabled`,
            "green"
          )
        );
      })
    );

    return report.exitCode();
  }
}
