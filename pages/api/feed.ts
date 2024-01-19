import type { NextApiRequest, NextApiResponse } from 'next';
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import { validarTokenJWT } from '../../middlewares/validarTokenJWT';
import { conectarMongoDB } from '../../middlewares/conectarMongoDB';
import { UsuarioModel } from '../../models/UsuarioModel';
import { PublicacaoModel } from '../../models/PublicacaoModel';
import { SeguidorModel } from '../../models/SeguidorModel';
import { politicaCORS } from '../../middlewares/politicaCORS';
import { ReelsModel } from '../../models/ReelsModel';

const processarItem = async (item, isVideo) => {
    const usuarioDaPublicacao = await UsuarioModel.findById(item.idUsuario);
    return usuarioDaPublicacao ? {
        ...item._doc,
        usuario: { nome: usuarioDaPublicacao.nome, avatar: usuarioDaPublicacao.avatar },
        isVideo,
    } : null;
};

const feedEndpoint = async (req: NextApiRequest, res: NextApiResponse<RespostaPadraoMsg | any>) => {
    try {
        if (req.method === 'GET') {
            const { userId } = req.query;
            const usuarioLogado = await UsuarioModel.findById(userId);

            if (!usuarioLogado) {
                return res.status(400).json({ erro: 'Usuário não encontrado' });
            }

            const seguidores = await SeguidorModel.find({ usuarioId: usuarioLogado._id });
            const seguidoresIds = seguidores.map(s => s.usuarioSeguidoId);

            const [publicacoes, reels] = await Promise.all([
                PublicacaoModel.find({ idUsuario: { $in: [...seguidoresIds, usuarioLogado._id] } }),
                ReelsModel.find({ idUsuario: { $in: [...seguidoresIds, usuarioLogado._id] } }),
            ]);

            const result = await Promise.all([
                ...publicacoes.map(publicacao => processarItem(publicacao, false)),
                ...reels.map(reel => processarItem(reel, true)),
            ]);

            return res.status(200).json(result.filter(Boolean).sort((a, b) => b.data - a.data));
        }

        return res.status(405).json({ erro: 'Método informado não é válido' });
    } catch (e) {
        console.error(e);
        return res.status(400).json({ erro: 'Não foi possível obter o feed' });
    }
};

export default politicaCORS(validarTokenJWT(conectarMongoDB(feedEndpoint)));
