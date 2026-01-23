export default {
  extends: '../../release.config.js',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: true,
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
        message:
          'chore(release): @supaslidev/dashboard@${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
  tagFormat: '@supaslidev/dashboard@${version}',
};
