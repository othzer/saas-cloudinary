import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';

import { PrismaClient } from "@/prisma/generated/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

// Configuration
cloudinary.config({ 
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
});

//interface for typescript
interface CloudinaryUploaderResult {
    public_id: string;
    bytes: number;
    duration?: number;
    [key: string]: any
}

export async function POST(request: NextRequest){
    const {userId} = await auth();
    if(!userId){
        return NextResponse.json({error: "Unauthorised"}, {status: 401})
    }

    //getting data from form, and then converting to buffer and uploading
    try {

        if(!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME|| !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET){
            return NextResponse.json({error: "Cloudinary credential not found"}, {status: 500})
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null; //getting the filedata and typecasting as file or null
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const originalSize = formData.get("originalSize") as string;

        if(!file){
            return NextResponse.json({error: "File not found"}, {status: 400})
        }

        //making array buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        //uploading buffer
        const result = await new Promise<CloudinaryUploaderResult>(
            (resolve, reject)=>{
                const uploadStream = cloudinary.uploader.upload_stream(
                    { //options
                        folder: "home/saas/videos",//where to store
                        resource_type: "video",
                        transformation: [
                            {quality: "auto", fetch_format: "mp4"},   //supports mp4 format only
                        ]
                    },
                    (error, result)=>{
                        if(error) reject(error);
                        else resolve(result as CloudinaryUploaderResult);
                    }
                )
                uploadStream.end(buffer)  //ending the buffer
            }
        )

        const video = await prisma.video.create({
            data: {
                title,
                description,
                publicId: result.public_id,
                originalSize: originalSize,
                compressedSize: String(result.bytes),
                duration: result.duration || 0
            } 
        })

        return NextResponse.json(video);

    } catch (error) {
        console.log("something went wrong with upload video", error);
        return NextResponse.json({error: "upload image video"}, {status: 500})
    } 
}

// (async function() {
//     // Upload an image
//      const uploadResult = await cloudinary.uploader
//        .upload(
//            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//                public_id: 'shoes',
//            }
//        )
//        .catch((error) => {
//            console.log(error);
//        });
    
//     console.log(uploadResult);
    
//     // Optimize delivery by resizing and applying auto-format and auto-quality
//     const optimizeUrl = cloudinary.url('shoes', {
//         fetch_format: 'auto',
//         quality: 'auto'
//     });
    
//     console.log(optimizeUrl);
    
//     // Transform the image: auto-crop to square aspect_ratio
//     const autoCropUrl = cloudinary.url('shoes', {
//         crop: 'auto',
//         gravity: 'auto',
//         width: 500,
//         height: 500,
//     });
    
//     console.log(autoCropUrl);    
// })();