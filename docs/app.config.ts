export default defineAppConfig({
  docus: {
    locale: 'en',
  },
  ui: {
    prose: {
      pre: {
        slots: {
          root: 'relative my-5 group',
          base: 'font-mono text-sm border border-muted bg-muted rounded-md px-4 py-3 overflow-x-auto',
          copy: 'absolute top-2.5 right-2.5',
        },
      },
    },
  },
  seo: {
    titleTemplate: '%s - Supaslidev',
    title: 'Supaslidev',
    description: 'A monorepo toolkit for managing multiple Slidev presentations with ease.',
  },
  header: {
    title: 'Supaslidev',
    logo: {
      light: '/ssl-logo.png',
      dark: '/ssl-logo.png',
      alt: 'Supaslidev Logo',
    },
  },
  socials: {
    github: 'https://github.com/timdamen/supaSliDev',
  },
  github: {
    url: 'https://github.com/timdamen/supaSliDev',
    branch: 'main',
    rootDir: 'docs',
  },
});
