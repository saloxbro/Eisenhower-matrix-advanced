// vite.config.js

export default {
  // Keep the source code root as 'src'
  root: 'src',

  build: {
    // Set the output directory to go one level up from 'src' to the project root.
    outDir: '../dist',
    // It's good practice to ensure the output directory is cleared on each build.
    emptyOutDir: true,
  }
};
