// Import necessary modules from Node.js and VS Code
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as l10n from "@vscode/l10n";
import { spawn } from "child_process";

/**
 * Executes an Angular CLI command using spawn and returns a Promise that resolves when the process ends
 * @param command - The CLI command to run (e.g. ng generate component ...)
 * @param cwd - The working directory from where the command should run
 */
async function runAngularCommand(command: string, cwd: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // 1️⃣ Create a child process using spawn to execute the CLI command
    const child = spawn(command, { cwd, shell: true });

    // 2️⃣ Handle standard output from the CLI command
    child.stdout.on("data", (data) => console.log(data.toString()));

    // 3️⃣ Handle error output from the CLI command
    child.stderr.on("data", (data) => console.error(data.toString()));

    // 4️⃣ Resolve or reject the Promise when the process ends
    child.on("close", (code) => {
      console.log(`Angular CLI exited with code ${code}`);
      if (code === 0) resolve();
      else reject();
    });

    // 5️⃣ Handle errors during the execution
    child.on("error", (err) => {
      console.error(l10n.t("error.failedToRunAngularCLI"), err);
      reject(err);
    });
  });
}

/**
 * Handles user input and generates an Angular element (component, service, etc.) using the CLI
 * @param type - Angular entity type (e.g., 'component', 'service')
 * @param uri - The folder URI where the entity will be created
 */
function generateAngular(type: string, uri: vscode.Uri) {
  vscode.window
    .showInputBox({
      prompt: l10n.t("input.nameType", type),
    })
    .then(async (name) => {
      if (!name) {
        // Show a warning if no name was provided
        vscode.window.showWarningMessage(l10n.t("warning.nameNotProvided", type));
        return;
      }

      // 1️⃣ Prepare workspace and paths
      const folder = uri.fsPath;
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
      if (!workspaceFolder) {
        vscode.window.showErrorMessage(l10n.t("error.noWorkspace"));
        return;
      }

      const relativePath = path.relative(workspaceFolder.uri.fsPath, folder).replace(/\\/g, "/");
      const cleanedPath = relativePath.replace(/^src\/app\//, "");

      // 2️⃣ Construct the Angular CLI command
      const command = `ng g ${type[0]} ${cleanedPath}/${name} ${
        type === "component" ? "--standalone --skip-tests --flat" : ""
      }`;

      // 3️⃣ Show progress while the CLI runs
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: l10n.t("loadingMessage", type, name),
            cancellable: false,
          },
          async () => {
            await runAngularCommand(command, workspaceFolder.uri.fsPath);
          }
        );

        // 4️⃣ Notify user of success
        vscode.window.showInformationMessage(l10n.t("info.generatedSuccess", type, name));
      } catch {
        vscode.window.showErrorMessage(l10n.t("error.failedGeneration", type));
      }
    });
}

/**
 * Registers a command for generating a specific Angular type
 * @param type - The Angular element type (component, pipe, etc.)
 */
function registerCommand(type: string) {
  return vscode.commands.registerCommand(`angular-snippet-tools.create${capitalize(type)}`, (uri: vscode.Uri) =>
    generateAngular(type, uri)
  );
}

/**
 * Capitalizes the first letter of a string
 * @param s - The input string
 * @returns The string with the first letter capitalized
 */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Entry point of the extension. Registers all commands and sets up localization
 * @param context - VS Code extension context
 */
export async function activate(context: vscode.ExtensionContext) {
  // 1️⃣ Determine the user's language
  const lang = (vscode.env.language ?? "en").split("-")[0];
  const bundleUri = vscode.Uri.joinPath(context.extensionUri, "l10n", `bundle.l10n.${lang}.json`);
  await l10n.config({ uri: bundleUri.toString() });

  // 2️⃣ Register creation commands for Angular elements
  const types = ["component", "directive", "guard", "interceptor", "pipe", "service"];
  types.forEach((type) => {
    context.subscriptions.push(registerCommand(type));
  });

  // 3️⃣ Register custom route-related commands
  context.subscriptions.push(
    vscode.commands.registerCommand("angular-snippet-tools.createAndAddRoute", (uri: vscode.Uri) => {
      createAndAddRoute(uri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("angular-snippet-tools.createRoutesFile", createRoutesFile)
  );
}

/**
 * Creates a new Angular component and automatically adds its route to the closest *.routes.ts file
 * @param uri - Folder where the component should be generated
 */
async function createAndAddRoute(uri: vscode.Uri) {
  const name = await vscode.window.showInputBox({ prompt: l10n.t("input.componentName") });
  if (!name) {
    vscode.window.showWarningMessage(l10n.t("warning.noComponentName"));
    return;
  }

  // 1️⃣ Prepare file paths and naming
  const folder = uri.fsPath;
  const kebab = kebabCase(name);
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  if (!workspaceFolder) {
    vscode.window.showErrorMessage(l10n.t("error.noWorkspace"));
    return;
  }

  const relativePath = path.relative(workspaceFolder.uri.fsPath, folder).replace(/\\/g, "/");
  const cleanedPath = relativePath.replace(/^src\/app\//, "");
  const command = `ng g c ${cleanedPath}/${name} --standalone --skip-tests --flat`;

  // 2️⃣ Check if Angular 17.2+ naming should be used
  const useNewConvention = shouldUseNewNamingConvention(folder);
  const className = useNewConvention ? `${capitalize(name)}` : `${capitalize(name)}Component`;

  // 3️⃣ Run component generation
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: l10n.t("loadingMessage", "componente", name),
        cancellable: false,
      },
      async () => {
        await runAngularCommand(command, workspaceFolder.uri.fsPath);
      }
    );
  } catch {
    vscode.window.showErrorMessage(l10n.t("error.failedComponentCreation", name));
    return;
  }

  // 4️⃣ Add route to the closest *.routes.ts file
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

  // 5️⃣ Modify routes array by inserting the new route
  const content = fs.readFileSync(routesFile, "utf-8");
  const updatedContent = content.replace(/(\[)([\s\S]*?)(\])/m, (_, a, b, c) => `${a}\n${b}${newRoute}${c}`);
  fs.writeFileSync(routesFile, updatedContent, "utf-8");

  vscode.window.showInformationMessage(l10n.t("info.routeAdded", path.basename(routesFile)));
}

/**
 * Recursively finds the nearest *.routes.ts file in parent directories
 * @param folder - Starting folder
 * @returns Full path to the closest routes file or null
 */
function findNearestRoutesFile(folder: string): string | null {
  const files = fs.readdirSync(folder);
  const found = files.find((file) => file.endsWith(".routes.ts"));
  if (found) return path.join(folder, found);

  const parent = path.dirname(folder);
  if (parent === folder) return null;

  return findNearestRoutesFile(parent);
}

/**
 * Checks if the Angular version is 17.2 or higher
 * @param version - Version string from package.json
 */
function isAngular172OrHigher(version: string): boolean {
  const clean = version.replace(/[^0-9.]/g, "");
  const [major, minor] = clean.split(".").map(Number);
  return major > 17 || (major === 17 && minor >= 2);
}

/**
 * Recursively searches for the nearest package.json from the given folder
 * @param folder - Starting folder
 * @returns Path to package.json or null
 */
function findNearestPackageJson(folder: string): string | null {
  const file = path.join(folder, "package.json");
  if (fs.existsSync(file)) return file;

  const parent = path.dirname(folder);
  if (parent === folder) return null;

  return findNearestPackageJson(parent);
}

/**
 * Determines whether to use the new Angular 17.2+ naming convention
 * @param baseFolder - Folder to look for package.json
 */
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

/**
 * Converts a string to kebab-case (e.g., MyComponent → my-component)
 * @param text - The string to convert
 */
function kebabCase(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Creates a new *.routes.ts file with a default route for main-page.component
 * @param uri - Folder where the routes file will be created
 */
function createRoutesFile(uri: vscode.Uri) {
  vscode.window.showInputBox({ prompt: l10n.t("input.routesFileName") }).then((name) => {
    if (!name) {
      vscode.window.showWarningMessage(l10n.t("warning.routesFileNameMissing"));
      return;
    }

    // 1️⃣ Sanitize and convert name to kebab-case
    const baseName = kebabCase(name.replace(/\.routes\.ts$/, ""));
    const constName = `${baseName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Routes`;

    // 2️⃣ Default routes content
    const content = `import { Routes } from '@angular/router';

export const ${constName}: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/main-page.component').then(m => m.MainPageComponent),
  },
];
`;

    // 3️⃣ Write file and notify user
    const routePath = path.join(uri.fsPath, `${baseName}.routes.ts`);
    fs.writeFileSync(routePath, content, { encoding: "utf-8" });

    vscode.window.showInformationMessage(l10n.t("info.routesFileCreated", baseName));
  });
}

/**
 * VS Code lifecycle hook (not used here but required)
 */
export function deactivate() {}
