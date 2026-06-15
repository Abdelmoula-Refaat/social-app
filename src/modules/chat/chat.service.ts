import UserRepository from "../../DB/repositories/user.repository";
import ChatRepository from "../../DB/repositories/chat.repository";
import { Request, Response } from "express";
import { AppError } from "../../common/utils/global-error-handler";
import { successResponse } from "../../common/utils/security/response.success";
import { Server, Socket } from "socket.io";
import redisService from "../../common/service/redis.service";
import { Types } from "mongoose";
import { uuidv4 } from "zod";
import { Upload } from "@aws-sdk/lib-storage";

class ChatService {
    private readonly _userRepo = new UserRepository();
    private readonly _chatRepo = new ChatRepository();
    constructor() { }

    //rest apis
    getChat = async (req: Request, res: Response) => {
        const { userId } = req.params;
        let { page, limit = 5} = req.query as unknown as {page: number, limit: number};
        if (page < 0 || !page) page = 1;
        page = page * 1 || 1;
        limit = limit * 1 || 5;
        
        const chat = await this._chatRepo.findOne({
            filter: {
                participants: {
                    $all: [req.user?._id!, userId]
                },
                group: {$exists: false}
            },projection: {
                messages: {
                    $slice: [-(page * limit), limit]
                }
            },
            populate: {
                path: "participants"
            }
        })

        if (!chat) {
            throw new AppError("Chat not found", 404);
        }

        successResponse({ res, message:"Done", data: chat });
        
    }

    getGroupChat = async (req: Request, res: Response) => {
        const { groupId } = req.params;
        let { page, limit = 5} = req.query as unknown as {page: number, limit: number};
        if (page < 0 || !page) page = 1;
        page = page * 1 || 1;
        limit = limit * 1 || 5;
        
        const chat = await this._chatRepo.findOne({
            filter: {
                _id: groupId,
                participants: {
                    $in: [req.user?._id!]
                },
                group: {$exists: true}
            },projection: {
                messages: {
                    $slice: [-(page * limit), limit]
                }
            },
            populate: {
                path: "messages.createdBy"
            }
        })

        if (!chat) {
            throw new AppError("Chat not found", 404);
        }

        successResponse({ res, message:"Done", data: chat });
        
    }

     createGroupChat = async (req: Request, res: Response) => {
        let { group, groupImage, participants } = req.body;
        const createdBy = req.user?._id as Types.ObjectId;

        const dbParticipants = participants.map((participant: string) => Types.ObjectId.createFromHexString(participant));
        
        const users = await this._userRepo.find({
            filter: {
                _id: {
                    $in: dbParticipants
                },
                friends: {
                $in: [createdBy]
            }
            },
            
        })

        if (users.length !== participants.length) {
            throw new AppError(" some users not found", 404);
        }

        // const roomId = group?.replaceAll(/\s+/g, "-") + "_" + uuidv4();
       
        // groupImage = await uploadFile({
        //     path: `chat/${roomId}`,
        //     file: req.file as Express.Multer.File,
            
        // })

        dbParticipants.push(createdBy);
        const chat = await this._chatRepo.create({
            group,
            groupImage,
            participants: dbParticipants,
            createdBy,
            roomId: String(createdBy),
            messages: []
        })

        if(!chat) {
            if (groupImage) {
                // await deleteFile({path: groupImage})
            }
            throw new AppError("Failed to create chat", 404);
        }

        
        
        successResponse({ res, message:"success", data: chat });
        
    }


    //socket.io

    sayHi = async (data: any) => {
        console.log(data);
        
    }

    sendMessage = async (data: any, socket: Socket, io: Server) => {
        const { sendTo, content } = data;
        const createdBy = socket.data.user._id!;
        const user = await this._userRepo.findOne({ filter: { _id: sendTo }});
        if (!user)  throw new AppError("User not exist");

        const chat = await this._chatRepo.findOneAndUpdate({
            filter: {
                participants: { $all: [sendTo, createdBy] },
                group: {$exists: false}
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy
                    },
                },
            },
        })
        if (!chat) {
            await this._chatRepo.create({
                createdBy,
                messages: [
                    {
                        content,
                        createdBy,
                    },
                ],
                participants: [sendTo, createdBy]
            })
        }
        io.to(await redisService.getSockets(createdBy)).emit("successMessage", { content });
        io.to(await redisService.getSockets(sendTo)).emit("newMessage", { content, from: socket.data.user });
        
    }

    sendGroupMessage = async (data: any, socket: Socket, io: Server) => {
        const { content, groupId } = data;
        const createdBy = socket.data.user._id!;
        
        const chat = await this._chatRepo.findOneAndUpdate({
            filter: {
                _id: groupId,
                participants: { $all: [createdBy] },
                group: {$exists: true}
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy
                    },
                },
            },
        })
        if (!chat) {
            throw new AppError("Chat not found", 404);
        }
        io.to(await redisService.getSockets(createdBy)).emit("successMessage", { content });
        io.to(chat?.roomId!).emit("newMessage", { content, from: socket.data.user, groupId });
        
    }

    joinRoom = async (data: any, socket: Socket, io: Server) => {
        const { roomId } = data;
        const chat = await this._chatRepo.findOne({ filter: { 
            roomId,
            participants: { $in: [socket.data.user._id] } ,
            group: {$exists: true} 
        }, 
        });
            if (!chat)  throw new AppError("Chat not exist", 404);
            socket.join(chat?.roomId!);
    }
}

export default new ChatService();