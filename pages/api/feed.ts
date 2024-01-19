import type { NextApiRequest, NextApiResponse } from 'next';
import type { RespostaPadraoMsg } from '../../types/RespostaPadraoMsg';
import { validarTokenJWT } from '../../middlewares/validarTokenJWT';
import { conectarMongoDB } from '../../middlewares/conectarMongoDB';
import { UsuarioModel } from '../../models/UsuarioModel';
import { PublicacaoModel } from '../../models/PublicacaoModel';
import { SeguidorModel } from '../../models/SeguidorModel';
import { politicaCORS } from '../../middlewares/politicaCORS';
import { ReelsModel } from '../../models/ReelsModel';

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

            const publicacoes = await PublicacaoModel.find({
                $or: [
                    { idUsuario: usuarioLogado._id },
                    { idUsuario: seguidoresIds }
                ]
            })



            const reels = await ReelsModel.find({
                $or: [
                    { idUsuario: usuarioLogado._id },
                    { idUsuario: seguidoresIds }
                ]
            })



            const result = [];
            for (const publicacao of publicacoes) {
                const usuarioDaPublicacao = await UsuarioModel.findById(publicacao.idUsuario);
                if (usuarioDaPublicacao) {
                    const final = {
                        ...publicacao._doc, usuario: {
                            nome: usuarioDaPublicacao.nome,
                            avatar: usuarioDaPublicacao.avatar,


                        },
                        isVideo: false,

                    };
                    result.push(final);
                }
            }

            for (const reel of reels) {
                const usuarioDaPublicacao = await UsuarioModel.findById(reel.idUsuario);
                if (usuarioDaPublicacao) {
                    const final = {
                        ...reel._doc, usuario: {
                            nome: usuarioDaPublicacao.nome,
                            avatar: usuarioDaPublicacao.avatar,


                        },
                        isVideo: true,
                    };

                    result.push(final);
                }
            }



            return res.status(200).json(result.sort((a, b) => b.data - a.data));
        }

        return res.status(405).json({ erro: 'Método informado não é válido' });
    } catch (e) {
        console.error(e);
        return res.status(400).json({ erro: 'Não foi possível obter o feed' });
    }
};

export default politicaCORS(validarTokenJWT(conectarMongoDB(feedEndpoint)));
