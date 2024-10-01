import { log } from "console";
import { v4 as uuidV4 } from "uuid";

const rooms = {};


export const roomHandler = (socket) => {
    const createRoom = (data = {}) => {
        const { roomId, userID } = data;
        if (!roomId || !userID) {
            console.error("Invalid data provided:", data);
            return;
        }
        rooms[roomId] = [];
        socket.emit("room-created", { roomId, userID });
    };
    

    const joinRoom = ({ roomId, peerId,userID,email }) => {

        
     
        if (rooms[roomId]) {
            console.log("user joined the room", roomId, peerId);
            rooms[roomId].push(peerId);
            socket.join(roomId);
            socket.to(roomId).emit("user-joined", { peerId });
           
            socket.emit("get-users", {
                roomId,
                participants: rooms[roomId],
            });
            userOnline({ roomId, email });
           
        } else {
           
            createRoom(roomId,userID);
        }
        socket.on("disconnect", () => {
            console.log("user left the room", peerId);
            leaveRoom({ roomId, peerId });
        });
    };

    const leaveRoom = ({ peerId, roomId }) => {
        // Optionally remove the user from the room
 rooms[roomId] = rooms[roomId]?.filter((id) => id !== peerId);
        socket.to(roomId).emit("user-disconnected", peerId);
    };

    const startSharing = ({ peerId, roomId }) => {
        console.log("started sharing");
        
        socket.to(roomId).emit("user-started-sharing", peerId);
    };

    const stopSharing = (roomId) => {
        socket.to(roomId).emit("user-stopped-sharing");
    };
    const userOnline = ({ roomId, email }) => {
        console.log("User is online:", email, roomId);
        // Emit to everyone in the room, including the new user
        socket.join(roomId); // Ensure the socket joins the room
        socket.broadcast.to(roomId).emit("user-online", { roomId, email }); // Broadcast to all except sender
        socket.emit("user-online", { roomId, email }); // Send to the sender directly as well
    };
    
     // Handle signature uploaded event
  socket.on('signature-uploaded', ({ roomId, email, signatureUrl }) => {
    console.log(`User ${email} uploaded a signature to room ${roomId}. URL: ${signatureUrl}`);
    // Emit to everyone else in the room that a user has signed
    socket.to(roomId).emit('user-signed', { email, signatureUrl });
  });

  
    socket.on("user-online", userOnline);

    socket.on("create-room", createRoom);
    socket.on("join-room", joinRoom);
    socket.on("start-sharing", startSharing);
    socket.on("stop-sharing", stopSharing);
   
 
};
