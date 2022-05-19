import { BaseCommand, WorkspaceRequiredError } from "@yarnpkg/cli";
import {
  Configuration,
  formatUtils,
  MessageName,
  Project,
  StreamReport,
} from "@yarnpkg/core";
import { Command, Usage } from "clipanion";
import { findWorkspaceLeafs } from "../utils/findLeafs";

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
        const leafCount = leafs.length;
        const activeLeafs = leafs.filter(
          ({ hasNodeModules }) => hasNodeModules
        );
        const inactiveLeafs = leafs.filter(
          ({ hasNodeModules }) => !hasNodeModules
        );
        const { Cross, Check } = formatUtils.mark(configuration);
        const writeln = (msg: string) =>
          report.reportInfo(MessageName.UNNAMED, msg);

        writeln(
          `This workspace contains ${leafCount} leaf module${
            leafCount === 1 ? "" : "s"
          }.`
        );
        writeln("");
        if (activeLeafs.length) {
          const activeLeafCount = activeLeafs.length;
          writeln(
            `The following ${
              activeLeafCount === 1
                ? "leaf module is"
                : activeLeafCount + " leaf modules are"
            } active:`
          );
          activeLeafs.forEach((leaf) =>
            writeln(`${Check} ${leaf.manifest.name.name}`)
          );
          writeln("");
        }
        if (inactiveLeafs.length) {
          const inactiveLeafCount = inactiveLeafs.length;
          writeln(
            `The following ${
              inactiveLeafCount === 1
                ? "leaf module is"
                : inactiveLeafCount + " leaf modules are"
            } inactive:`
          );
          inactiveLeafs.forEach((leaf) =>
            writeln(`${Cross} ${leaf.manifest.name.name}`)
          );
          writeln("");
        }
      }
    );

    return report.exitCode();
  }
}
