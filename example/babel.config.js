module.exports = {
    "plugins": [
        [
            require('../lib/index'),
            {
                "exclude": []
            }
        ]
    ],
    "ignore": [
        "./src/exclude.js",
    ]
};
