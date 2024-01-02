import multer from "multer";
import { createBucketClient } from "@cosmicjs/sdk";

const { BUCKET_SLUG, READ_KEY, WRITE_KEY } = process.env;


const bucketDevagram = createBucketClient({
    bucketSlug: BUCKET_SLUG as string,
    readKey: READ_KEY as string,
    writeKey: WRITE_KEY as string,
});

const storage = multer.memoryStorage();

const updload = multer({ storage: storage });

const uploadImagemCosmic = async (req: any) => {
    if (req?.file?.originalname) {
        const media_object = req.file;
        


        if (req.url && req.url.includes('publicacao')) {
            return await bucketDevagram.media.insertOne({
                media: media_object,
                folder: "publicacao",
            });
        } else if (req.url && req.url.includes('cadastro')) {
            return await bucketDevagram.media.insertOne({
                media: media_object,
                folder: "avatar",
            });
        
        }

    }
}

export { updload, uploadImagemCosmic, bucketDevagram };