import express from "express"
import { logIn, logout, signUp } from "../controllers/auth-controller"

const authRouter = express.Router()

authRouter.get('/', (req, res, next) => {
    res.status(200).json({
        success: true
    })    
})

authRouter.post('/login', logIn)
authRouter.post('/signup', signUp)
authRouter.post('/logout', logout)

export default authRouter