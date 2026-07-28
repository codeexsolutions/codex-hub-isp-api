export type pushSubscriptionDto = {
    cpf:string;
    codigoProvedor:string;
    device:string;
    endpoint: string;
    expirationTime: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export type notificacaoDto = {
    titulo:string;
    mensagem:string;
    destino:string
}