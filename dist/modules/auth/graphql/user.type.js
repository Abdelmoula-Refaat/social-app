"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userType = exports.GenderType = void 0;
const graphql_1 = require("graphql");
exports.GenderType = new graphql_1.GraphQLEnumType({
    name: "genderType",
    values: {
        male: { value: "male" },
        female: { value: "female" },
    }
});
exports.userType = new graphql_1.GraphQLObjectType({
    name: "getUser",
    fields: {
        _id: { type: graphql_1.GraphQLID },
        firstName: { type: graphql_1.GraphQLString },
        lastName: { type: graphql_1.GraphQLString },
        email: { type: graphql_1.GraphQLString },
        phone: { type: graphql_1.GraphQLString },
        profilePicture: { type: graphql_1.GraphQLString },
        age: { type: graphql_1.GraphQLInt },
    }
});
