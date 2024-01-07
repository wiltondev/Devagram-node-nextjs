// Import necessary modules and models
import type { NextApiResponse } from 'next';
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import nc from 'next-connect';
import { upload, uploadImagemCosmic, bucketDevagram } from '../../services/uploadImagemCosmic';
import { conectarMongoDB } from '../../middlewares/conectarMongoDB';
import { validarTokenJWT } from '../../middlewares/validarTokenJWT';
import { ReelsModel } from '../../models/ReelsModel';
import { UsuarioModel } from '../../models/UsuarioModel';
import { politicaCORS } from '../../middlewares/politicaCORS';
import { getVideoDurationInSeconds } from 'get-video-duration';
import { Readable } from "stream";


const handler = nc()
  .use(upload.single('file'))
  .post(async (req: any, res: NextApiResponse<RespostaPadraoMsg>) => {
    try {
      // Extract user ID from the query
      const { userId } = req.query;

      // Find the user by ID
      const usuario = await UsuarioModel.findById(userId);

      // Check if the user exists
      if (!usuario) {
        return res.status(400).json({ erro: 'Usuário não encontrado' });
      }

      // Check if request body is present
      if (!req.body) {
        return res.status(400).json({ erro: 'Parâmetros de entrada não informados' });
      }

      // Extract description from the request body
      const { descricao } = req.body;

      // Validate description length
      if (!descricao || descricao.length < 2 || descricao.length > 20) {
        return res.status(400).json({ erro: 'Descrição inválida' });
      }

      // Check if file is present
      if (!req.file || !req.file.originalname) {
        return res.status(400).json({ erro: 'Publique uma foto ou um vídeo' });
      }
      
      // Extract file extension and allowed video extensions
      const fileExtension = req.file.originalname.toLowerCase().slice(-4);
      const allowedVideoExtensions = [".mp4", ".webm", ".mov", ".avi"];
      
      // Check if the file extension is supported
      if (!allowedVideoExtensions.includes(fileExtension)) {
        return res.status(400).json({
          erro: "Formato de arquivo não suportado. Apenas imagens ou vídeos são permitidos.",
        });
        
      }

      // Check duration for videos
      if (allowedVideoExtensions.includes(fileExtension)) {
        const videoStream = Readable.from(req.file.buffer);
        const durationInSeconds = await getVideoDurationInSeconds(videoStream);

        if (durationInSeconds > 120) {
          return res.status(400).json({ erro: "Vídeo deve ter no máximo 2 minutos de duração." });
        }
      }

      // Upload media to Cosmic
      const media = await uploadImagemCosmic(req);

      // Create a new reel object
      let reels = new ReelsModel({
        idUsuario: usuario._id,
        descricao,
        url: media?.media?.url,
        mediaId: media?.media?.id,
        data: new Date(),
      });

      // Increment user's reel count and update the user
      usuario.reel++;
      await UsuarioModel.findByIdAndUpdate({ _id: usuario._id }, usuario);

      // Create a new reel entry in the database
      await ReelsModel.create(reels);

      // Return success response
      return res.status(200).json({ msg: 'Publicação criada com sucesso' });
    } catch (e) {
      // Log and return error response
      console.error(e);
      return res.status(400).json({ erro: 'Erro ao cadastrar publicação' });
    }
  })
  .put(async (req: any, res: NextApiResponse<RespostaPadraoMsg>) => {
    try {
      // Extract user ID and reel ID from the query
      const { reelsId , userId} = req.query;

      // Find the user by ID
      const usuario = await UsuarioModel.findById(userId);

      // Check if the user exists
      if (!usuario) {
        return res.status(400).json({ erro: 'Usuário não encontrado' });
      }

  
      const reels = await ReelsModel.findOne({
        _id: reelsId,
        idUsuario: userId,
      });

      // If the reel is not found, return an error
      if (!reels) {
        return res.status(400).json({ erro: "Publicação não encontrada" });
      }

      // Check if request body is present
      if (!req.body) {
        return res.status(400).json({ erro: "Parâmetros de entrada não informados" });
      }

      // Extract description from the request body
      const { descricao } = req.body;

      // Validate the description if present
      if (descricao) {
        if (descricao.length < 2 || descricao.length > 20) {
          return res.status(400).json({ erro: "Descrição inválida" });
        }
        // Update the reel description
        reels.descricao = descricao;
      }

      // Check if a file is attached to the request and update it
      const { file } = req;

      if (file && file.originalname) {
        // Extract file extension and allowed video extensions
        const fileExtension = file.originalname.toLowerCase().slice(-4);
        const allowedVideoExtensions = [".mp4", ".webm", ".mov", ".avi"];

        // Check if the file extension is supported (image or video)
        if (allowedVideoExtensions.includes(fileExtension)) {
          // If it's a video, check its duration
          if (allowedVideoExtensions.includes(fileExtension)) {
            const videoStream = Readable.from(req.file.buffer);
            const durationInSeconds = await getVideoDurationInSeconds(videoStream);

            // Check if the video duration is within limits
            if (durationInSeconds > 120) {
              return res
                .status(400)
                .json({ erro: "Vídeo deve ter no máximo 2 minutos de duração." });
            }
          }

          // Save the old media ID
          const oldMedia = reels.mediaId;

          // Upload the new media to Cosmic
          const upMedia = await uploadImagemCosmic(req);

          // Update the reel with the new media information
          if (upMedia && upMedia.media && upMedia.media.url) {
            reels.url = upMedia.media.url;

            // Delete the old media
            if (oldMedia) {
              await bucketDevagram.media.deleteOne(oldMedia);
            }

            // Update the media ID
            reels.mediaId = upMedia.media.id;
          }
        } else {
          return res.status(400).json({ erro: "Arquivo inválido" });
        }
      }

      // Update the reel in the database
      await ReelsModel.findByIdAndUpdate(reelsId, reels);

      // Return a success response
      return res.status(200).json({ msg: "Publicação atualizada com sucesso" });
    } catch (e) {
      // Log and return an error response
      console.error(e);
      return res.status(400).json({ erro: "Erro ao atualizar publicação" });
    }
  })
  .delete(async (req: any, res: NextApiResponse<RespostaPadraoMsg>) => {
    try {
      // Extract user ID and reel ID from the query
      const { reelsId, userId } = req.query;
      const reels = await ReelsModel.findById(reelsId);
      if(!reels){
        return res.status(400).json({ erro: 'Publicação não encontrada' });
      }

      await ReelsModel.findByIdAndDelete(reelsId);

      return res.status(200).json({ msg: 'Publicação deletada com sucesso' });
    } catch (e) {
      console.error(e);
      return res.status(400).json({ erro: 'Erro ao deletar publicação' });

    }
  })

export const config = {
  api: {
    bodyParser: false
  }
};

// Export the configured handler
export default politicaCORS(validarTokenJWT(conectarMongoDB(handler)));

