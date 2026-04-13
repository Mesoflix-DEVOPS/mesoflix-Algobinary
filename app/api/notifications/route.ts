import { NextRequest, NextResponse } from "next/server"
import { getNotifications, markAsRead, sendNotification } from "@/lib/notifications"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const { success, data, error } = await getNotifications(userId)

    if (!success) {
        return NextResponse.json({ error: (error as any)?.message || "Failed to fetch notifications" }, { status: 500 })
    }

    return NextResponse.json({ notifications: data })
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { notificationId, userId, title, message, type } = body

        // Scenario 1: Create a new notification
        if (userId && title && message) {
            const { success, error } = await sendNotification({ userId, title, message, type })
            if (!success) return NextResponse.json({ error: (error as any)?.message || "Failed to create notification" }, { status: 500 })
            return NextResponse.json({ success: true })
        }

        // Scenario 2: Mark as read
        if (notificationId) {
            const { success, error } = await markAsRead(notificationId)
            if (!success) return NextResponse.json({ error: (error as any)?.message || "Failed to mark as read" }, { status: 500 })
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    } catch (err: any) {
        console.error("[api/notifications] POST error:", err)
        return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 })
    }
}
