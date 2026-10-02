/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-engine-imports-game',
      comment:
        'Engine layer must NEVER import from game layer. Engine is generic infrastructure.',
      severity: 'error',
      from: { path: '^src/engine/' },
      to: { path: '^src/game/' },
    },
    {
      name: 'no-engine-imports-content',
      comment: 'Engine layer must NOT import from content (data) layer.',
      severity: 'error',
      from: { path: '^src/engine/' },
      to: { path: '^src/content/' },
    },
    {
      name: 'no-engine-imports-ui',
      comment: 'Engine layer must NOT import from UI layer.',
      severity: 'error',
      from: { path: '^src/engine/' },
      to: { path: '^src/ui/' },
    },
    {
      name: 'no-content-imports-game',
      comment: 'Content (data) layer must NOT import from game logic.',
      severity: 'error',
      from: { path: '^src/content/' },
      to: { path: '^src/game/' },
    },
  ],
  options: {
    moduleSystems: ['es6'],
    tsPreCompilationDeps: true,
    tsConfig: { fileName: './tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      dot: { collapsePattern: 'node_modules/.*' },
    },
  },
};
