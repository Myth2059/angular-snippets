# 📦 Changelog - Angular Snippet Tools

All notable changes to this project will be documented here.

---

## [1.4.2] - 2025-06-14

### Fixed
- 🐛 Fixed a critical issue where the extension failed to activate on other machines with the error `Cannot find module '@vscode/l10n'`. This was caused by the `node_modules` folder not being properly included in the `.vsix` package. The packaging process now ensures all necessary dependencies are bundled.

## [1.4.1] 2025-06-13

### 🛠️ Fixes
- Cleaned up the `package.json` file to remove conflicting descriptions and potential blocked keywords by the VS Code Marketplace.
- Removed unnecessary `activationEvents` to ensure smooth verification and publishing.

## [1.4.0] 2025-06-08

### ✨ Added

- Executing Angular CLI commands using `child_process.spawn` for better performance and control.
- Visual loading feedback via `vscode.window.withProgress` when generating components or other elements.
- Full internationalization support using `@vscode/l10n`.
- English (`bundle.l10n.en.json`) and Spanish (`bundle.l10n.es.json`) localization files.
- Automatic detection of Angular version to apply naming conventions accordingly (e.g., skip `.component` in v17.2+).

### 🔧 Changed

- Replaced hardcoded strings with localized `l10n.t(...)` calls.
- Removed terminal dependency and eliminated visible messages like `echo Angular CLI ready`.
- Cleaned up unused utility (`getCommandSeparator`) since it's no longer needed with `spawn`.

### 🧹 Removed

- Legacy `sendText` terminal usage and shell separator handling logic.

### 📌 Notes

These changes greatly improve performance, usability, and i18n-readiness for cross-language environments.

## [1.3.0] - 2025-06-06

### ✅ Improvements

- Angular generation commands (component, service, etc.) now execute silently in the background using `exec`, instead of opening persistent VS Code terminals.
- Improved UX: terminals no longer stay open after generation commands.
- Code refactored to maintain clarity and separation of logic.

### 🧠 Technical notes

- Replaced `vscode.window.createTerminal().sendText()` with Node.js `child_process.exec`.
- Maintained full support for `l10n` internationalization.

---

## [1.2.0] - 2025-06-05

### 🎉 Features

- `Create and Add to Route`: Generates a component and appends it to the nearest routes file.
- `Create Routes File`: Creates a new `.routes.ts` file with a default route scaffold.

---

## [1.0.0] - 2025-06-01

### 🚀 Initial Release

- Context menu generation for Angular elements (component, service, pipe, etc.).
- Support for Angular 17.2+ naming conventions.
- Multi-language support via `.l10n` bundle files.
