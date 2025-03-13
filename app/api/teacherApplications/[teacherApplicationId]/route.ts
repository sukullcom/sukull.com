import { NextResponse } from "next/server"

import db from "@/db/drizzle"
import { teacherApplications, users } from "@/db/schema"
import { isAdmin } from "@/lib/admin"
import { eq } from "drizzle-orm"

export const GET = async (
    req: Request,
    { params }: { params: { teacherApplicationId: string } }
) => {
    if (!(await isAdmin())) {
        return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const id = parseInt(params.teacherApplicationId)
    
    const application = await db.query.teacherApplications.findFirst({
        where: eq(teacherApplications.id, id)
    })
    
    if (!application) {
        return new NextResponse("Not Found", { status: 404 })
    }
    
    return NextResponse.json(application)
}

export const PUT = async (
    req: Request,
    { params }: { params: { teacherApplicationId: string } }
) => {
    if (!(await isAdmin())) {
        return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const id = parseInt(params.teacherApplicationId)
    const body = await req.json()
    
    const result = await db
        .update(teacherApplications)
        .set(body)
        .where(eq(teacherApplications.id, id))
        .returning()
    
    if (!result.length) {
        return new NextResponse("Not Found", { status: 404 })
    }
    
    return NextResponse.json(result[0])
}

export const DELETE = async (
    req: Request,
    { params }: { params: { teacherApplicationId: string } }
) => {
    if (!(await isAdmin())) {
        return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const id = parseInt(params.teacherApplicationId)
    
    const result = await db
        .delete(teacherApplications)
        .where(eq(teacherApplications.id, id))
        .returning()
    
    if (!result.length) {
        return new NextResponse("Not Found", { status: 404 })
    }
    
    return NextResponse.json(result[0])
}

export const PATCH = async (
    req: Request,
    { params }: { params: { teacherApplicationId: string } }
) => {
    if (!(await isAdmin())) {
        return new NextResponse("Unauthorized", { status: 401 })
    }
    
    const id = parseInt(params.teacherApplicationId)
    const body = await req.json()
    
    // Handle special actions
    if (body.action === 'approve') {
        try {
            // First, get the application to retrieve the userId
            const application = await db.query.teacherApplications.findFirst({
                where: eq(teacherApplications.id, id)
            })
            
            if (!application) {
                return new NextResponse("Application not found", { status: 404 })
            }
            
            // Update the application status
            const updatedApplication = await db
                .update(teacherApplications)
                .set({ status: 'approved', updatedAt: new Date() })
                .where(eq(teacherApplications.id, id))
                .returning()
                
            if (!updatedApplication.length) {
                return new NextResponse("Failed to update application", { status: 500 })
            }
            
            // Update the user's role to 'teacher'
            const updatedUser = await db
                .update(users)
                .set({ role: 'teacher' })
                .where(eq(users.id, application.userId))
                .returning()
                
            if (!updatedUser.length) {
                return new NextResponse("Failed to update user role", { status: 500 })
            }
            
            return NextResponse.json(updatedApplication[0])
        } catch (error) {
            console.error("Error approving application:", error)
            return new NextResponse("Internal server error", { status: 500 })
        }
    }
    
    if (body.action === 'reject') {
        const result = await db
            .update(teacherApplications)
            .set({ status: 'rejected', updatedAt: new Date() })
            .where(eq(teacherApplications.id, id))
            .returning()
            
        if (!result.length) {
            return new NextResponse("Not Found", { status: 404 })
        }
        
        return NextResponse.json(result[0])
    }
    
    // Regular update
    const result = await db
        .update(teacherApplications)
        .set(body)
        .where(eq(teacherApplications.id, id))
        .returning()
    
    if (!result.length) {
        return new NextResponse("Not Found", { status: 404 })
    }
    
    return NextResponse.json(result[0])
} 