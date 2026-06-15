import { Socket, Server } from "socket.io";
import chatService from "../chat.service";


class ChatEvent {
    constructor() { }

    sayHi = async (socket: Socket) => {
        socket.on("sayHi", (data) => {
            chatService.sayHi(data);
        })
    }

    sendMessage = async (socket: Socket, io: Server) => {
        socket.on("sendMessage", (data) => {
            chatService.sendMessage(data, socket, io);
        })
    }
    
    joinRoom = async (socket: Socket, io: Server) => {
        socket.on("joinRoom", (data) => {
            chatService.joinRoom(data, socket, io);
        })
    }

    sendGroupMessage = async (socket: Socket, io: Server) => {
        socket.on("sendGroupMessage", (data) => {
            chatService.sendGroupMessage(data, socket, io);
        })
    }
}

export default new ChatEvent();