import { describe, it, expect } from 'vitest';
import { mergeSharedAddonIntoFrontmatter } from '../../src/addon-utils.js';

describe('mergeSharedAddonIntoFrontmatter', () => {
  describe('merging into empty addons array', () => {
    it('adds shared addon to empty inline array', () => {
      const content = `---
theme: default
addons: []
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(`---
theme: default
addons: ['@supaslidev/shared']
---

# Slide 1`);
    });
  });

  describe('merging into existing addons array with other addons', () => {
    it('appends shared addon to inline array with single addon', () => {
      const content = `---
theme: default
addons: ['other-addon']
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(`---
theme: default
addons: ['other-addon', '@supaslidev/shared']
---

# Slide 1`);
    });

    it('appends shared addon to inline array with multiple addons', () => {
      const content = `---
theme: seriph
addons: ['addon-a', 'addon-b']
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(`---
theme: seriph
addons: ['addon-a', 'addon-b', '@supaslidev/shared']
---

# Slide 1`);
    });

    it('appends shared addon to YAML list with single addon', () => {
      const content = `---
theme: default
addons:
  - other-addon
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(`---
theme: default
addons:
  - other-addon
  - '@supaslidev/shared'
---

# Slide 1`);
    });

    it('appends shared addon to YAML list with multiple addons', () => {
      const content = `---
theme: default
addons:
  - addon-a
  - addon-b
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(`---
theme: default
addons:
  - addon-a
  - addon-b
  - '@supaslidev/shared'
---

# Slide 1`);
    });
  });

  describe('handling when @supaslidev/shared already exists', () => {
    it('does not duplicate shared addon in inline array', () => {
      const content = `---
theme: default
addons: ['@supaslidev/shared']
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(content);
    });

    it('does not duplicate shared addon when mixed with other addons', () => {
      const content = `---
theme: default
addons: ['other-addon', '@supaslidev/shared']
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(content);
    });

    it('does not duplicate shared addon in YAML list', () => {
      const content = `---
theme: default
addons:
  - '@supaslidev/shared'
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(content);
    });

    it('does not duplicate shared addon in YAML list with other addons', () => {
      const content = `---
theme: default
addons:
  - other-addon
  - '@supaslidev/shared'
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(content);
    });
  });

  describe('handling when no addons key exists in frontmatter', () => {
    it('creates addons section after theme line', () => {
      const content = `---
theme: default
title: My Presentation
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(`---
theme: default
addons:
  - '@supaslidev/shared'
title: My Presentation
---

# Slide 1`);
    });

    it('creates addons section when only theme exists', () => {
      const content = `---
theme: seriph
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(`---
theme: seriph
addons:
  - '@supaslidev/shared'
---

# Slide 1`);
    });
  });

  describe('handling malformed or missing frontmatter', () => {
    it('returns content unchanged when frontmatter is missing', () => {
      const content = `# Slide 1

Some content without frontmatter`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(content);
    });

    it('returns content unchanged when only opening delimiter exists', () => {
      const content = `---
theme: default
# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(content);
    });

    it('returns content unchanged when frontmatter is empty', () => {
      const content = `---

---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(content);
    });

    it('returns content unchanged when no theme line exists', () => {
      const content = `---
title: My Presentation
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(content);
    });
  });

  describe('edge cases', () => {
    it('preserves content after frontmatter', () => {
      const content = `---
theme: default
---

# Slide 1

Content here

---

# Slide 2

More content`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(`---
theme: default
addons:
  - '@supaslidev/shared'
---

# Slide 1

Content here

---

# Slide 2

More content`);
    });

    it('handles quoted addon names in inline array', () => {
      const content = `---
theme: default
addons: ["double-quoted"]
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(`---
theme: default
addons: ["double-quoted", '@supaslidev/shared']
---

# Slide 1`);
    });

    it('handles frontmatter with complex content', () => {
      const content = `---
theme: default
title: Complex Presentation
info: |
  Multi-line
  info content
class: text-center
---

# Slide 1`;

      const result = mergeSharedAddonIntoFrontmatter(content);

      expect(result).toBe(`---
theme: default
addons:
  - '@supaslidev/shared'
title: Complex Presentation
info: |
  Multi-line
  info content
class: text-center
---

# Slide 1`);
    });
  });
});
