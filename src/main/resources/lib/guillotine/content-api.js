var contentLib = require('/lib/xp/content');
var portalLib = require('/lib/xp/portal');
var graphQlLib = require('/lib/graphql');
var graphQlConnectionLib = require('/lib/graphql-connection');

var contentTypesLib = require('./content-types');
var namingLib = require('./naming');
var securityLib = require('./security');

exports.createContentApiType = function (context) {
    return graphQlLib.createObjectType({
        name: context.uniqueName('ContentApi'),
        description: 'Content API',
        fields: {
            get: {
                type: context.types.contentType,
                args: {
                    key: graphQlLib.GraphQLID
                },
                resolve: getContent
            },
            getChildren: {
                type: graphQlLib.list(context.types.contentType),
                args: {
                    key: graphQlLib.GraphQLID,
                    offset: graphQlLib.GraphQLInt,
                    first: graphQlLib.GraphQLInt,
                    sort: graphQlLib.GraphQLString
                },
                resolve: function (env) {
                    var parent = getContent(env);
                    if (parent) {
                        return contentLib.getChildren({
                            key: parent._id,
                            start: env.args.offset,
                            count: env.args.first,
                            sort: env.args.sort
                        }).hits;
                    } else {
                        return [];
                    }
                }
            },
            getChildrenConnection: {
                type: context.types.contentConnectionType,
                args: {
                    key: graphQlLib.GraphQLID,
                    after: graphQlLib.GraphQLString,
                    first: graphQlLib.GraphQLInt,
                    sort: graphQlLib.GraphQLString
                },
                resolve: function (env) {
                    var parent = getContent(env);
                    if (parent) {
                        var start = env.args.after ? parseInt(graphQlConnectionLib.decodeCursor(env.args.after)) + 1 : 0;
                        var getChildrenResult = contentLib.getChildren({
                            key: parent._id,
                            start: start,
                            count: env.args.first,
                            sort: env.args.sort
                        });
                        return {
                            total: getChildrenResult.total,
                            start: start,
                            hits: getChildrenResult.hits
                        };
                    } else {
                        var start = env.args.after ? parseInt(graphQlConnectionLib.decodeCursor(env.args.after)) + 1 : 0;
                        return {
                            total: 0,
                            start: start,
                            hits: 0
                        };
                    }
                    
                }
            },
            getPermissions: {
                type: createPermissionsType(context),
                args: {
                    key: graphQlLib.GraphQLID
                },
                resolve: function (env) {
                    var content = getContent(env);
                    if (content) {
                        return contentLib.getPermissions({
                            key: content._id
                        });
                    } else {
                        return null;
                    }
                }
            },
            getSite: {
                type: graphQlLib.reference('Site'),
                resolve: function (env) {
                    return portalLib.getSite();
                }
            },
            query: {
                type: graphQlLib.list(context.types.contentType),
                args: {
                    query: graphQlLib.nonNull(graphQlLib.GraphQLString),
                    offset: graphQlLib.GraphQLInt,
                    first: graphQlLib.GraphQLInt,
                    sort: graphQlLib.GraphQLString,
                },
                resolve: function (env) {
                    return contentLib.query({
                        query: securityLib.adaptQuery(env.args.query),
                        start: env.args.offset,
                        count: env.args.first,
                        sort: env.args.sort
                    }).hits;
                }
            },
            queryConnection: {
                type: context.types.contentConnectionType,
                args: {
                    query: graphQlLib.nonNull(graphQlLib.GraphQLString),
                    after: graphQlLib.GraphQLString,
                    first: graphQlLib.GraphQLInt,
                    sort: graphQlLib.GraphQLString
                },
                resolve: function (env) {
                    var start = env.args.after ? parseInt(graphQlConnectionLib.decodeCursor(env.args.after)) + 1 : 0;
                    var queryResult = contentLib.query({
                        query: securityLib.adaptQuery(env.args.query),
                        start: start,
                        count: env.args.first,
                        sort: env.args.sort
                    });
                    return {
                        total: queryResult.total,
                        start: start,
                        hits: queryResult.hits
                    };
                }
            },
            getTypes: {
                type: graphQlLib.list(context.types.contentTypeType),
                resolve: function () {
                    return contentTypesLib.getAllowedContentTypes();
                }
            }
        }
    });
};

function createPermissionsType(context) {
    return graphQlLib.createObjectType({
        name: context.uniqueName('Permissions'),
        description: 'Permissions.',
        fields: {
            inheritsPermissions: {
                type: graphQlLib.GraphQLBoolean
            },
            permissions: {
                type: graphQlLib.list(context.types.accessControlEntryType)
            }
        }
    })
};

function getContent(env) {
    if (env.args.key) {
        var content = contentLib.get({
            key: env.args.key
        });
        return content && securityLib.filterForbiddenContent(content);
    } else {
        return portalLib.getContent();   
    }
}