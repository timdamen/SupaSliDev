export default defineAppConfig({
  docus: {
    locale: 'en',
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
