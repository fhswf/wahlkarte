module.exports = {
    "plugins": [
        "jsdoc",
        "flowtype",
    ],
    "extends": [
        "eslint:recommended",
        "plugin:jsdoc/recommended",
        "plugin:flowtype/recommended",
    ],
    "parser": "@babel/eslint-parser",
    "env": {
        "browser": true,
        "node": true,
        "es6": true,
    },
    "parserOptions": {
        "ecmaVersion": 2020,
        "sourceType": "module",
        "requireConfigFile": false,
    },
    "rules": {
        "indent": ["error", 4],
        "linebreak-style": ["error", (require("os").EOL === "\r\n" ? "windows" : "unix")], // https://stackoverflow.com/a/39122799
        "semi": ["error", "always", { "omitLastInOneLineBlock": true}],
        "jsdoc/require-jsdoc": [1, {
            "require": {
                "ClassDeclaration": true,
                "FunctionDeclaration": true,
                "MethodDefinition": true,
            },
            "checkGetters": false,
            "checkSetters": true,
        }],
    }
};