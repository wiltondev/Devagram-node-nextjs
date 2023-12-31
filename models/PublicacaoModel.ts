import mongoose, { Document, Schema } from "mongoose";

// Defina a interface para Publicação
export interface Publicacao extends Document {
  idUsuario: Schema.Types.ObjectId; // ID do usuário que fez a publicação
  descricao: string; // Descrição da publicação
  url: string; // URL da mídia publicada
  mediaId: string; // ID da mídia no serviço de armazenamento
  data: Date; // Data da publicação
}

// Defina o esquema para Publicação
const PublicacaoSchema = new Schema<Publicacao>({
  idUsuario: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Usuario" // Referência ao modelo de Usuário
  },
  descricao: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50 // Ajuste conforme a regra de negócio
  },
  url: {
    type: String,
    required: true // Certifique-se de que a URL da mídia é obrigatória
  },
  mediaId: {
    type: String,
    required: true // Certifique-se de que o ID da mídia é obrigatório
  },
  data: {
    type: Date,
    required: true,
    default: Date.now // Data atual como padrão
  }
});

// Criar o modelo de Publicação se ainda não existir
export const PublicacaoModel =
  mongoose.models.publicacoes || mongoose.model<Publicacao>("publicacoes", PublicacaoSchema); 