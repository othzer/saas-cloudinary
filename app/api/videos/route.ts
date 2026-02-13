
import {NextRequest, NextResponse} from "next/server";


import { PrismaClient } from "@/prisma/generated/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

export async function GET(request: NextRequest){
    try {
        const videos = await prisma.video.findMany({
            orderBy: {createdAt: "desc"}
        })

        return NextResponse.json(videos);
    } catch (error) {
        console.log("Something went wrong while getting videos")
        return NextResponse.json({error: "Error fetching videos"}, {status: 500})
    } finally {
        await prisma.$disconnect()
    }
}
