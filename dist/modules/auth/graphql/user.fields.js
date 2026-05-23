"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserFields = void 0;
const graphql_1 = require("graphql");
const user_type_1 = require("./user.type");
const auth_service_1 = __importDefault(require("../auth.service"));
const authentication_1 = require("../../../common/middleware/authentication");
const authorization_1 = require("../../../common/middleware/authorization");
const validation_1 = require("../../../common/middleware/validation");
const auth_vaildation_1 = require("../auth.vaildation");
class UserFields {
    constructor() { }
    query = () => {
        return {
            listUsers: {
                type: new graphql_1.GraphQLList(user_type_1.userType),
                resolve: () => {
                    return auth_service_1.default.getUsers();
                }
            },
            getUser: {
                type: user_type_1.userType,
                args: {
                    token: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) }
                },
                resolve: async (parent, args, context) => {
                    await (0, validation_1.validation_gql)(auth_vaildation_1.getUserSchema, args);
                    const { user } = await (0, authentication_1.authentication_gql)(args.token);
                    await (0, authorization_1.authorization)(["user"], user.role);
                    return await auth_service_1.default.getUser(user._id);
                }
            }
        };
    };
    mutation = () => {
        return {};
    };
}
exports.UserFields = UserFields;
exports.default = new UserFields();
