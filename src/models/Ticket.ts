import mongoose from "mongoose";

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    assigned_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    description: {
        type: String
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"]
    }
}, {timestamps: true})

export default mongoose.models.Ticket || mongoose.model('Ticket', schema)