import mongoose, { Document, Schema } from 'mongoose';

export interface Reels extends Document {
    
    idUsuario: string;
    descricao: string;
    url: string;
    data: Date;
}

const ReelsSchema = new Schema({
    idUsuario: { type: String, required: true },
    descricao: { type: String, required: true },
    url: { type: String, required: true },
    mediaId: { type: String, required: true },
    data: { type: Date, required: true },
    comentarios: { type: Array, default: [] },
    likes: { type: Array, default: [] },


});

export const ReelsModel = (mongoose.models.reels || mongoose.model('reels', ReelsSchema));