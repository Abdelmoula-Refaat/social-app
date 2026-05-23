"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const graphql_1 = require("graphql");
const authorization = async (roles, role) => {
    if (!roles.includes(role)) {
        throw new graphql_1.GraphQLError("unauthorization faild", {
            extensions: {
                code: "Forbidden",
                status: 403,
                message: "You don't have permission to access this resource"
            }
        });
    }
};
exports.authorization = authorization;
