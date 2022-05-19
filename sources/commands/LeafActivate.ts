import { BaseCommand, WorkspaceRequiredError } from "@yarnpkg/cli";
import {
  Configuration,
  formatUtils,
  MessageName,
  Project,
  StreamReport,
} from "@yarnpkg/core";
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
        if (!leaf.hasNodeModules) {
          await execute("yarn", [], { cwd: leaf.absolutePath });
        }
        report.reportInfo(
          MessageName.UNNAMED,
          formatUtils.pretty(
            configuration,
            `leaf '${leafName}' has been activated`,
            "green"
          )
        );
      })
    );

    return report.exitCode();
  }
}
