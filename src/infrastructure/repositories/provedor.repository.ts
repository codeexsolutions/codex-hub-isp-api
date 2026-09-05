import { inject, injectable } from "tsyringe";
import Provedor from "../../core/domains/Provedor";
import IProvedorRepository from "../../core/interfaces/IProvedorRepository";
import IDBContext from "../interfaces/IDbContext";
import { provedorModel } from "../../core/models/provedorModel";
import { loginPainel } from "../../application/Dtos/tokenDto";
import { cadastroProvedorModel } from "../../core/models/cadastroProvevedorModel";
import { themeModel } from "../../core/models/themeModel";
import { indicacaoModel } from "../../core/models/indicacaoModel";
import { avaliacaoModel } from "../../core/models/avaliacaoModel";
import { beneficioModel } from "../../core/models/beneficioModel";
import { compraModel } from "../../core/models/compraModel";
import { configComissaoModel } from "../../core/models/configComissaoModel";
import { recompensaModel } from "../../core/models/recompensaModel";
import { planoMovelModel } from "../../core/models/planoMovelModel";
import { solicitacaoPlanoMovelModel } from "../../core/models/solicitacaoPlanoMovelModel";
import { extratoPontosModel } from "../../core/models/extratoPontosModel";
import { homeConfigModel } from "../../core/models/homeConfigModel";
import { atendimentoModel } from "../../core/models/atendimentoModel";
import { ixcAssuntoModel } from "../../core/models/ixcAssuntoModel";
import { clubeBeneficiosModel } from "../../core/models/clubeBeneficiosModel";
import { parceiroModel } from "../../core/models/parceiroModel";
import { ativacaoTvModel } from "../../core/models/ativacaoTvModel";


@injectable()
export default class ProvedorRepository implements IProvedorRepository{
    
    private _db:IDBContext;

    constructor(@inject("IDBContext") db:IDBContext){
        this._db = db;
    }
    
    async Cadastrar(cadastro: cadastroProvedorModel): Promise<Provedor> {
        const insert = "INSERT INTO provedores (empresa, gerenciador, cnpj, nome_administrador, usuario, senha) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id;"
        const result = await this._db.Execulte(insert, [cadastro.empresa, cadastro.gerenciador, cadastro.cnpj, cadastro.nome_administrador, cadastro.usuario, cadastro.senha]);
        
        if(result.length == 0)
            throw new Error("Não foi possivel cadastrar o provedor.")

        const id = result[0] as any;

        return await this.ObterProvedorPorId(id.id)
    }

    async Atualizar(provedorEdite: cadastroProvedorModel) : Promise<Provedor> {
        
        const update =`UPDATE provedores SET 
            nome_fantasia = $1, 
            nome_administrador = $2, 
            codigo_api_gerenciador = $3, 
            chave_api_gerenciador = $4, 
            usuario = $5, 
            senha = $6 
            WHERE codigo_provedor = $7
            RETURNING id`
        
        const alterado = await this._db.Execulte(update, [provedorEdite.nome_fantasia, provedorEdite.nome_administrador, provedorEdite.codigo_api_gerenciador, provedorEdite.chave_api_gerenciador, provedorEdite.usuario, provedorEdite.senha, provedorEdite.codigo_provedor])
        
        if(alterado.length == 0)
            throw new Error("Não foi possivel cadastrar o provedor.")

        const id = alterado[0] as any;

        return await this.ObterProvedorPorId(id.id)
    }

    async ObterProvedorPorId(id: string): Promise<Provedor> {
      
        const result = await this._db.Execulte<provedorModel>("SELECT * FROM provedores WHERE id = $1", [id])
        
        const provedor = result[0];

        return new Provedor(
            provedor.empresa,
            provedor.nome_fantasia,
            provedor.codigo_provedor,
            provedor.status,
            provedor.gerenciador,
            provedor.codigo_api_gerenciador,
            provedor.chave_api_gerenciador,
            provedor.nome_administrador,
            provedor.cnpj,
            provedor.dominio_ixc,
            provedor.usuario,
            provedor.senha
        );
    }

    async ObterProvedorPorCpfCnpj(cnpj: string): Promise<Provedor | null> {
      
        const result = await this._db.Execulte<provedorModel>("SELECT * FROM provedores WHERE cnpj = $1", [cnpj])
        
        if(result.length < 1) return null;
        
        const provedor = result[0];

        return new Provedor(
            provedor.empresa,
            provedor.nome_fantasia,
            provedor.codigo_provedor,
            provedor.status,
            provedor.gerenciador,
            provedor.codigo_api_gerenciador,
            provedor.chave_api_gerenciador,
            provedor.nome_administrador,
            provedor.cnpj,
            provedor.dominio_ixc,
            provedor.usuario,
            provedor.senha
        );
    }


    async ObterProvedor(codigo: string): Promise<Provedor> {
      
        const result = await this._db.Execulte<provedorModel>("SELECT * FROM provedores WHERE codigo_provedor = $1", [codigo])
        
        const provedor = result[0];

        return new Provedor(
            provedor.empresa,
            provedor.nome_fantasia,
            provedor.codigo_provedor,
            provedor.status,
            provedor.gerenciador,
            provedor.codigo_api_gerenciador,
            provedor.chave_api_gerenciador,
            provedor.nome_administrador,
            provedor.cnpj,
            provedor.dominio_ixc,
            provedor.usuario,
            provedor.senha
        );
    }

    // DNS/servidor Xtream próprio do provedor pro app Synk TV — em branco
    // significa "usar o padrão do admin" (ver PainelServices.ObterUrlPadraoIptv).
    async ObterIptvUrlDns(codigoProvedor:string) : Promise<string | null> {
        const select = `SELECT iptv_url_dns FROM provedores WHERE codigo_provedor = $1;`;
        const result = await this._db.Execulte<{ iptv_url_dns: string | null }>(select, [codigoProvedor]);
        return result[0]?.iptv_url_dns ?? null;
    }

    async DefinirIptvUrlDns(codigoProvedor:string, url:string) : Promise<string | null> {
        const update = `UPDATE provedores SET iptv_url_dns = $1 WHERE codigo_provedor = $2 RETURNING iptv_url_dns;`;
        const result = await this._db.Execulte<{ iptv_url_dns: string | null }>(update, [url || null, codigoProvedor]);
        return result[0]?.iptv_url_dns ?? null;
    }

    async ObterTema(codigo:string) : Promise<any> {
        const select = `SELECT p.codigo_provedor as codigo, p.nome_fantasia as nome, p.gerenciador, t.tag, t.accent, t.accent2, t.logo_url,
                        t.logo,
                        t.favicon,
                        t.icone192,
                        t.icone512,
                        t.maskable
                        FROM theme t JOIN provedores p ON t.codigo_provedor_fk = p.codigo_provedor
                        WHERE p.codigo_provedor = $1;`;

        const result = await this._db.Execulte<any>(select, [codigo])

        const tema = result[0];

        return tema;
    }

    async ObterManifest(codigo:string) : Promise<any> {
        const select = `SELECT
                        p.nome_fantasia as name,
                        t.tag, 
                        t.accent, 
                        t.accent2, 
                        t.logo_url, 
                        t.logo,
                        t.favicon,
                        t.icone192,
                        t.icone512,
                        t.maskable
                        FROM theme t JOIN provedores p ON t.codigo_provedor_fk = p.codigo_provedor 
                        WHERE p.codigo_provedor = $1;`;

        const result = await this._db.Execulte<any>(select, [codigo])

        const tema = result[0];

        return tema;
    }

    async ObterBanners(codigo:string) : Promise<any> {
        const select = `select * from marketing_banners where codigo_provedor_fk = $1;`;

        const result = await this._db.Execulte<any>(select, [codigo])

        const banners = result;

        return banners;
    }

    async ObterAnuncios(codigo:string) : Promise<any> {
        const select = "SELECT * FROM marketing_anuncios WHERE codigo_provedor_fk = $1";

        const result = await this._db.Execulte<any>(select, [codigo])

        const parceiros = result;

        return parceiros;
    }

    async ObterBeneficios(codigo:string) : Promise<any> {
        const select = `
            SELECT mb.*, pa.cidade AS parceiro_cidade, pa.uf AS parceiro_uf,
                   pa.endereco AS parceiro_endereco, pa.contato AS parceiro_contato
            FROM marketing_beneficios mb
            JOIN beneficio_provedores bp ON bp.beneficio_id = mb.id
            LEFT JOIN parceiros pa ON pa.id = mb.parceiro_id_fk
            WHERE bp.codigo_provedor_fk = $1 AND bp.ativo = true AND mb.ativo = true;
        `;

        const result = await this._db.Execulte<any>(select, [codigo])

        return result;
    }

    async ObterModulosAtivos(codigo:string) : Promise<string[]> {
        const select = `SELECT modulo FROM provedor_modulos WHERE codigo_provedor_fk = $1 AND ativo = true;`;
        const result = await this._db.Execulte<{ modulo:string }>(select, [codigo]);
        return result.map((r) => r.modulo);
    }

    async ObterHomeConfig(codigo:string) : Promise<homeConfigModel> {
        const select = `SELECT banner, fatura, consumo, atalhos FROM provedor_home_config WHERE codigo_provedor_fk = $1;`;
        const result = await this._db.Execulte<homeConfigModel>(select, [codigo]);

        if (result.length > 0)
            return result[0];

        return { banner: true, fatura: true, consumo: true, atalhos: true };
    }

    async ObterAtendimento(codigo:string) : Promise<atendimentoModel> {
        const select = `SELECT whatsapp, telefone, email, site, instagram FROM provedor_atendimento WHERE codigo_provedor_fk = $1;`;
        const result = await this._db.Execulte<atendimentoModel>(select, [codigo]);

        if (result.length > 0)
            return result[0];

        return { whatsapp: null, telefone: null, email: null, site: null, instagram: null };
    }

    async ObterClubeBeneficios(codigo:string) : Promise<clubeBeneficiosModel> {
        const select = `SELECT nome, mensagem FROM provedor_clube_beneficios WHERE codigo_provedor_fk = $1;`;
        const result = await this._db.Execulte<clubeBeneficiosModel>(select, [codigo]);

        if (result.length > 0)
            return result[0];

        return { nome: null, mensagem: null };
    }

    async ObterIxcAssuntos(codigo:string) : Promise<ixcAssuntoModel[]> {
        const select = `SELECT id, nome, id_assunto_ixc FROM provedor_ixc_assuntos WHERE codigo_provedor_fk = $1 ORDER BY nome ASC;`;
        return await this._db.Execulte<ixcAssuntoModel>(select, [codigo]);
    }

    async RegistrarCliqueBeneficio(idBeneficio:number, codigoProvedor:number) : Promise<void> {
        // só grava se a oferta realmente estiver ativada pra esse provedor (evita log cruzado/forjado)
        const insert = `
            INSERT INTO beneficio_cliques (beneficio_id, codigo_provedor_fk)
            SELECT mb.id, bp.codigo_provedor_fk
            FROM marketing_beneficios mb
            JOIN beneficio_provedores bp ON bp.beneficio_id = mb.id
            WHERE mb.id = $1 AND bp.codigo_provedor_fk = $2 AND bp.ativo = true;
        `;
        await this._db.Execulte<any>(insert, [idBeneficio, codigoProvedor]);
    }

    async ObterBeneficioPorId(idBeneficio:number, codigoProvedor:number) : Promise<beneficioModel> {
        const select = `
            SELECT mb.* FROM marketing_beneficios mb
            JOIN beneficio_provedores bp ON bp.beneficio_id = mb.id
            WHERE mb.id = $1 AND bp.codigo_provedor_fk = $2 AND bp.ativo = true AND mb.ativo = true;
        `;
        const result = await this._db.Execulte<beneficioModel>(select, [idBeneficio, codigoProvedor]);
        return result[0];
    }

    async ObterConfigComissao() : Promise<configComissaoModel> {
        const select = `SELECT percentual_parceiro, percentual_synk, percentual_provedor FROM config_comissao WHERE id = 1;`;
        const result = await this._db.Execulte<configComissaoModel>(select, []);
        return result[0];
    }

    async RegistrarCompra(compra:compraModel) : Promise<compraModel> {
        const insert = `
            INSERT INTO beneficio_compras
            (beneficio_id, codigo_provedor_fk, cliente_nome, cliente_cpf_cnpj, cupom_codigo, valor, valor_original,
             percentual_parceiro, percentual_synk, percentual_provedor, valor_parceiro, valor_synk, valor_provedor, status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pendente')
            RETURNING *;
        `;
        const result = await this._db.Execulte<compraModel>(insert, [
            compra.beneficio_id, compra.codigo_provedor_fk, compra.cliente_nome, compra.cliente_cpf_cnpj,
            compra.cupom_codigo, compra.valor, compra.valor_original ?? null, compra.percentual_parceiro, compra.percentual_synk,
            compra.percentual_provedor, compra.valor_parceiro, compra.valor_synk, compra.valor_provedor,
        ]);
        return result[0];
    }

    async ObterComprasCliente(codigoProvedor:string, cpfCnpj:string) : Promise<compraModel[]> {
        const select = `
            SELECT c.*, b.titulo AS beneficio_titulo, b.parceiro AS beneficio_parceiro
            FROM beneficio_compras c
            JOIN marketing_beneficios b ON b.id = c.beneficio_id
            WHERE c.codigo_provedor_fk = $1 AND c.cliente_cpf_cnpj = $2
            ORDER BY c.criado_em DESC;
        `;
        return await this._db.Execulte<any>(select, [codigoProvedor, cpfCnpj]);
    }

    async RegistrarLoginCliente(codigoProvedor:string, cpfCnpj:string, nome:string) : Promise<void> {
        const upsert = `
            INSERT INTO cliente_atividade (codigo_provedor_fk, cliente_cpf_cnpj, cliente_nome, ultimo_login)
            VALUES ($1, $2, $3, now())
            ON CONFLICT (codigo_provedor_fk, cliente_cpf_cnpj)
            DO UPDATE SET ultimo_login = now(), cliente_nome = EXCLUDED.cliente_nome;
        `;
        await this._db.Execulte<any>(upsert, [codigoProvedor, cpfCnpj, nome]);
    }

    async ObterSaldoPontos(codigoProvedor:string, cpfCnpj:string) : Promise<number> {
        const select = `SELECT COALESCE(SUM(pontos), 0) AS saldo FROM pontos_extrato WHERE codigo_provedor_fk = $1 AND cliente_cpf_cnpj = $2;`;
        const result = await this._db.Execulte<{ saldo:string }>(select, [codigoProvedor, cpfCnpj]);
        return Number.parseInt(result[0]?.saldo ?? "0");
    }

    async ObterExtratoPontos(codigoProvedor:string, cpfCnpj:string) : Promise<extratoPontosModel[]> {
        const select = `
            SELECT e.*, b.titulo AS beneficio_titulo, r.titulo AS recompensa_titulo
            FROM pontos_extrato e
            LEFT JOIN beneficio_compras c ON c.id = e.origem_compra_id
            LEFT JOIN marketing_beneficios b ON b.id = c.beneficio_id
            LEFT JOIN pontos_recompensas r ON r.id = e.origem_recompensa_id
            WHERE e.codigo_provedor_fk = $1 AND e.cliente_cpf_cnpj = $2
            ORDER BY e.criado_em DESC;
        `;
        return await this._db.Execulte<any>(select, [codigoProvedor, cpfCnpj]);
    }

    async ObterRecompensasAtivas(codigoProvedor:string) : Promise<recompensaModel[]> {
        const select = `SELECT * FROM pontos_recompensas WHERE codigo_provedor_fk = $1 AND ativo = true ORDER BY pontos_necessarios ASC;`;
        return await this._db.Execulte<recompensaModel>(select, [codigoProvedor]);
    }

    async ObterPlanosMoveisAtivos(codigoProvedor:string) : Promise<planoMovelModel[]> {
        const select = `SELECT * FROM planos_moveis WHERE codigo_provedor_fk = $1 AND ativo = true ORDER BY ordem ASC, valor ASC;`;
        return await this._db.Execulte<planoMovelModel>(select, [codigoProvedor]);
    }

    // Busca pública mas ainda restrita a plano ativo desse provedor — usada
    // pra revalidar o plano no servidor na hora de gravar a solicitação (não
    // confia no nome/valor que o app manda).
    async ObterPlanoMovelAtivoPorId(id:number, codigoProvedor:string) : Promise<planoMovelModel|null> {
        const select = `SELECT * FROM planos_moveis WHERE id = $1 AND codigo_provedor_fk = $2 AND ativo = true;`;
        const result = await this._db.Execulte<planoMovelModel>(select, [id, codigoProvedor]);
        return result[0] ?? null;
    }

    // Solicitação de plano móvel — fluxo próprio do Synk (não passa pelo
    // gerenciador, ver SQL 2026_09_solicitacoes_planos_moveis.sql).
    async CriarSolicitacaoPlanoMovel(codigoProvedor:string, plano:planoMovelModel, cpfCnpj:string, nomeCliente:string|null) : Promise<solicitacaoPlanoMovelModel> {
        const insert = `INSERT INTO solicitacoes_planos_moveis
            (codigo_provedor_fk, plano_id_fk, plano_nome, plano_valor, cliente_cpf_cnpj, cliente_nome)
            VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;`;
        const result = await this._db.Execulte<solicitacaoPlanoMovelModel>(insert, [
            codigoProvedor, plano.id, plano.nome, plano.valor, cpfCnpj, nomeCliente,
        ]);
        return result[0];
    }

    async ObterRecompensaPorIdPublico(idRecompensa:number, codigoProvedor:number) : Promise<recompensaModel> {
        const select = `SELECT * FROM pontos_recompensas WHERE id = $1 AND codigo_provedor_fk = $2 AND ativo = true;`;
        const result = await this._db.Execulte<recompensaModel>(select, [idRecompensa, codigoProvedor]);
        return result[0];
    }

    async RegistrarResgate(codigoProvedor:number, cpfCnpj:string, nome:string, recompensa:recompensaModel, cupom:string) : Promise<extratoPontosModel> {
        const insert = `INSERT INTO pontos_extrato
            (codigo_provedor_fk, cliente_cpf_cnpj, cliente_nome, tipo, pontos, origem_recompensa_id, cupom_codigo)
            VALUES ($1,$2,$3,'resgate',$4,$5,$6) RETURNING *;`;
        const result = await this._db.Execulte<extratoPontosModel>(insert, [
            codigoProvedor, cpfCnpj, nome, -recompensa.pontos_necessarios, recompensa.id, cupom,
        ]);
        return result[0];
    }

    async ListarParceirosAtivos(codigoProvedor:string) : Promise<parceiroModel[]> {
        // vê os parceiros do próprio provedor + os nacionais (codigo_provedor_fk nulo)
        const select = `SELECT id, nome_parceiro as nome FROM parceiros
            WHERE ativo = true AND (codigo_provedor_fk = $1 OR codigo_provedor_fk IS NULL)
            ORDER BY nome ASC;`;
        return await this._db.Execulte<parceiroModel>(select, [codigoProvedor]);
    }

    // PAINEL

    async Login(loginPainel:loginPainel) : Promise<any> {
        const result = await this._db.Execulte<provedorModel>("SELECT * FROM provedores WHERE codigo_provedor = $1 AND usuario = $2 AND senha = $3", [loginPainel.codigoProvedor, loginPainel.usuario, loginPainel.senha])
        
        const provedor = result[0];

        return new Provedor(
            provedor.empresa,
            provedor.nome_fantasia,
            provedor.codigo_provedor,
            provedor.status,
            provedor.gerenciador,
            provedor.codigo_api_gerenciador,
            provedor.chave_api_gerenciador,
            provedor.nome_administrador,
            provedor.cnpj,
            provedor.dominio_ixc,
            provedor.usuario,
            provedor.senha
        );
    }

    async AlterarTema(themeModel:themeModel) : Promise<any> {

        
        const update = `INSERT INTO theme (
                        tag,
                        accent,
                        accent2,
                        logo_url,
                        codigo_provedor_fk,
                        logo,
                        favicon,
                        icone192,
                        icone512,
                        maskable
                    )
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                    ON CONFLICT (codigo_provedor_fk)
                    DO UPDATE SET
                        tag = EXCLUDED.tag,
                        accent = EXCLUDED.accent,
                        accent2 = EXCLUDED.accent2,
                        logo_url = EXCLUDED.logo_url,
                        logo = EXCLUDED.logo_url,
                        favicon = EXCLUDED.favicon,
                        icone192 = EXCLUDED.icone192,
                        icone512 = EXCLUDED.icone512,
                        maskable = EXCLUDED.maskable
                    RETURNING *;`;

        const result = await this._db.Execulte<any>(update, [themeModel.tag, themeModel.accent, themeModel.accent2, themeModel.logo, themeModel.codigo, themeModel.logo, themeModel.favicon, themeModel.icone192, themeModel.icone512, themeModel.maskable])
        
        if(result)
            return result;

        throw new Error("Não foi possivle alterar")
    }

    async SalvarIndicacao(indicacao:indicacaoModel) : Promise<any> {
        const insert = `INSERT INTO indicacoes
                        (nome_cliente, cliente_cpf_cnpj, indicado, contato, mensagem, codigo_provedor_fk)
                        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;
        const result = await this._db.Execulte<any>(insert, [indicacao.cliente, indicacao.cliente_cpf_cnpj ?? null, indicacao.nome, indicacao.contato, indicacao.mensagem, indicacao.codigo_provedor])

        if(result)
            return result;

        throw new Error("Não foi possivle salvar")

    }

    async ObterIndicacoes(codigoProvedor:string) : Promise<any> {

        return await this._db.Execulte("SELECT * FROM indicacoes WHERE codigo_provedor_fk = $1 ORDER BY created_at DESC", [codigoProvedor]);
    }

    async AvaliarServico(avaliacao:avaliacaoModel) : Promise<any> {
        
        return await this._db.Execulte("INSERT INTO avaliacao_servico (cliente, nota, mensagem, codigo_provedor_fk ) VALUES ($1,$2,$3,$4)", [avaliacao.cliente, avaliacao.nota, avaliacao.mensagem, avaliacao.codigo_provedor_fk])
    }

    async ObterAvaliacoesServico(codigoProvedor:string) : Promise<any> {
        
        return await this._db.Execulte("SELECT * FROM avaliacao_servico WHERE codigo_provedor_fk = $1", [codigoProvedor])
    }

    async AvaliarApp(avaliacao:avaliacaoModel) : Promise<any> {
        
        return await this._db.Execulte("INSERT INTO avaliacao_app (cliente, nota, mensagem, codigo_provedor_fk ) VALUES ($1,$2,$3,$4)", [avaliacao.cliente, avaliacao.nota, avaliacao.mensagem, avaliacao.codigo_provedor_fk])
    }

    async ObterAvaliacoesApp(codigoProvedor:string) : Promise<any> {

        return await this._db.Execulte("SELECT * FROM avaliacao_app WHERE codigo_provedor_fk = $1", [codigoProvedor])
    }

    async CriarAtivacaoTv(codigo:string, codigoProvedor:number, clienteNome:string | null) : Promise<ativacaoTvModel> {
        const insert = `INSERT INTO ativacoes_tv (codigo, codigo_provedor_fk, cliente_nome)
                        VALUES ($1, $2, $3) RETURNING *;`;
        const result = await this._db.Execulte<ativacaoTvModel>(insert, [codigo, codigoProvedor, clienteNome]);
        return result[0];
    }

    async ListarAtivacoesTv(codigoProvedor:number) : Promise<ativacaoTvModel[]> {
        const select = `SELECT * FROM ativacoes_tv WHERE codigo_provedor_fk = $1 ORDER BY criado_em DESC;`;
        return await this._db.Execulte<ativacaoTvModel>(select, [codigoProvedor]);
    }

    // Único ponto que o app de TV usa pra decidir se libera sem cobrar a
    // licença — por isso confere código E provedor juntos (o mesmo código
    // não pode ser reaproveitado apontando pra outro codigo_provedor).
    async ObterAtivacaoTvAtiva(codigo:string, codigoProvedor:string) : Promise<ativacaoTvModel | null> {
        const select = `SELECT * FROM ativacoes_tv WHERE codigo = $1 AND codigo_provedor_fk = $2 AND status = 'ativo';`;
        const result = await this._db.Execulte<ativacaoTvModel>(select, [codigo, codigoProvedor]);
        return result[0] ?? null;
    }

    async MarcarAtivacaoTvUsada(id:number) : Promise<void> {
        await this._db.Execulte(`UPDATE ativacoes_tv SET usado_em = now() WHERE id = $1 AND usado_em IS NULL;`, [id]);
    }

    async RevogarAtivacaoTv(id:number, codigoProvedor:number) : Promise<ativacaoTvModel> {
        const update = `UPDATE ativacoes_tv SET status = 'revogado' WHERE id = $1 AND codigo_provedor_fk = $2 RETURNING *;`;
        const result = await this._db.Execulte<ativacaoTvModel>(update, [id, codigoProvedor]);
        if (!result[0])
            throw new Error("Código de ativação não encontrado.");
        return result[0];
    }
}