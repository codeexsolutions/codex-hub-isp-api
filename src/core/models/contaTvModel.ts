export type contaTvModel = {
    id: number;
    nome: string;
    email: string;
    senha_hash?: string;
    iptv_usuario: string | null;
    iptv_senha: string | null;
    iptv_dns: string | null;
    iptv_pacote: string | null;
    iptv_vencimento: string | null;
    link_pagamento: string | null;
    status_pagamento: "pendente" | "pago" | "expirado";
    notificado: boolean;
    criado_em: string;
}
