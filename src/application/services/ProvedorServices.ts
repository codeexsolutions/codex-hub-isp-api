import { inject, injectable } from "tsyringe";
import { provedorDto, provedorPainelDto, temaDto } from "../Dtos/provedorDto";
import IProvedorServices from "../interfaces/IProvedorServices";
import IProvedorRepository from "../../core/interfaces/IProvedorRepository";
import { cadastroProvedorDto } from "../Dtos/cadastroProvedorDto";
import { cadastroProvedorModel } from "../../core/models/cadastroProvevedorModel";
import { themeModel } from "../../core/models/themeModel";
import { indicacaoModel } from "../../core/models/indicacaoModel";
import { avaliacaoModel } from "../../core/models/avaliacaoModel";
//import Storage from "../../infrastructure/supabase/storage";
import { ThemeFiles } from "../Dtos/temaFiles.dto";
import Storage from "../../infrastructure/supabase/Storage";
import UploadService from "./UploadServices";
import { ETipoArquivo } from "../../infrastructure/supabase/ETipoArquivo";
import { ManifestModel } from "../Dtos/manifest.dto";

@injectable()
export default class ProvedorServices implements IProvedorServices {
    
    private readonly _provedorRepository:IProvedorRepository;
    
    constructor(@inject("IProvedorRepository") provedorRepository:IProvedorRepository){
        this._provedorRepository = provedorRepository;
        
    }    
    
    async Cadastrar(cadastro:cadastroProvedorDto): Promise<provedorPainelDto> {
        
        const provedor = await this._provedorRepository.ObterProvedorPorCpfCnpj(cadastro.cnpj as string);
        
        if(provedor){
            return {
                id: provedor.Id,
                empresa: provedor.Empresa ?? "",
                cnpj: provedor.CpfCnpj,
                gerenciador: provedor.Gerenciador,
                chave_api_gerenciador: provedor.ObterChaveApiGerenciador(),
                codigo_api_gerenciador: provedor.ObterCodigoApiGerenciador(),
                codigo_provedor: provedor.ObterCodigoProvedor(),
                nome_administrador: provedor.NomeAdministrador,
                nome_fantasia: provedor.NomeFantasia,
                status: provedor.Status,
                usuario: provedor.Usuario,
                dominio_ixc: provedor.DominioIxc,
                senha: provedor?.Senha()
            }
        }

        const novoProvedor =  await this._provedorRepository.Cadastrar({empresa: cadastro.empresa, cnpj: cadastro.cnpj, gerenciador: cadastro.gerenciador, nome_administrador: cadastro.nomeAdministrador, usuario: cadastro.usuario, senha: cadastro.senha})

        return {
            id: novoProvedor.Id,
            empresa: novoProvedor.Empresa,
            cnpj: novoProvedor.CpfCnpj,
            gerenciador: novoProvedor.Gerenciador,
            chave_api_gerenciador: novoProvedor.ObterChaveApiGerenciador(),
            codigo_api_gerenciador: novoProvedor.ObterCodigoApiGerenciador(),
            codigo_provedor: novoProvedor.ObterCodigoProvedor(),
            nome_administrador: novoProvedor.NomeAdministrador,
            nome_fantasia: novoProvedor.NomeFantasia,
            status: novoProvedor.Status,
            usuario: novoProvedor.Usuario,
            dominio_ixc: novoProvedor.DominioIxc,
            senha: novoProvedor.Senha()
        }
    }

    async Atualizar(update:cadastroProvedorModel) : Promise<provedorPainelDto> {
       
        const provedorAtualizado =  await this._provedorRepository.Atualizar(
            { 
                nome_fantasia: update.nome_fantasia, 
                nome_administrador: update.nome_administrador,
                codigo_api_gerenciador: update.codigo_api_gerenciador, 
                chave_api_gerenciador: update.chave_api_gerenciador, 
                codigo_provedor: update.codigo_provedor,
                usuario: update.usuario,
                senha: update.senha

            })  

        return {
            id: provedorAtualizado.Id,
            empresa: provedorAtualizado.Empresa,
            cnpj: provedorAtualizado.CpfCnpj,
            gerenciador: provedorAtualizado.Gerenciador,
            chave_api_gerenciador: provedorAtualizado.ObterChaveApiGerenciador(),
            codigo_api_gerenciador: provedorAtualizado.ObterCodigoApiGerenciador(),
            codigo_provedor: provedorAtualizado.ObterCodigoProvedor(),
            nome_administrador: provedorAtualizado.NomeAdministrador,
            nome_fantasia: provedorAtualizado.NomeFantasia,
            status: provedorAtualizado.Status,
            usuario: provedorAtualizado.Usuario,
            dominio_ixc: provedorAtualizado.DominioIxc,
        }
    }

    async ObterProvedor(codigoProvedor: string): Promise<provedorDto> {

        const result = await this._provedorRepository.ObterProvedor(codigoProvedor);
       
        const provedorDto:provedorDto = {
            nomeFantasia: result.NomeFantasia,
            gerenciador: result.Gerenciador,
            codigoApiGerenciador: result.ObterCodigoApiGerenciador(),
            chaveApiGerenciador: result.ObterChaveApiGerenciador(),
            status:result.Status
        }

        return provedorDto; 

    }

    async ObterTema(codigo: string): Promise<temaDto> {

        const result = await this._provedorRepository.ObterTema(codigo);
       
        if(result){

            const tema:temaDto = {
                codigo: result.codigo,
                nome: result.nome,
                tag: result.tag,
                accent: result.accent,
                accent2: result.accent2,
                glyph: result.glyph,
                logo_url: result.logo_url,
                logo: result.logo,
                favicon: result.favicon,
                icon192: result.icone192,
                icon512: result.icone512,
                maskable: result.maskable
            }

            return tema;
        }

        return {
                codigo: "",
                nome: "",
                tag: "",
                accent: "",
                accent2: "",
                glyph: "",
                logo_url: '',
                logo: '',
                favicon: '',
                icon192: '',
                icon512: '',
                maskable: ''
            }
    }

    async ObterManifest(codigo: string): Promise<ManifestModel> {
        const result = await this._provedorRepository.ObterManifest(codigo);
        return {
            name: result.name,
            short_name: result.name,
            description: "Central do Assinante",
            theme_color: result.accent,
            background_color: "#FFFFFF",
            display: "standalone",
            orientation: "portrait",
            scope: "/",
            start_url: "/",
            icons: [
                {
                    src: result.favicon,
                    sizes: "32x32",
                    type: "image/png"
                },
                {
                    src: result.icone192,
                    sizes: "192x192",
                    type: "image/png"
                },
                {
                    src: result.icone512,
                    sizes: "512x512",
                    type: "image/png"
                },
                {
                    src: result.maskable,
                    sizes: "512x512",
                    type: "image/png",
                    purpose: "maskable"
                }
            ]
        }
    }

    async ObterBanners(codigo:string) : Promise<any> {
        return await this._provedorRepository.ObterBanners(codigo);
        
    }

    async ObterAnuncios(codigo: string): Promise<any> {
        return await this._provedorRepository.ObterAnuncios(codigo);
    }

    async AtualizarTema(tema:themeModel, files:ThemeFiles) : Promise<any> {

        const _upload = new UploadService()
        const temaAtual = await this._provedorRepository.ObterTema(tema.codigo.toString())

        if(tema){
            temaAtual.tag = tema.tag
            temaAtual.accent = tema.accent;
            temaAtual.accent2 = tema.accent2;
            temaAtual.glyph = tema.glyph;
            temaAtual.nome = tema.nome_fantasia

        }

        if(Object.keys(files).length > 0){

            temaAtual.logo = await _upload.UploadArquivo({
               codigoProvedor: tema.codigo.toString(),
               file: files.logo![0].buffer,
               nomeArquivo: "logo",
               tipo: ETipoArquivo.LOGO
           });

           temaAtual.logo = tema.logo;
           
          temaAtual.favicon = await _upload.UploadArquivo({
               codigoProvedor: tema.codigo.toString(),
               file: files.favicon![0].buffer,
               nomeArquivo: "favicon",
               tipo: ETipoArquivo.FAVICON
           })
          
          temaAtual.icon192 = await _upload.UploadArquivo({
               codigoProvedor: tema.codigo.toString(),
               file: files.icon192![0].buffer,
               nomeArquivo: "icon192",
               tipo: ETipoArquivo.ICON192
           })
   
          temaAtual.icon512 = await _upload.UploadArquivo({
               codigoProvedor: tema.codigo.toString(),
               file: files.icon512![0].buffer,
               nomeArquivo: "icon512",
               tipo: ETipoArquivo.ICON512
           })
   
          temaAtual.maskable = await _upload.UploadArquivo({
               codigoProvedor: tema.codigo.toString(),
               file: files.maskable![0].buffer,
               nomeArquivo: "masckable",
               tipo: ETipoArquivo.MASKABLE
           })
           
        }  


        return await this._provedorRepository.AlterarTema(temaAtual);
       //return null; 
    }

    async SalvarIndicacao(indicao:indicacaoModel) : Promise<number> {
        return await this._provedorRepository.SalvarIndicacao(indicao);
    }

    async ObterIndicacoes(codigoProvedor:string) : Promise<any> {
        return await this._provedorRepository.ObterIndicacoes(codigoProvedor);
    }

    async AvaliarServico(avaliacao: avaliacaoModel): Promise<any> {
        return await this._provedorRepository.AvaliarServico(avaliacao);
    }
    async ObterAvaliacoesServico(codigoProvedor: string): Promise<any> {
        return await this._provedorRepository.ObterAvaliacoesServico(codigoProvedor);
    }
    async AvaliarApp(avaliacao: avaliacaoModel): Promise<any> {
        return await this._provedorRepository.AvaliarApp(avaliacao);
    }
    async ObterAvaliacoesApp(codigoProvedor: string): Promise<any> {
        return await this._provedorRepository.ObterAvaliacoesApp(codigoProvedor);
    }

}