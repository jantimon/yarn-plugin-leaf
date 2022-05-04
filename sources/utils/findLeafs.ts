import type { Workspace } from "@yarnpkg/core";
import { Manifest } from "@yarnpkg/core";
import { PortablePath, ppath, Stats, xfs } from "@yarnpkg/fslib";
import { globUtils } from "@yarnpkg/shell";

/**
 * Returns all leaf modules for the given workspace
 */
export const findWorkspaceLeafs = async (workspace: Workspace) => {
  // Get the raw package.json
  const { leafModules } = workspace.manifest.raw as {
    leafModules?: string[];
  };
  if (!Array.isArray(leafModules)) return [];
  const leafsPerWorkspace = await Promise.all(
    leafModules.map((optionalWorkspacePattern) =>
      findLeafsForGlob(optionalWorkspacePattern, workspace.cwd)
    )
  );
  return Promise.all(leafsPerWorkspace.flat());
};

const findLeafsForGlob = async (globPattern: string, cwd: PortablePath) => {
  // Search all optional workspaces
  const optionalWorkSpaceRelativePaths = await globUtils.match(
    globPattern + "/package.json",
    { cwd, baseFs: xfs }
  );
  // Get the absolute path of each optionalWorkSpace
  const optionalWorkSpacePaths = optionalWorkSpaceRelativePaths.map(
    (optionalWorkSpaceRelativePath) =>
      ppath.resolve(
        cwd,
        optionalWorkSpaceRelativePath as PortablePath,
        ".." as PortablePath
      )
  );
  return optionalWorkSpacePaths.map(async (optionalWorkSpacePath) => {
    const manifest = Manifest.fromFile(
      ppath.join(optionalWorkSpacePath, "package.json" as PortablePath)
    );
    let nodeModuleStats: Stats | undefined;
    try {
      nodeModuleStats = await xfs.statPromise(
        ppath.join(optionalWorkSpacePath, "node_modules" as PortablePath)
      );
    } catch (e) {}
    return {
      manifest: await manifest,
      hasNodeModules: Boolean(nodeModuleStats),
      absolutePath: optionalWorkSpacePath,
    };
  });
};
