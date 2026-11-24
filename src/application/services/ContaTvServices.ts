import { inject, injectable } from "tsyringe";
import bcrypt from "bcrypt";
import IContaTvServices, { CadastroContaTvResultado } from "../interfaces/IContaTvServices";
import IContaTvRepository from "../../core/interfaces/IContaTvRepository";
import ILinkTesteIptvRepository from "../../core/interfaces/ILinkTesteIptvRepository";
import DeylerTrialService from "../../infrastructure/apis/DeylerTrialService";
import { contaTvModel } from "../../core/models/contaTvModel";
import JwtService from "./JwtServices";

const SALT_ROUNDS = 10;

@injectable()
export default class ContaTvServices implements IContaTvServices {

    private readonly _contaTvRepository: IContaTvRepository;
    private readonly _linkTesteIptvRepository: ILinkTesteIptvRepository;
    private readonly _deylerTrialService: DeylerTrialService;
    private readonly _jwtService: JwtService;

    constructor(
        @inject("IContaTvRepository") contaTvRepository: IContaTvRepository,
        @inject("ILinkTesteIptvRepository") linkTesteIptvRepository: ILinkTesteIptvRepository,
        @inject(DeylerTrialService) deylerTrialService: DeylerTrialService,
    ) {
        this._contaTvRepository = contaTvRepository;
        this._linkTesteIptvRepository = linkTesteIptvRepository;
        this._deylerTrialService = deylerTrialService;
        this._jwtService = new JwtService();
    }

    private gerarToken(conta: contaTvModel): string {
        return this._jwtService.GerarToken({ id: conta.id.toString(), codigoProvedor: "", contaTvId: conta.id.toString(), role: "conta-tv" });
    }

    async Cadastrar(nome: string, email: string, senha: string): Promise<CadastroContaTvResultado> {
        if (!nome?.trim() || !email?.trim() || !senha || senha.length < 6)
            throw new Error("Informe nome, email e uma senha com pelo menos 6 caracteres.");

        const emailNormalizado = email.trim().toLowerCase();
        const existente = await this._contaTvRepository.ObterPorEmail(emailNormalizado);
        if (existente)
            throw new Error("Já existe uma conta com esse email.");

        const linkTeste = await this._linkTesteIptvRepository.ObterPadrao();
        if (!linkTeste)
            throw new Error("Nenhum link de teste IPTV configurado no painel ainda.");

        const iptv = await this._deylerTrialService.GerarTeste(linkTeste.url);
        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

        const conta = await this._contaTvRepository.Criar(nome.trim(), emailNormalizado, senhaHash, iptv);

        return { token: this.gerarToken(conta), conta };
    }

    async Login(email: string, senha: string): Promise<CadastroContaTvResultado> {
        const conta = await this._contaTvRepository.ObterPorEmail(email?.trim().toLowerCase());
        if (!conta || !(await bcrypt.compare(senha ?? "", conta.senha_hash ?? "")))
            throw new Error("Email ou senha inválido.");

        return { token: this.gerarToken(conta), conta };
    }

    async ObterMinhaConta(contaId: number): Promise<contaTvModel> {
        const conta = await this._contaTvRepository.ObterPorId(contaId);
        if (!conta)
            throw new Error("Conta não encontrada.");
        return conta;
    }

    async Listar(): Promise<contaTvModel[]> {
        return await this._contaTvRepository.Listar();
    }

    async DefinirStatusPagamento(id: number, status: string): Promise<contaTvModel> {
        if (!["pendente", "pago", "expirado"].includes(status))
            throw new Error("Status inválido.");
        return await this._contaTvRepository.DefinirStatusPagamento(id, status);
    }

    async DefinirIptv(id: number, usuario: string, senha: string, dns: string, vencimento: string | null): Promise<contaTvModel> {
        if (!usuario?.trim() || !senha?.trim() || !dns?.trim())
            throw new Error("Informe usuário, senha e DNS.");
        return await this._contaTvRepository.DefinirIptv(id, usuario.trim(), senha.trim(), dns.trim(), vencimento ? new Date(vencimento) : null);
    }

    async ContarNaoNotificadas(): Promise<number> {
        return await this._contaTvRepository.ContarNaoNotificadas();
    }

    async MarcarNotificada(id: number): Promise<void> {
        await this._contaTvRepository.MarcarNotificada(id);
    }

    async Excluir(id: number): Promise<void> {
        await this._contaTvRepository.Excluir(id);
    }
}
