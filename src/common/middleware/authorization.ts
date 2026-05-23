import { GraphQLError } from "graphql";


export const authorization = async (roles: string[], role: string) => {
    if(!roles.includes(role)) {
        throw new GraphQLError("unauthorization faild", {
            extensions: {
                code: "Forbidden",
                status: 403,
                message: "You don't have permission to access this resource"
            }
        });
    }
}