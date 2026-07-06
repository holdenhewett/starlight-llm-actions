// Ambient shims so the plugin can typecheck in isolation (`tsc -p
// tsconfig.build.json`).
//
// `index.ts` imports `StarlightPlugin` from `@astrojs/starlight/types`, which
// Starlight ships as raw `.ts` source rather than compiled `.d.ts`. Importing it
// pulls Starlight's internal source into our program, and that source references
// build-time virtual modules and the `StarlightApp` namespace that only exist
// inside a running Astro build (Starlight injects them via `astro sync`; they are
// never emitted into a consumer's `.astro/` types, and `virtual.d.ts` is not a
// package export). Starlight acknowledges this friction in a TODO in its own
// `virtual.d.ts`. These stubs satisfy those references without a running build.

/// <reference types="astro/client" />

declare namespace StarlightApp {
  interface I18n {}
}

declare module 'virtual:starlight/user-config' {
  const Config: any;
  export default Config;
}

declare module 'virtual:starlight/project-context' {
  const ProjectContext: any;
  export default ProjectContext;
}

declare module 'virtual:starlight/plugin-translations' {
  const PluginTranslations: any;
  export default PluginTranslations;
}
