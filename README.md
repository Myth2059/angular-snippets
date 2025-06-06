# 🧩 Angular Snippets Extension for VS Code

A powerful Visual Studio Code extension that simplifies Angular development by allowing you to **generate components, services, pipes, directives**, and more—directly from the context menu.

---

## 🚀 Features

- ✅ Right-click to generate Angular elements:
  - Component
  - Directive
  - Guard
  - Interceptor
  - Pipe
  - Service
- ✅ Supports **standalone components**.
- ✅ Automatically adds generated components to the nearest routing file (`*.routes.ts`).
- ✅ Multi-language support using `@vscode/l10n`.
- ✅ Bundled with `i18n` and `l10n` for localized experiences.

---

## 🌐 Internationalization (i18n)

This extension uses VS Code’s new localization API via `@vscode/l10n`. Bundles are located in the `/l10n` folder.

- EN (default)
- ES (bundle.l10n.es.json)

To extract and manage translation strings:

```bash
npx @vscode/l10n-dev export -o ./l10n ./src
```

---

## 📦 Requirements

- Angular CLI installed globally (`npm install -g @angular/cli`)
- Node.js and npm

---

## 🛠 How to Use

1. Right-click a folder in the Explorer.
2. Select one of the Angular generation options.
3. For components, they will be added to the closest `*.routes.ts` file automatically.

---

## 📁 Project Structure

```
angular-snippet-tools/
├── l10n/                      # Language bundles
├── src/                       # Extension logic
│   └── extension.ts
├── package.json               # Extension metadata
├── vscode.nls.json            # Locale mapping
└── README.md
```

---

## 🧑‍💻 Author

Michael González — [LinkedIn](https://www.linkedin.com/in/myth-dev)  
Extension developed with ❤️ and TypeScript

---

## 📄 License

MIT License. You are free to use, modify, and distribute this extension, but **credit to the original author must be preserved**.
