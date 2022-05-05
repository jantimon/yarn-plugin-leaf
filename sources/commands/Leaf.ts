import { BaseCommand, WorkspaceRequiredError } from "@yarnpkg/cli";
import {
  Configuration,
  formatUtils,
  MessageName,
  Project, StreamReport
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
