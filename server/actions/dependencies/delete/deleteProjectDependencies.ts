import express from 'express';
import executeCommand from '../../executeCommand';
import { withCacheSplice } from '../../../cache';
import { decodePath } from '../../decodePath';
import { hasYarn, hasNpm, hasBower } from '../../hasYarn';

async function deleteNpmDependency(
  projectPath: string, dependencyName:string, type: Dependency.Type,
):Promise<string> {
  // delete
  await executeCommand(projectPath, `npm uninstall ${dependencyName} -${type === 'prod' ? 'S' : 'D'}`, true); // tslint:disable-line:max-line-length

  return dependencyName;
}

async function deleteYarnDependency(
  projectPath: string, dependencyName:string, _: Dependency.Type,
):Promise<string> {
  // delete
  await executeCommand(projectPath, `yarn remove ${dependencyName}`, true);

  return dependencyName;
}

async function deleteBowerDependency(
  projectPath: string, dependencyName:string, type: Dependency.Type,
):Promise<string> {
  await executeCommand(projectPath, `bower uninstall ${dependencyName} -${type === 'prod' ? 'S' : 'D'}`, true); // tslint:disable-line:max-line-length

  return dependencyName;
}

export async function deleteDependency(req: express.Request, res: express.Response):Promise<void> {
  const {
    repoName, projectPath, type, packageName,
  } :
  any = req.params;
  const projectPathDecoded = decodePath(projectPath) as string;
  const yarn = hasYarn(projectPathDecoded);
  const bower = hasBower(projectPathDecoded);
  const npm = hasNpm(projectPathDecoded);

  if (repoName === 'npm') {
    if (yarn || npm) {
      await withCacheSplice(
        yarn ? deleteYarnDependency : deleteNpmDependency,
        `${req.headers['x-cache-id']}-${projectPath}-npm`, 'name',
        projectPathDecoded, packageName, type,
      );
      res.json({});
    } else {
      res.status(400).json(null);
    }
  }

  if (repoName === 'bower') {
    if (bower) {
      try {
        await withCacheSplice(
          deleteBowerDependency,
          `${req.headers['x-cache-id']}-${projectPath}-bower`, 'name',
          projectPathDecoded, packageName, type,
        );
        res.json({});
      } catch (e) {
        console.log(e);
      }
    } else {
      res.status(400).json(null);
    }
  }
}