const { mergeConfig } = require("vite");
const path = require("path");

module.exports = {
  stories: ["../stories/**/*.stories.mdx"],

  framework: "@storybook/react",

  addons: [
    "@storybook/preset-create-react-app",
    "@storybook/addon-controls",
    "@storybook/addon-docs",
  ],

  core: {
    builder: "@storybook/builder-vite",
  },

  features: {
    storyStoreV7: true,
    previewMdx2: true,
  },

  async viteFinal(config) {
    return mergeConfig(config, {
      base: "./",

      resolve: {
        alias: {
          assert: path.resolve(__dirname, "./assert_fallback.cjs"),
        },
      },
    });
  },
};
