import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import RedisService from "../../common/service/redis.service";
import { decodedToken_and_fetchUser } from "../../common/middleware/authentication";
import chatGateway from "../chat/realtime/chat.gateway";

class SocketGateway {

    constructor () { }

    initIo = async (httpServer : HttpServer) => {
        const io = new Server(httpServer, {
        cors: {
            origin: "*"
        }
    });

   io.use(async (socket, next) => {
    
    try {
        console.log(socket.handshake.auth.authorization);
        
        const { user } = await decodedToken_and_fetchUser(
            socket.handshake.auth.authorization || socket.handshake.headers.authorization
        );

        socket.data.user = user;

        next();

    } catch (error: any) {
        next(error);
    }
    
   })
    
    io.on("connection", async (socket) => {

        RedisService.addSocket({ userId: socket.data.user._id, SocketId: socket.id });

        await chatGateway.registerEvent(socket,io);

        console.log({ userSocketsIds: await RedisService.getSockets(socket.data.user._id)});

        socket.on("disconnect", async () => {
            await RedisService.removeSocket({ userId: socket.data.user._id, SocketId: socket.id });
            console.log({ userSocketsIdsAfterDisconnect: await RedisService.getSockets(socket.data.user._id)});
        });
        

    });
        
    }

    
}

export default new SocketGateway();