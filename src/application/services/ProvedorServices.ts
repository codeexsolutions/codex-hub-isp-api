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
import { compraModel } from "../../core/models/compraModel";
import { gerarCupom } from "../../common/utilities/cupom";
import { ativacaoTvModel } from "../../core/models/ativacaoTvModel";
import INotificacaoPainelServices from "../interfaces/INotificacaoPainelServices";

@injectable()
export default class ProvedorServices implements IProvedorServices {

    private readonly _provedorRepository:IProvedorRepository;
    private readonly _notificacaoPainelService:INotificacaoPainelServices;

    constructor(
        @inject("IProvedorRepository") provedorRepository:IProvedorRepository,
        @inject("INotificacaoPainelServices") notificacaoPainelService:INotificacaoPainelServices
    ){
        this._provedorRepository = provedorRepository;
        this._notificacaoPainelService = notificacaoPainelService;
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
            senha: provedorAtualizado.Senha()
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
                maskable: result.maskable,
                gerenciador: result.gerenciador
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

    async ObterBeneficios(codigo: string): Promise<any> {
        const modulos = await this._provedorRepository.ObterModulosAtivos(codigo);
        if(!modulos.includes("beneficios"))
            return [];
        return await this._provedorRepository.ObterBeneficios(codigo);
    }

    async ObterModulosAtivos(codigo: string): Promise<string[]> {
        return await this._provedorRepository.ObterModulosAtivos(codigo);
    }

    async ObterHomeConfig(codigo: string) {
        return await this._provedorRepository.ObterHomeConfig(codigo);
    }

    async ObterAtendimento(codigo: string) {
        return await this._provedorRepository.ObterAtendimento(codigo);
    }

    async ObterClubeBeneficios(codigo: string) {
        return await this._provedorRepository.ObterClubeBeneficios(codigo);
    }

    async ObterIxcAssuntos(codigo: string) {
        return await this._provedorRepository.ObterIxcAssuntos(codigo);
    }

    async RegistrarCliqueBeneficio(idBeneficio: number, codigoProvedor: number): Promise<void> {
        await this._provedorRepository.RegistrarCliqueBeneficio(idBeneficio, codigoProvedor);
    }

    async ComprarBeneficio(idBeneficio: number, codigoProvedor: number, clienteNome: string, clienteCpfCnpj: string): Promise<compraModel> {

        const modulos = await this._provedorRepository.ObterModulosAtivos(codigoProvedor.toString());
        if (!modulos.includes("beneficios"))
            throw new Error("Módulo de benefícios não está ativo para este provedor.");

        const beneficio = await this._provedorRepository.ObterBeneficioPorId(idBeneficio, codigoProvedor);
        if (!beneficio)
            throw new Error("Benefício não encontrado.");
        if (beneficio.valor == null)
            throw new Error("Este benefício não está disponível para compra.");
        if (!clienteNome || !clienteCpfCnpj)
            throw new Error("Dados do cliente incompletos.");

        const config = await this._provedorRepository.ObterConfigComissao();
        const valor = Number(beneficio.valor);
        const arredonda = (v: number) => Math.round(v * 100) / 100;

        const compra: compraModel = {
            id: 0,
            beneficio_id: idBeneficio,
            codigo_provedor_fk: codigoProvedor,
            cliente_nome: clienteNome,
            cliente_cpf_cnpj: clienteCpfCnpj,
            cupom_codigo: "",
            valor,
            valor_original: beneficio.valor_original != null ? Number(beneficio.valor_original) : null,
            percentual_parceiro: Number(config.percentual_parceiro),
            percentual_synk: Number(config.percentual_synk),
            percentual_provedor: Number(config.percentual_provedor),
            valor_parceiro: arredonda(valor * Number(config.percentual_parceiro) / 100),
            valor_synk: arredonda(valor * Number(config.percentual_synk) / 100),
            valor_provedor: arredonda(valor * Number(config.percentual_provedor) / 100),
        };

        // tenta algumas vezes em caso de colisão de cupom (extremamente raro)
        let compraGravada: compraModel|null = null;
        for (let tentativa = 0; tentativa < 5; tentativa++) {
            compra.cupom_codigo = gerarCupom();
            try {
                compraGravada = await this._provedorRepository.RegistrarCompra(compra);
                break;
            } catch (error: any) {
                const ultimaTentativa = tentativa === 4;
                if (ultimaTentativa || !String(error.message).includes("cupom_codigo"))
                    throw error;
            }
        }

        if (!compraGravada)
            throw new Error("Não foi possível gerar o cupom da compra.");

        // compra nasce "pendente" — pontos só são creditados quando o parceiro validar o
        // cupom (ParceiroServices.ValidarCupom) ou o admin confirmar manualmente.
        return compraGravada;
    }

    async ObterMinhasCompras(codigoProvedor: string, cpfCnpj: string): Promise<compraModel[]> {
        return await this._provedorRepository.ObterComprasCliente(codigoProvedor, cpfCnpj);
    }

    async RegistrarLoginCliente(codigoProvedor: string, cpfCnpj: string, nome: string): Promise<void> {
        await this._provedorRepository.RegistrarLoginCliente(codigoProvedor, cpfCnpj, nome);
    }

    async ObterMeusPontos(codigo: string, cpfCnpj: string) {
        const [saldo, extrato] = await Promise.all([
            this._provedorRepository.ObterSaldoPontos(codigo, cpfCnpj),
            this._provedorRepository.ObterExtratoPontos(codigo, cpfCnpj),
        ]);
        return { saldo, extrato };
    }

    async ObterRecompensas(codigo: string) {
        const modulos = await this._provedorRepository.ObterModulosAtivos(codigo);
        if (!modulos.includes("recompensas"))
            return [];
        return await this._provedorRepository.ObterRecompensasAtivas(codigo);
    }

    async ObterPlanosMoveis(codigo: string) {
        const modulos = await this._provedorRepository.ObterModulosAtivos(codigo);
        if (!modulos.includes("planos_moveis"))
            return [];
        return await this._provedorRepository.ObterPlanosMoveisAtivos(codigo);
    }

    // Landing Page pública (módulo "landpage") — agrega tema, contato, planos
    // de internet/móvel e a config de LP num payload só. headline/subheadline
    // ficam com um texto padrão de destaque quando o provedor não preencheu
    // nada — a LP funciona "pronta" sem exigir cadastro extra.
    async ObterLpPublica(codigo: string) {
        const modulos = await this._provedorRepository.ObterModulosAtivos(codigo);
        if (!modulos.includes("landpage"))
            return null;

        const lpConfig = await this._provedorRepository.ObterLpConfig(codigo);
        if (!lpConfig.ativa)
            return null;

        const [tema, atendimento, planosInternet, planosMoveis] = await Promise.all([
            this.ObterTema(codigo),
            this._provedorRepository.ObterAtendimento(codigo),
            this._provedorRepository.ObterPlanosInternetAtivos(codigo),
            modulos.includes("planos_moveis") ? this._provedorRepository.ObterPlanosMoveisAtivos(codigo) : Promise.resolve([]),
        ]);

        return {
            tema,
            atendimento,
            cidade: lpConfig.cidade,
            headline: lpConfig.headline?.trim() || `A internet do jeito que ${tema.nome} entrega: rápida e sem enrolação.`,
            subheadline: lpConfig.subheadline?.trim() || "Planos de fibra e internet móvel pra você ficar conectado sem pagar caro por isso.",
            planosInternet,
            planosMoveis,
        };
    }

    // Fluxo próprio do Synk (não passa pelo chamado do gerenciador — o
    // ReceitaNet só permite 1 chamado aberto por vez, o que fazia essa
    // solicitação falhar toda hora que o cliente já tinha outro em aberto).
    // A solicitação vira um registro no Synk e um aviso no sino do painel.
    async SolicitarPlanoMovel(codigo: string, planoId: number, cpfCnpj: string, clienteNome: string | null) {
        const modulos = await this._provedorRepository.ObterModulosAtivos(codigo);
        if (!modulos.includes("planos_moveis"))
            throw new Error("Módulo de internet móvel não está ativo para este provedor.");
        if (!cpfCnpj?.trim())
            throw new Error("Dados do cliente incompletos.");

        const plano = await this._provedorRepository.ObterPlanoMovelAtivoPorId(planoId, codigo);
        if (!plano)
            throw new Error("Plano não encontrado.");

        const solicitacao = await this._provedorRepository.CriarSolicitacaoPlanoMovel(codigo, plano, cpfCnpj.trim(), clienteNome?.trim() || null);

        this._notificacaoPainelService
            .Avisar(codigo, "plano_movel", "Nova solicitação de plano móvel", `${clienteNome?.trim() || "Um cliente"} solicitou o plano "${plano.nome}" (R$ ${Number(plano.valor).toFixed(2).replace(".", ",")}/mês).`)
            .catch((error) => console.error("Erro ao avisar provedor sobre solicitação de plano móvel:", error));

        return solicitacao;
    }

    async ResgatarRecompensa(codigo: string, cpfCnpj: string, clienteNome: string, idRecompensa: number) {

        const modulos = await this._provedorRepository.ObterModulosAtivos(codigo);
        if (!modulos.includes("recompensas"))
            throw new Error("Módulo de recompensas não está ativo para este provedor.");

        const recompensa = await this._provedorRepository.ObterRecompensaPorIdPublico(idRecompensa, Number.parseInt(codigo));
        if (!recompensa)
            throw new Error("Recompensa não encontrada.");
        if (!cpfCnpj || !clienteNome)
            throw new Error("Dados do cliente incompletos.");

        const saldo = await this._provedorRepository.ObterSaldoPontos(codigo, cpfCnpj);
        if (saldo < recompensa.pontos_necessarios)
            throw new Error("Saldo de pontos insuficiente para essa recompensa.");

        const cupom = gerarCupom();
        return await this._provedorRepository.RegistrarResgate(Number.parseInt(codigo), cpfCnpj, clienteNome, recompensa, cupom);
    }

    async ListarParceirosAtivos(codigoProvedor:string) {
        return await this._provedorRepository.ListarParceirosAtivos(codigoProvedor);
    }

    async AtualizarTema(tema:themeModel, files:ThemeFiles) : Promise<any> {

        const _upload = new UploadService()
        let temaAtual = await this._provedorRepository.ObterTema(tema.codigo.toString())
        
        const temaNovo:themeModel = {
            codigo:tema.codigo,
            nome_fantasia: tema.nome_fantasia,
            icone192:'',
            icone512:'',
            maskable:''
        }

        if(temaAtual === undefined){
           temaAtual = temaNovo            
        }
        
        
        if(temaAtual !== undefined){
            
            temaAtual.tag = tema.tag
            temaAtual.accent = tema.accent;
            temaAtual.accent2 = tema.accent2;
            temaAtual.glyph = tema.glyph;
            temaAtual.nome_fantasia = tema.nome_fantasia
            
        }


        if(files.logo?.[0]){
            temaAtual.logo = await _upload.UploadArquivo({
               codigoProvedor: tema.codigo.toString(),
               file: files.logo[0].buffer,
               nomeArquivo: "logo",
               tipo: ETipoArquivo.LOGO
           });
        }

        if(files.favicon?.[0]){
           temaAtual.favicon = await _upload.UploadArquivo({
               codigoProvedor: tema.codigo.toString(),
               file: files.favicon[0].buffer,
               nomeArquivo: "favicon",
               tipo: ETipoArquivo.FAVICON
           })
        }

        if(files.icon192?.[0]){
           temaAtual.icone192 = await _upload.UploadArquivo({
               codigoProvedor: tema.codigo.toString(),
               file: files.icon192[0].buffer,
               nomeArquivo: "icon192",
               tipo: ETipoArquivo.ICON192
           })
        }

        if(files.icon512?.[0]){
           temaAtual.icone512 = await _upload.UploadArquivo({
               codigoProvedor: tema.codigo.toString(),
               file: files.icon512[0].buffer,
               nomeArquivo: "icon512",
               tipo: ETipoArquivo.ICON512
           })
        }

        if(files.maskable?.[0]){
           temaAtual.maskable = await _upload.UploadArquivo({
               codigoProvedor: tema.codigo.toString(),
               file: files.maskable[0].buffer,
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

    // ATIVAÇÃO TV — código gerado pelo provedor e enviado pro cliente. É o que
    // realmente autoriza pular a licença paga do synk-tv; o codigo_provedor
    // sozinho não basta (é público, usado só pra tema/branding).
    async GerarAtivacaoTv(codigoProvedor: number, clienteNome?: string): Promise<ativacaoTvModel> {
        const codigo = gerarCupom();
        return await this._provedorRepository.CriarAtivacaoTv(codigo, codigoProvedor, clienteNome?.trim() || null);
    }

    async ListarAtivacoesTv(codigoProvedor: number): Promise<ativacaoTvModel[]> {
        return await this._provedorRepository.ListarAtivacoesTv(codigoProvedor);
    }

    async RevogarAtivacaoTv(codigoProvedor: number, id: number): Promise<ativacaoTvModel> {
        return await this._provedorRepository.RevogarAtivacaoTv(id, codigoProvedor);
    }

    // Público — chamado pelo app de TV. Não revela se o código existe pra outro
    // provedor nem se já foi usado: só "válido" ou "inválido" pra esse par.
    async ValidarAtivacaoTv(codigoProvedor: string, codigo: string): Promise<{ valido: boolean }> {
        const ativacao = await this._provedorRepository.ObterAtivacaoTvAtiva(codigo?.trim().toUpperCase() ?? "", codigoProvedor);
        if (!ativacao) return { valido: false };

        await this._provedorRepository.MarcarAtivacaoTvUsada(ativacao.id);
        return { valido: true };
    }

}