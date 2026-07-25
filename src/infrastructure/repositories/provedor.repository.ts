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

    async ObterTema(codigo:string) : Promise<any> {
        const select = `SELECT p.codigo_provedor as codigo, p.nome_fantasia as nome, t.tag, t.accent, t.accent2, t.logo_url, 
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

        const result = await this._db.Execulte<any>(update, [themeModel.tag, themeModel.accent, themeModel.accent2, themeModel.logo_url, themeModel.codigo_provedor_fk, themeModel.logo_url, themeModel.favicon_url, themeModel.icone192_url, themeModel.icone512_url, themeModel.maskable_url])
        
        if(result)
            return result;

        throw new Error("Não foi possivle alterar")
    }

    async SalvarIndicacao(indicacao:indicacaoModel) : Promise<any> {
        const insert = `INSERT INTO indicacoes 
                        (nome_cliente, indicado, contato, mensagem, codigo_provedor_fk)
                        VALUES ($1, $2, $3, $4, $5) RETURNING id`;
        const result = await this._db.Execulte<any>(insert, [indicacao.cliente, indicacao.nome, indicacao.contato, indicacao.mensagem, indicacao.codigo_provedor])
        
        if(result)
            return result;

        throw new Error("Não foi possivle salvar")
                     
    }

    async ObterIndicacoes(codigoProvedor:string) : Promise<any> {
        
        return await this._db.Execulte("SELECT * FROM indicacoes WHERE codigo_provedor_fk = $1", [codigoProvedor]);
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
}