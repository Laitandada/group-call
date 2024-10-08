import { log } from "console";
import { v4 as uuidV4 } from "uuid";

const rooms = {};


export const roomHandler = (socket) => {
    const createRoom = ({ roomId,userID }) => {
     
        if (!roomId || !userID) {
            console.error("Invalid data provided:",roomId, userID);
            return;
        }
        rooms[roomId] = [];
        socket.emit("room-created", { roomId, userID });
        console.log("room created", roomId, userID);
    };
    

    const joinRoom = ({ roomId, userID, email, peerId }) => {
        // Ensure the room exists before proceeding
        if (rooms[roomId]) {
            // Check if the email already exists in the room (you might store emails with peerIds)
            const existingParticipant = rooms[roomId].find(participant => participant.email === email);
            
            if (existingParticipant) {
                // Emit a message to the user that they're already on the call
                console.log("User already on the call:", email);
                socket.emit("user-already-on-call", { message: "User already on the call", email });
                return; // Exit function, no further actions needed
            }
            
            console.log("user joined the room", roomId, peerId, userID);
            
            // Proceed only if peerId is valid
            if (peerId) {
                rooms[roomId].push({ peerId, email }); // Store peerId and email together
                
                // Emit the updated list of participants
                socket.emit("get-users", {
                    roomId,
                    participants: rooms[roomId],
                });
                socket.broadcast.to(roomId).emit("get-users", {
                    roomId,
                    participants: rooms[roomId],
                });
            }
           
            // Let the user join the room
            socket.join(roomId);
            socket.to(roomId).emit("user-joined", { peerId });
            socket.emit("room-created", { roomId, userID });
           
            // Mark the user as online
            userOnline({ roomId, email });
           
        } else {
            console.log("Room does not exist, creating room:", roomId, userID);
            createRoom({ roomId, userID });
        }
    
        // Handle disconnection
        socket.on("disconnect", () => {
            console.log("user left the room", peerId);
            leaveRoom({ roomId, peerId });
        });
    };
    
    const leaveRoom = ({ roomId, peerId }) => {
        if (rooms[roomId]) {
            // Filter out the participant with the matching peerId
            rooms[roomId] = rooms[roomId].filter(participant => participant.peerId !== peerId);
    
            // Notify remaining users about the participant who left
            socket.to(roomId).emit("user-disconnected", { peerId });
            socket.to(roomId).emit("user-left", { peerId });
    
            // Emit the updated list of participants to the room
            socket.to(roomId).emit("get-users", {
                roomId,
                participants: rooms[roomId], // Updated participants list without the disconnected peerId
            });
    
            console.log(`Peer ${peerId} left room ${roomId}. Remaining participants:`, rooms[roomId]);
        }
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
