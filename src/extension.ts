// Import necessary modules from Node.js and VS Code
import * as vscode from "vscode";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as l10n from "@vscode/l10n";

// Generate an Angular element (component, service, etc.) using the terminal
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
      const isWindows = os.platform() === "win32";
      const separator = isWindows ? ";" : "&&";

      // Create and open a terminal with the Angular CLI generate command
      const terminal = vscode.window.createTerminal(`ng-generate-${type}`);
      const command = `cd "${folder}" ${separator} ng g ${type[0]} ${name} ${
        type === "component" ? "--standalone --skip-tests --flat" : ""
      }`;
      terminal.sendText(command);
      terminal.show();
    });
}

// Register a VS Code command dynamically for each Angular type
function registerCommand(type: string) {
  return vscode.commands.registerCommand(`angular-snippet-tools.create${capitalize(type)}`, (uri: vscode.Uri) =>
    generateAngular(type, uri)
  );
}

// Capitalize the first letter of a string
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Main activation function when the extension is loaded
export async function activate(context: vscode.ExtensionContext) {
  const lang = (vscode.env.language ?? "en").split("-")[0];
  const bundleUri = vscode.Uri.joinPath(context.extensionUri, "l10n", `bundle.l10n.${lang}.json`);
  await l10n.config({ uri: bundleUri.toString() });
  const types = ["component", "directive", "guard", "interceptor", "pipe", "service"];
  console.log("Extension activated");
  vscode.window.showErrorMessage("¡Extensión activada!");
  // debugTest(context);
  // Register commands for each Angular element type
  types.forEach((type) => {
    context.subscriptions.push(registerCommand(type));
  });

  // Register custom commands for additional features
  context.subscriptions.push(
    vscode.commands.registerCommand("angular-snippet-tools.createAndAddRoute", (uri: vscode.Uri) => {
      createAndAddRoute(uri);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("angular-snippet-tools.createRoutesFile", createRoutesFile)
  );
}

// Create an Angular component and add it to the nearest routing file
async function createAndAddRoute(uri: vscode.Uri) {
  const name = await vscode.window.showInputBox({
    prompt: l10n.t("input.componentName"),
  });

  if (!name) {
    vscode.window.showWarningMessage(l10n.t("warning.noComponentName"));
    return;
  }

  const folder = uri.fsPath;
  const kebab = kebabCase(name);
  const isWindows = os.platform() === "win32";
  const separator = isWindows ? ";" : "&&";

  // Generate component via terminal
  const terminal = vscode.window.createTerminal(`ng-generate-component`);
  terminal.sendText(`cd "${folder}" ${separator} ng g c ${name} --standalone --skip-tests --flat`);
  terminal.show();

  // Find the nearest routing file
  const routesFile = findNearestRoutesFile(folder);
  if (!routesFile) {
    vscode.window.showWarningMessage(l10n.t("warning.noRoutesFile"));
    return;
  }

  // Build import path and route entry
  const useNewConvention = shouldUseNewNamingConvention(folder);
  const componentFileName = useNewConvention ? `${kebab}` : `${kebab}.component`;
  const relativeImportPath =
    "./" + path.relative(path.dirname(routesFile), path.join(folder, componentFileName)).replace(/\\/g, "/");
  const className = useNewConvention ? `${capitalize(name)}` : `${capitalize(name)}Component`;

  const newRoute = `  {
    path: '${kebab}',
    loadComponent: () => import('${relativeImportPath}').then(m => m.${className})
  },\n`;

  // Append the new route to the array in the routes file
  const content = fs.readFileSync(routesFile, "utf-8");
  const updatedContent = content.replace(/(\[)([\s\S]*?)(\])/m, (_, a, b, c) => `${a}\n${b}${newRoute}${c}`);
  fs.writeFileSync(routesFile, updatedContent, "utf-8");

  vscode.window.showInformationMessage(l10n.t("info.routeAdded", path.basename(routesFile)));
}

// Recursively search for a *.routes.ts file up the folder hierarchy
function findNearestRoutesFile(folder: string): string | null {
  const files = fs.readdirSync(folder);
  const found = files.find((file) => file.endsWith(".routes.ts"));
  if (found) return path.join(folder, found);

  const parent = path.dirname(folder);
  if (parent === folder) return null;

  return findNearestRoutesFile(parent);
}

// Check if Angular version is 17.2 or higher
function isAngular172OrHigher(version: string): boolean {
  const clean = version.replace(/[^0-9.]/g, "");
  const [major, minor] = clean.split(".").map(Number);
  return major > 17 || (major === 17 && minor >= 2);
}

// Recursively search for a package.json file
function findNearestPackageJson(folder: string): string | null {
  const file = path.join(folder, "package.json");
  if (fs.existsSync(file)) return file;

  const parent = path.dirname(folder);
  if (parent === folder) return null;

  return findNearestPackageJson(parent);
}

// Determine if new file naming convention should be used based on Angular version
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

// Convert PascalCase or camelCase to kebab-case
function kebabCase(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

// Create a new routing file with a default route
function createRoutesFile(uri: vscode.Uri) {
  vscode.window
    .showInputBox({
      prompt: l10n.t("input.routesFileName"),
    })
    .then((name) => {
      if (!name) {
        vscode.window.showWarningMessage(l10n.t("warning.routesFileNameMissing"));
        return;
      }

      const baseName = kebabCase(name.replace(/\.routes\.ts$/, ""));
      const constName = `${baseName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Routes`;

      // Create initial route content
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

function debugTest(context: vscode.ExtensionContext) {
  console.log("-------------------------------------------------------------------------------------------");
  console.log("-------------------------------------------------------------------------------------------");

  console.log("Debug test");

  // Check the path configured in package.json
  const extensionId = "angular-snippet-tools"; // Replace with your package.json "name"
  // const l10nPath = vscode.extensions.getExtension(extensionId)?.packageJSON.l10n;
  const l10nPath = path.join(context.extensionPath, "l10n");
  console.log("l10n path:", l10nPath); // Should print "./l10n" or the path you defined

  // Sample translation usage
  const message = l10n.t("test");
  console.log("Translated text:", message); // Should display the translation or the key if it fails

  console.log("Is bundle loaded?:", l10n.t("NO_EXISTE_CLAVE"));

  // 1. Check if the l10n folder exists in dist/

  console.log("l10n path:", l10nPath);
  console.log("Files in l10n:", fs.readdirSync(l10nPath));

  console.log("-------------------------------------------------------------------------------------------");
  console.log("-------------------------------------------------------------------------------------------");
}

// Clean up on extension deactivation
export function deactivate() {}
