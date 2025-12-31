import { Request, Response, NextFunction } from "express";
import axios from "axios"
import * as crypto from "crypto"
import dotenv from "dotenv"
import User from "../models/User";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import request from "request"

dotenv.config()

export interface UserIdRequest extends Request {
    id?: String;
}

const signUp = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log("request: ", req.body)
    const { name, email, password } = req.body
    let existingUser;

    try {
        existingUser = await User.findOne({ email: email })
    } catch (error) {
        console.log(error)
    }

    console.log("existingUser:", existingUser)

    if (existingUser) {
        return res.status(409).json({
            message: "User already exists. Please Log in"
        })
    }

    const hashedPass = bcrypt.hashSync(password)

    const user: any = new User({
        name: name,
        email: email,
        password: hashedPass,
        emailVerified: false,
    });

    console.log("[+] User created")

    try {
        await user.save()
        return res.status(201).json({
            message: "User created succcessfully!"
        })
    } catch (error) {
        console.log(error);
        if (error instanceof Error) {
            return res.status(501).json({ type: "error", message: error.message })
        } else {
            return res.status(501).json({ type: "obj", message: error })
        }
    }
}

const logIn = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { email, password } = req.body

    let existingUser: any;

    try {
        existingUser = await User.findOne({ email: email })
    } catch (error) {
        return new Error(error as string)
    }

    if (!existingUser) {
        return res.status(404).json({
            message: "No such user exists. Please Signup"
        })
    }

    // if (!existingUser.emailVerified) {
    //     return res.status(200).json({
    //         type: "email",
    //         userId: existingUser._id
    //     })
    // }

    const pass = bcrypt.compareSync(password, existingUser.password)
    if (!pass) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    // later change the secret key or add dynamic keys
    const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET_KEY!, {
        expiresIn: "1h"
    })

    if (req.cookies[`${existingUser._id}`]) {
        req.cookies[`${existingUser._id}`] = ""
    }

    // String(existingUser._id)
    res.cookie("id", token, {
        path: '/',
        secure: true,
        expires: new Date(Date.now() + 3600000),
        httpOnly: true,
        sameSite: 'lax'
    })

    return res.status(200).json({
        message: "success"
    })
}

const logout = (
    req: UserIdRequest,
    res: Response,
    next: NextFunction
) => {
    // Check if the cookie exists
    if (req.cookies && req.cookies.id) {
        console.log("[INFO] RCVD COOKIE: ", req.cookies.id)
        // Clear the cookie by setting it to an empty string with an expired date
        res.cookie("id", "", {
            path: "/",
            secure: true,
            expires: new Date(0), // Set expiration to a past date
            httpOnly: true,
            sameSite: "lax",
        });

        return res.status(200).json({ message: "Logout successful" });
    } else {
        // If the cookie doesn't exist, still return a success message or handle it as needed.
        return res.status(200).json({ message: "Logout successful (no cookie found)" });
    }
};

const verifyToken = (
    req: UserIdRequest,
    res: Response,
    next: NextFunction
) => {

    try {
        // console.log("request:\n", req)
        // console.log("[INFO] cookies: ", req.cookies)
        const cookie = req.cookies['id'];
        console.log("rcvd cookie: ", cookie)
        // const token = ((cookies?.split("=")[1])?.split(" ")[0])?.slice(0, -1)
        const token = cookie

        console.log("[TOKEN RCVD FOR VERIFY]: ", token)

        if (!token) {
            res.status(404).json({ message: "No token found" })
        }
        jwt.verify(String(token), process.env.JWT_SECRET_KEY!, (error, user: any) => {
            if (error) {
                console.log("token error: ", error.message)
                return res.status(400).json({ message: "Invalid Token" })
            }
            if (user) {
                console.log("id rcvd: ", user.id)
                req.id = user.id
            }
            console.log("[☑] token verified OK")
            next()
        })
    }
    catch (err: any) {
        console.error(err)
    }
}

const refreshToken = (
    req: UserIdRequest,
    res: Response,
    next: NextFunction
) => {
    const cookies = req.headers.cookie;
    const prev_token = cookies?.split("=")[1]

    if (!prev_token) {
        return res.status(400).json({ message: "Could not find token" })
    }
    jwt.verify(String(prev_token), process.env.JWT_SECRET_KEY!, (err, user: any) => {
        if (err) {
            console.log(err)
            return res.status(403).json({ message: "Authentication failed" })
        }

        // clear cookies
        res.clearCookie(`${user!.id}`)
        req.cookies[`${user.id}`] = ""

        // generate new token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY!, {
            expiresIn: "1h"
        })

        // generate cookie
        res.cookie(String(user.id), token, {
            path: "/",
            secure: true,
            expires: new Date(Date.now() + 3600000),
            httpOnly: true,
            sameSite: "lax"
        })

        req.id = user.id
        next()
    })
}

export {
    logIn,
    logout,
    signUp,
    verifyToken
}