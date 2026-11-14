import { defineConfig } from 'vitest/config';

// Runs tools/sheet.ts, which writes a contact sheet of every drawing to preview/ (not committed).
export default defineConfig({
  test: {
    include: ['tools/sheet.ts'],
  },
});
