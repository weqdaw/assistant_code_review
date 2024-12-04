const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  devServer: {
    port: 9090,
  },
  transpileDependencies: ['mermaid']
})
