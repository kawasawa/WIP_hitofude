export const Theme = { system: 'system', light: 'light', dark: 'dark' };
export type Theme = typeof Theme[keyof typeof Theme];

export const LanguageMode = {
  plaintext: 'Plain Text',
  markdown: 'Markdown',
  json: 'JSON',
  yaml: 'YAML',
  xml: 'XML',
  ini: 'INI',
  dockerfile: 'Dockerfile',
  shell: 'Shellscript',
  powershell: 'PowerShell',
  bat: 'Batch',
};
export type LanguageMode = typeof LanguageMode[keyof typeof LanguageMode];

export const SettingsKeys = {
  theme: 'theme',
  text: 'text',
  languageMode: 'languageMode',
  fontSize: 'fontSize',
  lineNumber: 'lineNumber',
  minimap: 'minimap',
  lineHighlight: 'lineHighlight',
  bracketPairsHighlight: 'bracketPairsHighlight',
  validation: 'validation',
  wordWrap: 'wordWrap',
  autoSave: 'autoSave',
  autoSaveDelay: 'autoSaveDelay',
};
