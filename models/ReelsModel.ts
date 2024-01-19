import mongoose, { Document, Schema } from 'mongoose';

export interface Reels extends Document {
    
    _id: string; // ID da publicação
    idUsuario: string; // ID do usuário que publicou
    descricao: string; // Descrição da publicação
    url: string; // URL da mídia (imagem ou vídeo)
    data: Date; // Data da publicação
    comentarios: { nome: string; comentario: string }[]; // Array de comentários
    likes: string[]; // Array de IDs de usuários que curtiram
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