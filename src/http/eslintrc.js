// .eslintrc.js
module.exports = {
  rules: {
    // Catches: fetch(url)
    "no-restricted-globals": [
      "error",
      {
        name: "fetch",
        message:
          "Use the http wrapper instead. Direct fetch is only needed for streaming, blobs, or non-JSON responses.",
      },
    ],
    // Catches: window.fetch(url), globalThis.fetch(url)
    "no-restricted-properties": [
      "error",
      {
        object: "window",
        property: "fetch",
        message:
          "Use the http wrapper instead. Direct fetch is only needed for streaming, blobs, or non-JSON responses.",
      },
      {
        object: "globalThis",
        property: "fetch",
        message:
          "Use the http wrapper instead. Direct fetch is only needed for streaming, blobs, or non-JSON responses.",
      },
    ],
  },
  overrides: [
    {
      // The http wrapper itself needs direct fetch access
      files: ["**/http.ts"],
      rules: {
        "no-restricted-globals": "off",
        "no-restricted-properties": "off",
      },
    },
  ],
};
