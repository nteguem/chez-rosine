module.exports = {
    env: {
      node: true,
      es2021: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:security/recommended', // Plugin de sécurité
      'plugin:node/recommended', // Recommandations spécifiques pour Node.js
      'airbnb-base' // Base de règles d'Airbnb
    ],
    plugins: [
      'security',
      'node',
      'import',
      'promise'
    ],
    rules: {
      // Vérifie l'absence de variables inutilisées
      'no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: false }],
      'no-undef': 'error', // Interdit l'utilisation de variables non définies
      'no-console': 'warn', // Avertissement pour console.log, remplacez par un logger en production
      'no-debugger': 'error', // Interdit debugger en production
      'no-eval': 'error', // Interdit eval pour éviter l'exécution de code non sûr
      'security/detect-object-injection': 'error', // Empêche les injections d'objets
      'security/detect-non-literal-fs-filename': 'warn', // Alerte sur les chemins de fichiers non littéraux pour éviter les injections
      'node/no-unpublished-require': 'off', // Désactivé si vous avez des dépendances de développement spécifiques
      'node/no-extraneous-require': 'error', // Empêche les require de modules non déclarés dans package.json
      'import/no-extraneous-dependencies': ['error', { devDependencies: false }], // Interdit les dépendances inutiles
      'promise/always-return': 'error', // Assure que les promesses ont un retour
      'promise/no-return-wrap': 'error', // Empêche d'envelopper les valeurs dans Promise.resolve ou reject
      'promise/param-names': 'error', // Enforce le bon usage de resolve/reject
      'strict': ['error', 'global'], // Active le mode strict globalement
      'eqeqeq': ['error', 'always'], // Oblige l'utilisation de === et !==
      'curly': ['error', 'all'], // Exige des accolades même pour les instructions à une seule ligne
      'no-var': 'error', // Interdit var, favorise let et const
      'prefer-const': 'error', // Privilégie const lorsque c’est possible
      'no-prototype-builtins': 'warn', // Prévient les erreurs sur les prototypes d’objets
      'no-shadow': 'error', // Empêche la redéclaration de variables dans un scope enfant
      'no-return-await': 'error', // Empêche le retour des promesses déjà en attente
      'no-restricted-syntax': [
        'error',
        'ForInStatement', // Évite les boucles for...in pour des raisons de sécurité et de performance
        'WithStatement' // Interdit l’utilisation de with pour éviter les ambiguïtés
      ]
    }
  };
  