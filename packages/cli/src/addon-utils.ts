export function mergeSharedAddonIntoFrontmatter(content: string): string {
  const sharedAddon = '@supaslidev/shared';
  const frontmatterMatch = content.match(/^(---\n)([\s\S]*?)\n(---)/);

  if (!frontmatterMatch) {
    return content;
  }

  const [fullMatch, openDelim, frontmatter, closeDelim] = frontmatterMatch;
  const restOfFile = content.slice(fullMatch.length);

  if (frontmatter.includes(sharedAddon)) {
    return content;
  }

  let updatedFrontmatter = frontmatter;

  const addonsMatch = frontmatter.match(/^(addons:\s*)(\[.*?\])?$/m);
  if (addonsMatch) {
    if (addonsMatch[2]) {
      const arrayContent = addonsMatch[2].slice(1, -1).trim();
      if (arrayContent === '') {
        updatedFrontmatter = frontmatter.replace(addonsMatch[0], `addons: ['${sharedAddon}']`);
      } else {
        updatedFrontmatter = frontmatter.replace(
          addonsMatch[0],
          `addons: [${arrayContent}, '${sharedAddon}']`,
        );
      }
    } else {
      const addonsBlockMatch = frontmatter.match(/^addons:\s*\n((?:  - .+\n?)*)/m);
      if (addonsBlockMatch) {
        const existingBlock = addonsBlockMatch[0].trimEnd();
        updatedFrontmatter = frontmatter.replace(
          existingBlock,
          `${existingBlock}\n  - '${sharedAddon}'`,
        );
      }
    }
  } else {
    const themeMatch = frontmatter.match(/^(theme:\s*.+)$/m);
    if (themeMatch) {
      updatedFrontmatter = frontmatter.replace(
        themeMatch[1],
        `${themeMatch[1]}\naddons:\n  - '${sharedAddon}'`,
      );
    }
  }

  if (updatedFrontmatter !== frontmatter) {
    return `${openDelim}${updatedFrontmatter}\n${closeDelim}${restOfFile}`;
  }

  return content;
}
