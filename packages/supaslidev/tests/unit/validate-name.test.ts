import { describe, it, expect } from 'vitest';
import { validateName } from '../../src/cli/commands/import.js';

describe('validateName', () => {
  it('rejects names with uppercase letters', () => {
    expect(() => validateName('MyPresentation')).toThrow(
      'Name must be lowercase alphanumeric with hyphens only',
    );
    expect(() => validateName('UPPERCASE')).toThrow(
      'Name must be lowercase alphanumeric with hyphens only',
    );
    expect(() => validateName('mixedCase')).toThrow(
      'Name must be lowercase alphanumeric with hyphens only',
    );
  });

  it('rejects names with special characters', () => {
    expect(() => validateName('my_presentation')).toThrow(
      'Name must be lowercase alphanumeric with hyphens only',
    );
    expect(() => validateName('my.presentation')).toThrow(
      'Name must be lowercase alphanumeric with hyphens only',
    );
    expect(() => validateName('my@presentation')).toThrow(
      'Name must be lowercase alphanumeric with hyphens only',
    );
    expect(() => validateName('my presentation')).toThrow(
      'Name must be lowercase alphanumeric with hyphens only',
    );
  });

  it('rejects names with leading hyphens', () => {
    expect(() => validateName('-my-presentation')).toThrow(
      'Name cannot start or end with a hyphen',
    );
    expect(() => validateName('-presentation')).toThrow('Name cannot start or end with a hyphen');
  });

  it('rejects names with trailing hyphens', () => {
    expect(() => validateName('my-presentation-')).toThrow(
      'Name cannot start or end with a hyphen',
    );
    expect(() => validateName('presentation-')).toThrow('Name cannot start or end with a hyphen');
  });

  it('accepts valid lowercase-hyphenated names', () => {
    expect(() => validateName('my-presentation')).not.toThrow();
    expect(() => validateName('my-awesome-slides')).not.toThrow();
    expect(() => validateName('intro-to-vue-3')).not.toThrow();
  });

  it('accepts valid lowercase names without hyphens', () => {
    expect(() => validateName('presentation')).not.toThrow();
    expect(() => validateName('slides')).not.toThrow();
    expect(() => validateName('demo2024')).not.toThrow();
  });
});
