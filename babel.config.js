module.exports = api => {
  api.cache(true);

  return {
    "presets": [
      "@babel/preset-typescript",
      [
        "@babel/env",
        {
          "useBuiltIns": "usage",
          "corejs": 3,
          "modules": "commonjs",
          "targets": {
            "node": "4.0"
          }
        }
      ]
    ],
    "plugins": [
      [
        "@babel/plugin-transform-runtime",
        {
          "corejs": false,
          "helpers": true,
          "regenerator": true,
          "useESModules": false
        }
      ],
      ["@babel/plugin-proposal-class-properties", { "loose": true }]
    ]
  }
}