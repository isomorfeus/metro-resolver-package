"use strict";

const fs = require('fs');
const MetroResolver = require('metro-resolver');
const OwlResolver = require('opal-webpack-loader/resolver');

let RubyResolver;

function ruby_does_file_exist_function(context) {
    context.original_doesFileExist = context.doesFileExist;
    context.doesFileExist = function(file) {
        if (file.endsWith('.rb') || file.endsWith('opal/corelib/runtime.js')) {
            try { return fs.statSync(file).isFile(); }
            catch { return false; }
        } else {
            return context.original_doesFileExist(file);
        }
    };
    return context;
}

function init() {
    // this sets process.env.OWL_TMPDIR, required by the transformer to find load path cache.
    RubyResolver = new OwlResolver('resolve', 'resolved');
}

function resolve(context, real_module_name, platform, module_name) {
    let localContext;
    if (real_module_name.endsWith('.rb')) {
        let resolved_ruby_module_path = RubyResolver.get_absolute_path('', real_module_name);
        localContext = Object.assign({}, context, {resolveRequest: false});
        localContext = ruby_does_file_exist_function(localContext);
        return MetroResolver.resolve(localContext, resolved_ruby_module_path, platform);
    } else if (real_module_name.endsWith('opal/corelib/runtime.js')) {
        localContext = Object.assign({}, context, {resolveRequest: false});
        localContext = ruby_does_file_exist_function(localContext);
        return MetroResolver.resolve(localContext, real_module_name, platform);
    } else if (real_module_name.endsWith('corelib/random/mersenne_twister.js')) {
        let resolved_ruby_module_path = RubyResolver.get_absolute_path('', real_module_name + '.rb')
        localContext = Object.assign({}, context, {resolveRequest: false});
        localContext = ruby_does_file_exist_function(localContext);
        return MetroResolver.resolve(localContext, resolved_ruby_module_path, platform);
    } else {
        localContext = Object.assign({}, context, { resolveRequest: false });
        return MetroResolver.resolve(localContext, module_name || real_module_name, platform);
    }
}

module.exports.init = init;
module.exports.resolve = resolve;
