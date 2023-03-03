const bean = __.newBean('com.enonic.app.guillotine.handler.UrlHandler');

function checkRequired(obj, name) {
    if (obj == null || obj[name] === undefined) {
        throw `Parameter '${name}' is required`;
    }
}

exports.assetUrl = function (path, type) {
    return __.toNativeObject(bean.assetUrl(path, type));
};

exports.imageUrl = function (params) {
    checkRequired(params, 'id');
    checkRequired(params, 'scale');

    return __.toNativeObject(bean.imageUrl(__.toScriptValue(params)));
};

exports.attachmentUrl = function (params) {
    checkRequired(params, 'id');

    return __.toNativeObject(bean.attachmentUrl(__.toScriptValue(params)));
};

