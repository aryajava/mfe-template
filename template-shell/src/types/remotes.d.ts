declare module 'childMFE/Module' {
  const Module: React.ComponentType<{ basePath?: string; subRoute?: string }>;
  export default Module;
}

declare module 'mfeHallo/Module' {
  const Module: React.ComponentType<{ basePath?: string; subRoute?: string }>;
  export default Module;
}
