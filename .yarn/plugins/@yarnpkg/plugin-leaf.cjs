/* eslint-disable */
try {
    module.exports = require("../../../bundles/@yarnpkg/plugin-leaf");
} catch(e) {
    module.exports = {
        name: "@yarnpkg/plugin-leaf",
        factory: function (require) {
            return {}
        }
    }
}