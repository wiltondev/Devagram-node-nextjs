import sharp from 'sharp';
import type { NextApiResponse } from 'next';
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import nc from 'next-connect';
import { upload, uploadImagemCosmic, bucketDevagram } from '../../services/uploadImagemCosmic';
import { conectarMongoDB } from '../../middlewares/conectarMongoDB';
import { validarTokenJWT } from '../../middlewares/validarTokenJWT';
import { PublicacaoModel } from '../../models/PublicacaoModel';
import { UsuarioModel } from '../../models/UsuarioModel';
import { politicaCORS } from '../../middlewares/politicaCORS';
import { getVideoDurationInSeconds } from 'get-video-duration';
import { Readable } from "stream";



const handler = nc()
    .use(upload.single('file'))
    .post(async (req: any, res: NextApiResponse<RespostaPadraoMsg>) => {
        try {
            const { userId } = req.query;
            const usuario = await UsuarioModel.findById(userId);
            if (!usuario) {
                return res.status(400).json({ erro: 'Usuario nao encontrado' });
            }

            if (!req || !req.body) {
                return res.status(400).json({ erro: 'Parametros de entrada nao informados' });
            }
            const { descricao } = req?.body;

            if (!descricao || descricao.length < 2 || descricao.length > 20) {
                return res.status(400).json({ erro: 'Descricao nao e valida' });
            }

            if (!req.file || !req.file.originalname) {
                return res.status(400).json({ erro: 'Publique uma foto ou um video' });
            }

            const fileExtension = req.file.originalname.toLowerCase().slice(-4);
            const allowedImageExtensions = [".jpeg", ".png", ".jpg", ".bmp"];
            const allowedVideoExtensions = [".mp4", ".webm", ".mov", ".avi"];

            // Verifique se o formato do arquivo é suportado (imagem ou vídeo)
            if (
                !allowedImageExtensions.includes(fileExtension) &&
                !allowedVideoExtensions.includes(fileExtension)
            ) {
                return res.status(400).json({
                    erro: "Formato de arquivo não suportado. Apenas imagens ou vídeos são permitidos.",
                });
            }

            if (allowedVideoExtensions.includes(fileExtension)) {


                const videoStream = Readable.from(req.file.buffer);

                // Use a biblioteca get-video-duration para obter a duração do vídeo
                const durationInSeconds = await getVideoDurationInSeconds(videoStream);

                if (durationInSeconds > 120) {
                    return res
                        .status(400)
                        .json({ erro: "Vídeo deve ter no máximo 2 minutos de duração." });
                }




            } else if (allowedImageExtensions.includes(fileExtension)) {
                const imageBuffer = req.file.buffer;

                // Use a biblioteca sharp para obter informações sobre a imagem
                const imageInfo = await sharp(imageBuffer).metadata();

                if (!imageInfo) {
                    return res.status(400).json({
                        erro: "Não foi possível obter informações sobre a imagem.",
                    });
                }


            }



            const media = await uploadImagemCosmic(req);

            let publicacao = {
                idUsuario: usuario._id,
                descricao,
                url: media?.media?.url,
                mediaId: media?.media?.id,
                data: new Date(),
            };

            usuario.publicacoes++;
            await UsuarioModel.findByIdAndUpdate({ _id: usuario._id }, usuario);

            await PublicacaoModel.create(publicacao);
            return res.status(200).json({ msg: 'Publicacao criada com sucesso' });
        } catch (e) {
            console.log(e);
            return res.status(400).json({ erro: 'Erro ao cadastrar publicacao' });
        }
    })
/*.put(async (req: any, res: NextApiResponse<RespostaPadraoMsg>) => {
  try {
    const { userId, publicacaoId } = req.query;

    const usuario = await UsuarioModel.findById(userId);

    if (!usuario) {
      return res.status(400).json({ erro: 'Usuario nao encontrado' });
    }


    const publicacao = await PublicacaoModel.findOne({
      _id: publicacaoId,
      idUsuario: userId,
    });

    // Se a publicação não for encontrada, retorna um erro de "Publicação não encontrada"
    if (!publicacao) {
      return res.status(400).json({ erro: "Publicação não encontrada" });
    }

    // Verifica se a solicitação possui corpo e dados válidos
    if (!req || !req.body) {
      return res.status(400).json({ erro: "Parâmetros de entrada não informados" });
    }

    const { descricao } = req.body;

    // Valida a descrição se estiver presente
    if (descricao) {
      if (descricao.length < 2 || descricao.length > 20) {
        return res.status(400).json({ erro: "Descrição inválida" });
      }
      publicacao.descricao = descricao;
    }

    // Verifica se há um arquivo anexado à solicitação e o atualiza
    const { file } = req;

    if (file && file.originalname) {
      const fileExtension = file.originalname.toLowerCase().slice(-4);
      const allowedImageExtensions = [".jpeg", ".png", ".jpg", ".bmp"];
      const allowedVideoExtensions = [".mp4", ".webm", ".mov", ".avi"];

      // Verifica se o formato do arquivo é suportado (imagem ou vídeo)
      if (
        allowedImageExtensions.includes(fileExtension) ||
        allowedVideoExtensions.includes(fileExtension)
      ) {
        // Se for um vídeo, verifica a duração
        if (allowedVideoExtensions.includes(fileExtension)) {
          const videoStream = Readable.from(req.file.buffer);
          const durationInSeconds = await getVideoDurationInSeconds(videoStream);
          if (durationInSeconds > 120) {
            return res
              .status(400)
              .json({ erro: "Vídeo deve ter no máximo 2 minutos de duração." });
          }
        }

        const oldMedia = publicacao.mediaId;

        const upMedia = await uploadImagemCosmic(req);

        if (upMedia && upMedia.media && upMedia.media.url) {
          publicacao.url = upMedia.media.url;

          if (oldMedia) {
            // Remove a mídia antiga
            await bucketDevagram.media.deleteOne(oldMedia);
          }

          publicacao.mediaId = upMedia.media.id;
        }
      } else {
        return res.status(400).json({ erro: "Arquivo inválido" });
      }
    }

    // Atualiza a publicação no banco de dados com as alterações feitas
    await PublicacaoModel.findByIdAndUpdate(publicacaoId, publicacao);

    // Retorna uma resposta de sucesso
    return res.status(200).json({ msg: "Publicação atualizada com sucesso" });
  } catch (e) {
    // Em caso de erro, registra o erro no console e retorna uma resposta de erro
    console.error(e);
    return res.status(400).json({ erro: "Erro ao atualizar publicação" });
  }
});*/

export const config = {
    api: {
        bodyParser: false
    }
}

export default politicaCORS(validarTokenJWT(conectarMongoDB(handler)));