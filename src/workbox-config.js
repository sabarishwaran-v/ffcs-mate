module.exports = {
    globDirectory: 'dist/',
    globPatterns: ['**/*.{css,svg,ttf,woff2,eot,woff,json,png,html,js}'],
    swDest: 'dist/sw.js',
    maximumFileSizeToCacheInBytes: 10000000,
    skipWaiting: true,
    cleanupOutdatedCaches: true,
    offlineGoogleAnalytics: true,
    sourcemap: true,
};
