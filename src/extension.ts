// Import necessary modules from Node.js and VS Code
import * as vscode from "vscode";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as l10n from "@vscode/l10n";

let angularTerminal: vscode.Terminal | undefined;

function getCommandSeparator(shellPath: string): string {
  const lower = shellPath.toLowerCase();
  console.log("#####---------------------------------------------------------------");
  console.log(shellPath);
  console.log(lower);

  if (lower.includes("powershell")) return ";";
  return "&&";
}

function generateAngular(type: string, uri: vscode.Uri) {
  vscode.window
    .showInputBox({
      prompt: l10n.t("input.nameType", type),
    })
    .then((name) => {
      if (!name) {
        vscode.window.showWarningMessage(l10n.t("warning.nameNotProvided", type));
        return;
      }

      const folder = uri.fsPath;
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("❌ No se encontró el workspace.");
        return;
      }

      const relativePath = path.relative(workspaceFolder.uri.fsPath, folder).replace(/\\/g, "/");
      const cleanedPath = relativePath.replace(/^src\/app\//, "");

      const command = `ng g ${type[0]} ${cleanedPath}/${name} ${
        type === "component" ? "--standalone --skip-tests --flat" : ""
      }`;

      if (!angularTerminal) {
        vscode.window.showErrorMessage("❌ Terminal Angular CLI no inicializada.");
        return;
      }

      angularTerminal.show();
      angularTerminal.sendText(command);
    });
}

function registerCommand(type: string) {
  return vscode.commands.registerCommand(`angular-snippet-tools.create${capitalize(type)}`, (uri: vscode.Uri) =>
    generateAngular(type, uri)
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function activate(context: vscode.ExtensionContext) {
  const lang = (vscode.env.language ?? "en").split("-")[0];
  const bundleUri = vscode.Uri.joinPath(context.extensionUri, "l10n", `bundle.l10n.${lang}.json`);
  await l10n.config({ uri: bundleUri.toString() });

  const types = ["component", "directive", "guard", "interceptor", "pipe", "service"];
  types.forEach((type) => {
    context.subscriptions.push(registerCommand(type));
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("angular-snippet-tools.createAndAddRoute", (uri: vscode.Uri) => {
      createAndAddRoute(uri);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("angular-snippet-tools.createRoutesFile", createRoutesFile)
  );

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (workspaceFolder) {
    angularTerminal = vscode.window.createTerminal({
      name: "Angular CLI",
      cwd: workspaceFolder.uri.fsPath,
      hideFromUser: true,
    });
    angularTerminal.sendText("echo Angular CLI ready");

    vscode.window.onDidCloseTerminal((closedTerminal) => {
      if (closedTerminal.name === "Angular CLI") {
        angularTerminal = vscode.window.createTerminal({
          name: "Angular CLI",
          cwd: workspaceFolder.uri.fsPath,
          hideFromUser: true,
        });
        angularTerminal.sendText("echo Angular CLI ready");
      }
    });
  }
}

async function createAndAddRoute(uri: vscode.Uri) {
  const name = await vscode.window.showInputBox({ prompt: l10n.t("input.componentName") });
  if (!name) {
    vscode.window.showWarningMessage(l10n.t("warning.noComponentName"));
    return;
  }

  const folder = uri.fsPath;
  const kebab = kebabCase(name);
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("❌ No se encontró el workspace.");
    return;
  }

  const relativePath = path.relative(workspaceFolder.uri.fsPath, folder).replace(/\\/g, "/");
  const cleanedPath = relativePath.replace(/^src\/app\//, "");
  const command = `ng g c ${cleanedPath}/${name} --standalone --skip-tests --flat`;

  const useNewConvention = shouldUseNewNamingConvention(folder);
  const className = useNewConvention ? `${capitalize(name)}` : `${capitalize(name)}Component`;

  if (!angularTerminal) {
    vscode.window.showErrorMessage("❌ Terminal Angular CLI no inicializada.");
    return;
  }

  angularTerminal.show();
  angularTerminal.sendText(command);

  const routesFile = findNearestRoutesFile(folder);
  if (!routesFile) {
    vscode.window.showWarningMessage(l10n.t("warning.noRoutesFile"));
    return;
  }

  const componentFileName = useNewConvention ? `${kebab}` : `${kebab}.component`;
  const relativeImportPath =
    "./" + path.relative(path.dirname(routesFile), path.join(folder, componentFileName)).replace(/\\/g, "/");

  const newRoute = `  {
    path: '${kebab}',
    loadComponent: () => import('${relativeImportPath}').then(m => m.${className})
  },\n`;

  const content = fs.readFileSync(routesFile, "utf-8");
  const updatedContent = content.replace(/(\[)([\s\S]*?)(\])/m, (_, a, b, c) => `${a}\n${b}${newRoute}${c}`);
  fs.writeFileSync(routesFile, updatedContent, "utf-8");

  vscode.window.showInformationMessage(l10n.t("info.routeAdded", path.basename(routesFile)));
}

function findNearestRoutesFile(folder: string): string | null {
  const files = fs.readdirSync(folder);
  const found = files.find((file) => file.endsWith(".routes.ts"));
  if (found) return path.join(folder, found);

  const parent = path.dirname(folder);
  if (parent === folder) return null;

  return findNearestRoutesFile(parent);
}

function isAngular172OrHigher(version: string): boolean {
  const clean = version.replace(/[^0-9.]/g, "");
  const [major, minor] = clean.split(".").map(Number);
  return major > 17 || (major === 17 && minor >= 2);
}

function findNearestPackageJson(folder: string): string | null {
  const file = path.join(folder, "package.json");
  if (fs.existsSync(file)) return file;

  const parent = path.dirname(folder);
  if (parent === folder) return null;

  return findNearestPackageJson(parent);
}

function shouldUseNewNamingConvention(baseFolder: string): boolean {
  const pkgPath = findNearestPackageJson(baseFolder);
  if (!pkgPath) return false;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const version = pkg.dependencies?.["@angular/core"] ?? pkg.devDependencies?.["@angular/core"];
    if (!version) return false;

    return isAngular172OrHigher(version);
  } catch {
    return false;
  }
}

function kebabCase(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function createRoutesFile(uri: vscode.Uri) {
  vscode.window.showInputBox({ prompt: l10n.t("input.routesFileName") }).then((name) => {
    if (!name) {
      vscode.window.showWarningMessage(l10n.t("warning.routesFileNameMissing"));
      return;
    }

    const baseName = kebabCase(name.replace(/\.routes\.ts$/, ""));
    const constName = `${baseName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Routes`;

    const content = `import { Routes } from '@angular/router';

export const ${constName}: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/main-page.component').then(m => m.MainPageComponent),
  },
];
`;

    const routePath = path.join(uri.fsPath, `${baseName}.routes.ts`);
    fs.writeFileSync(routePath, content, { encoding: "utf-8" });

    vscode.window.showInformationMessage(l10n.t("info.routesFileCreated", baseName));
  });
}

export function deactivate() {}
