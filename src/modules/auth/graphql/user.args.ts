import { GraphQLInt, GraphQLString, GraphQLNonNull } from "graphql";
import { GenderType } from "./user.type";


export const getUserArgs =  {
    id: { type: new GraphQLNonNull(GraphQLInt) }
}

export const createUserArgs = {
     id: { type: new GraphQLNonNull(GraphQLInt) },
     age: { type: new GraphQLNonNull(GraphQLInt) },
     name: { type: new GraphQLNonNull(GraphQLString) },
     gender: { type: new GraphQLNonNull(GenderType) } 
}