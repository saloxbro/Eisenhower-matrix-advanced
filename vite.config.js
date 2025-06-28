import { resolve } from 'path';

export default {
  root: 'src',
  build: {
    // This tells Vite to build the project into a `dist` folder in the project root.
    outDir: resolve(__dirname, '..', 'dist'),
    // Ensure the output directory is cleared before each build.
    emptyOutDir: true,
  },
};
