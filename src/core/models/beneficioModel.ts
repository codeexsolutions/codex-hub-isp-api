export type beneficioModel = {
    id:string;
    categoria:string;
    parceiro:string;
    titulo:string;
    subtitulo:string;
    descricao:string;
    link_imagem:string;
    link_acao:string;
    // histórico: quem originou o benefício migrado do modelo antigo (1 provedor).
    // Ofertas novas, criadas pelo parceiro, não preenchem isso — a visibilidade por
    // provedor vive em beneficio_provedores.
    codigo_provedor_fk?:number|null;
    ativo:boolean;
    valor?:number|null;
    valor_original?:number|null;
    validade_fim?:string|null;
    regras?:string|null;
    // dono real da oferta a partir do novo modelo.
    parceiro_id_fk?:number|null;
    file?:  Express.Multer.File;
    // presente só na listagem de catálogo do provedor (ObterCatalogoOfertas).
    ativo_para_mim?:boolean;
    // localização do parceiro dono da oferta — ajuda o provedor a decidir se faz
    // sentido ativar (evita ativar oferta de parceiro de outra região).
    parceiro_cidade?:string|null;
    parceiro_uf?:string|null;
    // endereço/contato do parceiro — mostrados pro cliente no app junto da oferta,
    // pra ele já saber onde/como usar o cupom.
    parceiro_endereco?:string|null;
    parceiro_contato?:string|null;
}
