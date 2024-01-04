import type { NextApiResponse } from 'next';
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import nc from 'next-connect';
import { upload, uploadImagemCosmic } from '../../services/uploadImagemCosmic'; // Corrigi o nome do serviço de upload
import { conectarMongoDB } from '../../middlewares/conectarMongoDB';
import { validarTokenJWT } from '../../middlewares/validarTokenJWT';
import { PublicacaoModel } from '../../models/PublicacaoModel';
import { UsuarioModel } from '../../models/UsuarioModel';
import { politicaCORS } from '../../middlewares/politicaCORS';

const handler = nc()
    .use(upload.single('file')) // Corrigi o nome da função de upload
    .post(async (req: any, res: NextApiResponse<RespostaPadraoMsg>) => {
        try {
            const { userId } = req.query;
            const usuario = await UsuarioModel.findById(userId);
            if (!usuario) {
                return res.status(400).json({ erro: 'Usuario nao encontrado' });
            }

            if (!req.body) { // Removi a verificação desnecessária
                return res.status(400).json({ erro: 'Parametros de entrada nao informados' });
            }

            const { descricao } = req.body;

            if (!descricao || descricao.length < 2) {
                return res.status(400).json({ erro: 'Descricao nao e valida' });
            }

            const { file } = req;

            if (!file || !file.originalname) { // Corrigi a verificação do arquivo
                return res.status(400).json({ erro: 'Imagem é obrigatória' });
            }

            const image = await uploadImagemCosmic(req);
            const publicacao = {
                idUsuario: usuario._id,
                descricao,
                foto: image.media.url,
                data: new Date(),
                comentarios: [],
                likes: [],
            };

            usuario.publicacoes++;
            await UsuarioModel.findByIdAndUpdate({ _id: usuario._id }, usuario);

            await PublicacaoModel.create(publicacao);
            return res.status(200).json({ msg: 'Publicacao criada com sucesso' });
        } catch (e) {
            console.error(e);
            return res.status(400).json({ erro: 'Erro ao cadastrar publicacao' });
        }
    })

    .put(async (req: any, res: NextApiResponse<RespostaPadraoMsg>) => {
        try {
            const { publicationId } = req.query;
            const { descricao, imagemUrl } = req.body;

            // Adicione validação para a descrição ou URL da imagem, se necessário.

            const updatedData: { descricao?: string; foto?: string } = {};
            if (descricao) updatedData.descricao = descricao;
            if (imagemUrl) updatedData.foto = imagemUrl;

            const publication = await PublicacaoModel.findByIdAndUpdate(publicationId, updatedData, { new: true });
            if (!publication) {
                return res.status(404).json({ erro: 'Publicação não encontrada' });
            }

            return res.status(200).json({ msg: 'Publicação atualizada com sucesso' });
        } catch (e) {
            console.error(e);
            return res.status(400).json({ erro: 'Erro ao atualizar publicação' });
        }
    })

    .delete(async (req: any, res: NextApiResponse<RespostaPadraoMsg>) => {
        try {
            const { publicationId } = req.query;

            // Execute a operação de exclusão
            const publication = await PublicacaoModel.findByIdAndDelete(publicationId);
            if (!publication) {
                return res.status(404).json({ erro: 'Publicação não encontrada' });
            }

            // Atualize a contagem de publicações do usuário, se necessário
            await UsuarioModel.findByIdAndUpdate(publication.idUsuario, { $inc: { publicacoes: -1 } });

            return res.status(200).json({ msg: 'Publicação deletada com sucesso' });
        } catch (e) {
            console.error(e);
            return res.status(400).json({ erro: 'Erro ao deletar publicação' });
        }
    });

export const config = {
    api: {
        bodyParser: false,
    },
};

export default politicaCORS(validarTokenJWT(conectarMongoDB(handler)));
