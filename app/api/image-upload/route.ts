import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';


// Configuration
cloudinary.config({ 
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
});

//interface for typescript
interface CloudinaryUploaderResult {
    public_id: string;
    [key: string]: any
}

export async function POST(request: NextRequest){
    const {userId} = await auth();
    if(!userId){
        return NextResponse.json({error: "Unauthorised"}, {status: 401})
    }

    //getting data from form, and then converting to buffer and uploading
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null; //getting the filedata and typecasting as file or null

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
                    {folder: "home/saas/images"},//where to store
                    (error, result)=>{
                        if(error) reject(error);
                        else resolve(result as CloudinaryUploaderResult);
                    }
                )
                uploadStream.end(buffer)  //ending the buffer
            }
        )

        return NextResponse.json({publicId: result.public_id}, {status: 200});
    } catch (error) {
        console.log("something went wrong with upload image", error);
        return NextResponse.json({error: "upload image failed"}, {status: 500})
    }
}

(async function() {
    // Upload an image
     const uploadResult = await cloudinary.uploader
       .upload(
           'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
               public_id: 'shoes',
           }
       )
       .catch((error) => {
           console.log(error);
       });
    
    console.log(uploadResult);
    
    // Optimize delivery by resizing and applying auto-format and auto-quality
    const optimizeUrl = cloudinary.url('shoes', {
        fetch_format: 'auto',
        quality: 'auto'
    });
    
    console.log(optimizeUrl);
    
    // Transform the image: auto-crop to square aspect_ratio
    const autoCropUrl = cloudinary.url('shoes', {
        crop: 'auto',
        gravity: 'auto',
        width: 500,
        height: 500,
    });
    
    console.log(autoCropUrl);    
})();