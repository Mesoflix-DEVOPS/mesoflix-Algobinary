import { supabase } from "./db"

export type NotificationType = "info" | "success" | "warning" | "error"

export async function sendNotification({
    userId,
    title,
    message,
    type = "info"
}: {
    userId: string,
    title: string,
    message: string,
    type?: NotificationType
}) {
    try {
        const { error } = await supabase.from("notifications").insert({
            user_id: userId,
            title,
            message,
            type,
            is_read: false
        })

        if (error) {
            console.error("[Notifications] Error sending notification:", error)
            return { success: false, error }
        }

        return { success: true }
    } catch (err) {
        console.error("[Notifications] Exception:", err)
        return { success: false, error: err }
    }
}

export async function getNotifications(userId: string) {
    try {
        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50)

        if (error) throw error
        return { success: true, data }
    } catch (err) {
        return { success: false, error: err }
    }
}

export async function markAsRead(notificationId: string) {
    try {
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notificationId)

        if (error) throw error
        return { success: true }
    } catch (err) {
        return { success: false, error: err }
    }
}
