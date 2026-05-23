import { GraphQLEnumType, GraphQLID, GraphQLInt, GraphQLObjectType, GraphQLString } from "graphql";


export const GenderType = new GraphQLEnumType({
    name: "genderType",
    values: {
        male: { value: "male"},
        female: { value: "female"},
    }
})
export const userType = new GraphQLObjectType({
    name: "getUser",
    fields: {
        _id: { type: GraphQLID},
        firstName: { type: GraphQLString},
        lastName: { type: GraphQLString},
        email: { type: GraphQLString},
        phone: { type: GraphQLString},
        profilePicture: { type: GraphQLString},
        age: { type: GraphQLInt},
    }
})