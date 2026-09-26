// Compartilhado por todo domínio que precisa saber "qual cliente, de qual
// provedor, autenticado como". Cada gerenciador usa um subconjunto — o
// ReceitaNet autentica por token de sessão; o IXC não tem sessão própria,
// usa cpfCnpj + codigoProvedor direto a cada chamada.
export type SessaoErp = {
    gerenciador: string;
    token?: string;
    cpfCnpj?: string;
    codigoProvedor?: string;
    contratoId?: number;
};
