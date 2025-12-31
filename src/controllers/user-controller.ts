import { Request, Response, NextFunction } from "express";
import { UserIdRequest } from "./auth-controller";
import User from "../models/User";
import Team from "../models/Team";
import Ticket from "../models/Ticket";
import mongoose from "mongoose";

const getUserProfile = async (
    req: UserIdRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.id
        console.log("userID: ", userId)
        const user = await User.findById(userId)
        if (!user) {
            console.log("[INFO] NO USER FOUND!")
            return res.status(404).json({
                message: "No such user found"
            })
        }
        console.log("[INFO] USER FOUND!")
        return res.status(200).json({
            data: user
        })
    }
    catch (err: any) {
        return res.status(400).json({
            message: err.message
        })
    }
}

const getTeams = async (
    req: UserIdRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const teams: any = await Team.find().populate({
            path: "members",
            populate: {
                path: "memberId",
                select: "name logo"
            }
        })
        return res.status(200).json({
            teams: teams
        })
    }
    catch (err: any) {
        return res.status(400).json({
            message: err.message
        })
    }
}

const createTeam = async (
    req: UserIdRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.id
        const { name, logo } = req.body

        if (!name || !logo) {
            return res.status(400).json({
                message: "missing fields"
            })
        }

        const user: any = await User.findById(userId)

        const team: any = new Team({
            name: name,
            logo: logo,
            members: [
                {
                    memberId: userId,
                    role: ""
                }
            ],
            tickets: []
        })
        
        const savedTeam: any = await team.save()

        user.team = savedTeam._id
        await user.save()

        return res.status(200).json({
            success: true
        })
    }
    catch (err: any) {
        console.error(err)
        return res.status(400).json({
            message: err.message
        })
    }
}

const joinTeam = async (
    req: UserIdRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.id
        const { teamId } = req.body

        if (!teamId) {
            return res.status(400).json({
                message: "missing fields"
            })
        }

        await Team.findByIdAndUpdate(
            teamId,
            {
                $push: {
                    members: {
                        userId: userId,
                        role: ""
                    }
                }
            }
        )

        await User.findByIdAndUpdate(
            userId,
            {
                $set: { team: teamId }
            }
        )

        return res.status(200).json({
            success: true
        })
    }
    catch (err: any) {
        console.error(err)
        return res.status(400).json({
            message: err.message
        })
    }
}

const getTeam = async (
    req: UserIdRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const teamId = req.params.teamId
        const userId = req.id

        console.log("Registered Models:", mongoose.modelNames());

        const team: any = await Team.findById(teamId)
            .populate({
                path: "tickets",
                populate: {
                    path: "assigned_by",
                    select: "name logo"
                }
            })
            .populate({
                path: "members",
                populate: {
                    path: "memberId",
                    select: "name logo _id"
                }
            })

        console.log("found team: ", team)

        const f = team.members.find((t: any) => t.memberId._id == userId)

        if (!f) {
            return res.status(400).json({
                message: "You are not a member of this team"
            })
        }

        return res.status(200).json({
            data: team
        })
    }
    catch (err: any) {
        console.error(err)
        return res.status(400).json({
            message: err.message
        })
    }
}

const createTicket = async (
    req: UserIdRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.id
        const { name, description, priority } = req.body

        const user: any = await User.findById(userId)
        const team: any = await Team.findById(user.team)

        const t: any = new Ticket({
            name: name,
            description: description,
            assigned_by: userId,
            priority: priority
        })

        const savedTicket: any = await t.save()
        console.log("NEW TICKET: ", savedTicket)

        team.tickets.push(savedTicket._id)
        await team.save()

        return res.status(201)
    }
    catch (err: any) {
        console.error(err)
        return res.status(400).json({
            message: err.message
        })
    }
}

const getTickets = async (
    req: UserIdRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const teamId = req.params
        const team: any = await Team.findById(teamId)
        .populate({
            path: "tickets",
            populate: {
                path: "assigned_by",
                select: "name logo"
            }
        })

        return res.status(200).json(team.tickets)
    }
    catch (err: any) {
        console.error(err)
        return res.status(400).json({
            message: err.message
        })
    }
}

export {
    getUserProfile,
    getTeams,
    createTeam,
    joinTeam,
    getTeam,
    createTicket,
    getTickets
}