/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '*/presentations.json' {
  import type { Presentation } from './types';
  const presentations: Presentation[];
  export default presentations;
}

declare module '#imports' {
  export function useColorMode(): {
    preference: 'dark' | 'light' | 'system';
    readonly value: 'dark' | 'light';
    forced: boolean;
  };
}
