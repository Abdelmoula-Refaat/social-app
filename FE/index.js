
const clientIo = io("http://127.0.0.1:3000", {
    auth: {
        authorization: `user ${localStorage.getItem("authorization")}`,
    }
});

clientIo.emit("hi", { id: localStorage.getItem("socketId") });

clientIo.on("sayHiBack", (data) => {
    console.log(data);
});

clientIo.on("connect_error", (error) => {
    console.log(error);
});

