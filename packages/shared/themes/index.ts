export const themes = ['default', 'corporate', 'vibrant'] as const

export type ThemeName = (typeof themes)[number]

export function getThemePath(theme: ThemeName): string {
  return `@supaslidev/shared/themes/${theme}.css`
}
