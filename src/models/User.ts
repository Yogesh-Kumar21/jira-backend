import mongoose from "mongoose";

const schema = new mongoose.Schema({
    name: {
        type: String
    },
    logo: {
        type: String
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        default: null
    }
}, {timestamps: true})

export default mongoose.model('User', schema)