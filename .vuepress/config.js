let basePath = process.env.BASE_PATH || '/';

module.exports = {
    title: 'Aeternity Downloads',
    description: 'Aeternity',
    themeConfig: {
        search: false,
    },
    base: basePath,
    plugins: [
        '@vuepress/register-components',
    ],
}
