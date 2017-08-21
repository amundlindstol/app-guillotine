var eventLib = require('/lib/xp/event');
var portalLib = require('/lib/xp/portal');
var graphQlLib = require('/lib/graphql');

var contentTypesLib = require('./content-types');
var dictionaryLib = require('./dictionary');
var genericTypesLib = require('./generic-types');
var namingLib = require('./naming');
var graphQlRootQueryLib = require('./root-query');

eventLib.listener({
    type: 'application',
    localOnly: false,
    callback: function (event) {
        if ('STOPPED' === event.data.eventType || 'STARTED' === event.data.eventType) {
            invalidateSchemas();
        }
    }
});

var schemaMap = {};
exports.getSchema = function () {
    var siteId = portalLib.getSite()._id;
    var schema = schemaMap[siteId];
    if (!schema) {
        schema = createSchema();
        schemaMap[siteId] = schema;
    }
    return schema;
};

function createSchema() {
    genericTypesLib.createGenericTypes();
    contentTypesLib.createContentTypeTypes();
    return graphQlLib.createSchema({
        query: graphQlRootQueryLib.createRootQueryType(),
        dictionary: dictionaryLib.get()
    })
};

function invalidateSchemas() {
    schemaMap = {};
    namingLib.resetNameSet();
    dictionaryLib.reset();
}

