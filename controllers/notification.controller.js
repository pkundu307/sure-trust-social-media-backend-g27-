import { Notification } from "../models/notification.schema.js";

export const createNotification = async(req,res)=>{
try {
    const {recipient,senderId,type,relatedPostId,message}=req.body;
    console.log(req.body,'pllplp');
    
    const notification = await Notification.create({
        recipient,
        sender:senderId,
        type,
        relatedPostId:relatedPostId || null,
        message
    })

    io.to(recipient).emit("New Notification",notification)
    res.status(201).json({message})
} catch (error) {
    res.status(500).json({message:`${error.message}`})
    console.error(error)
}
}

export const markAsRead =async(req,res)=>{
    try {
        const{notificationId}=req.params

        const notification=await Notification.findByIdAndUpdate(notificationId,{isRead:true},{new:true})

        if(!notification){
            res.status(404).json({message:"Notification not found"})
        }

        io.to(notification.recipient.toString()).emit("notification_read",notification)

        res.status(200).json(notification)
    } catch (error) {
           res.status(500).json({message:`${error.message}`})
    console.error(error)
    }
}


export const getMyNotifications = async (req,res)=>{
    try {
        const userId= req.user.userId
        console.log(userId);
        
        const notifications =await Notification.find({recipient:userId}).sort({createdAt:-1})
        // .populate('sender','name profilePicture')

        res.status(200).json(notifications)
    } catch (error) {
           res.status(500).json({message:`${error.message}`})
    console.error(error)
    }
}