"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyParanoidPlugin = applyParanoidPlugin;
function applyParanoidPlugin(schema) {
    const withParanoid = function () {
        const opts = this.options;
        if (opts?.paranoid === false) {
            return;
        }
        const filter = this.getFilter();
        if (filter?.paranoid === false) {
            const { paranoid: _p, ...rest } = filter;
            this.setQuery(rest);
            return;
        }
        if (filter && Object.prototype.hasOwnProperty.call(filter, "deletedAt")) {
            return;
        }
        this.where({ deletedAt: { $exists: false } });
    };
    const hooks = [
        "find",
        "findOne",
        "findOneAndUpdate",
        "findOneAndDelete",
        "countDocuments",
        "estimatedDocumentCount",
    ];
    for (const h of hooks) {
        schema.pre(h, withParanoid);
    }
}
