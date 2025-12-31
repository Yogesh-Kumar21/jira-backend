import express from "express"
import { createTeam, createTicket, getTeam, getTeams, getTickets, getUserProfile, joinTeam } from "../controllers/user-controller"
import { verifyToken } from "../controllers/auth-controller"

const userRouter = express.Router()

userRouter.get('/', (req, res, next) => {
    res.status(200).json({
        success: true
    })    
})

userRouter.get('/profile', verifyToken, getUserProfile)
userRouter.get('/teams', getTeams)
userRouter.post('/team/create', verifyToken, createTeam)
userRouter.post('/team/join', verifyToken, joinTeam)
userRouter.get(`/team/:teamId`, verifyToken, getTeam)
userRouter.post('/ticket/create', verifyToken, createTicket)
userRouter.get('/team/:teamId/tickets', verifyToken, getTickets)

export default userRouter