"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gql_Schema = void 0;
const graphql_1 = require("graphql");
const user_fields_1 = __importDefault(require("../auth/graphql/user.fields"));
exports.gql_Schema = new graphql_1.GraphQLSchema({
    query: new graphql_1.GraphQLObjectType({
        name: "query",
        fields: {
            ...user_fields_1.default.query()
        }
    }),
});
