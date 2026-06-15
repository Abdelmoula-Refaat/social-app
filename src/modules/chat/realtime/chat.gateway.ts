import { Server, Socket } from "socket.io";
import chatEvent from "./chat.event";


class ChatGeteway {
    constructor() { }

    registerEvent = async (socket: Socket, io: Server) => {
        chatEvent.sayHi(socket);
        chatEvent.sendMessage(socket, io);
        chatEvent.joinRoom(socket, io);
        chatEvent.sendGroupMessage(socket, io);
    }
}

export default new ChatGeteway();