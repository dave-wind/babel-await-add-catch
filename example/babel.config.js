module.exports = {
    "plugins": [
        [
            require('../lib/index'),
            {
                "exclude": ['exclude'],
                "include": ['index','index2'],
                "customLog": 'My name is Dave Jones'
            }
        ]
    ]
};
