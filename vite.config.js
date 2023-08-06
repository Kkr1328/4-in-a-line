const { resolve } = require("path");

module.exports = {
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                online: resolve(__dirname, "online.html"),
                home: resolve(__dirname, "home.html"),
                market: resolve(__dirname, "market.html"),
                rule: resolve(__dirname, "rule.html"),
                winResult: resolve(__dirname, "winResult.html"),
                history: resolve(__dirname, "history.html"),
                offline: resolve(__dirname, "offline.html"),
            },
        },
    },
    sourcemap: true,
};
