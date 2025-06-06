# 🧩 Extensión Angular Snippets para VS Code

Una poderosa extensión para Visual Studio Code que simplifica el desarrollo en Angular, permitiéndote **generar componentes, servicios, pipes, directivas y más** directamente desde el menú contextual.

---

## 🚀 Clic derecho para generar elementos de Angular

- Componente
- Directiva
- Guard
- Interceptor
- Pipe
- Servicio

---

## 🧩 Comandos adicionales

- **Crear y Agregar a la Ruta**: Genera un componente standalone y lo agrega automáticamente al archivo `*.routes.ts` más cercano.
- **Crear Archivo de Rutas**: Crea un archivo de rutas con una estructura inicial y un componente cargado de forma lazy.

---

## 🌐 Internacionalización (i18n)

Esta extensión usa la API de localización de VS Code mediante `@vscode/l10n`. Los bundles están ubicados en la carpeta `/l10n`.

- EN (por defecto)
- ES (`bundle.l10n.es.json`)

Para extraer y gestionar las cadenas traducibles:

```bash
npx @vscode/l10n-dev export -o ./l10n ./src
```

Agrega versiones traducidas como:

```
bundle.l10n.es.json
bundle.l10n.en.json
```

---

## 🧠 Tecnologías Utilizadas

- TypeScript
- APIs de Node.js (fs, path, os)
- API de VS Code
- @vscode/l10n
- Yeoman Generator para scaffolding

---

## 📦 Requisitos

- Angular CLI instalado globalmente (`npm install -g @angular/cli`)
- Node.js y npm

---

## 🛠 ¿Cómo usarla?

1. Haz clic derecho sobre una carpeta en el explorador.
2. Selecciona una de las opciones de generación Angular.
3. Para componentes, se agregarán automáticamente al archivo `*.routes.ts` más cercano.

---

## 📁 Estructura del Proyecto

```
angular-snippet-tools/
├── src/
│   └── extension.ts
├── l10n/
│   ├── bundle.l10n.en.json
│   └── bundle.l10n.es.json
├── translations/
├── vscode.nls.json
├── README.md
├── LICENSE
└── package.json
```

---

## 🧑‍💻 Autor

Michael González — [LinkedIn](https://www.linkedin.com/in/myth-dev)  
Extensión desarrollada con ❤️ y TypeScript

---

## 📄 Licencia

Licencia MIT. Puedes usar, modificar y distribuir esta extensión, pero **debes dar crédito al autor original**.

---

## ✨ Contribuciones

Eres bienvenido a enviar PRs y reportar errores. Si agregas soporte para más idiomas o funciones, menciona al autor original en tus cambios.

---

## 📤 Publicación

Para empaquetar y publicar la extensión:

```bash
vsce package
vsce publish
```

Asegúrate de actualizar los campos de `package.json` como `publisher`, `engines`, `categories` y `contributes`.

---

¡Disfruta desarrollando apps Angular más rápido! 🎉