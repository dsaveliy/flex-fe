/**
 * Позволяет TypeScript импортировать SCSS-файлы (только побочный эффект,
 * без экспортируемых значений) — сама компиляция/инъекция стилей в <head>
 * выполняется Metro на этапе бандлинга веб-платформы, см.
 * https://docs.expo.dev/versions/latest/config/metro/#sass
 */
declare module '*.scss' {
  const content: void;
  export default content;
}
