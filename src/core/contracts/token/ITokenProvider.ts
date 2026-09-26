import Provedor from "../../domains/Provedor";
import { tokenDto } from "../../../application/Dtos/tokenDto";

// Mesma ideia de IChamadoProvider/IFaturaProvider/IClienteProvider: um
// contrato único pra "obter token de sessão" independente do ERP. `base` já
// vem com gerenciador/codigoProvedor/token=""/provedorAtivo preenchidos pelo
// TokenService (é sempre igual, não depende do ERP) — cada provider só
// completa os campos que são específicos da própria API.
export default interface ITokenProvider {
    obterToken(provedor: Provedor, codigoProvedor: string, cpf: string | undefined, base: tokenDto): Promise<tokenDto>;
    tokenPorContrato(provedor: Provedor, codigoProvedor: string, cpf: string, idContrato: string, base: tokenDto): Promise<tokenDto>;
}
