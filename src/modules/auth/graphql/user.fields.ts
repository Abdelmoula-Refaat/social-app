
import { GraphQLList, GraphQLString, GraphQLNonNull } from "graphql";
import { userType } from "./user.type";
import authService from "../auth.service";
import { authentication_gql } from "../../../common/middleware/authentication";
import { authorization } from "../../../common/middleware/authorization";
import { validation_gql } from "../../../common/middleware/validation";
import { getUserSchema } from "../auth.vaildation";



export class UserFields {

    constructor() {}

    query = () => {
        return {
            listUsers: {
                type: new GraphQLList(userType),
                resolve: () => {
                    return authService.getUsers();
                }
            },
            getUser: {
                type: userType,
                args: {
                    token: { type: new GraphQLNonNull(GraphQLString) }
                },
                resolve: async (parent: any, args: any, context: any) => {
                    await validation_gql(getUserSchema, args);
                    const { user } = await authentication_gql(args.token);

                    await authorization(["user"], user.role!);

                    return await authService.getUser(user._id);
                }
            }
        }
    }

    mutation = () => {
        return {};
    }
    
}

export default new UserFields();