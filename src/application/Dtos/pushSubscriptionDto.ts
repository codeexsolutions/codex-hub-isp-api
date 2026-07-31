export type pushSubscriptionDto = {
    cpf:string;
    codigoProvedor:string;
    device:string;
    endpoint: string;
    expirationTime: number | null;
    keys: {
        p256dh: string;
        auth: string;
    }
}

export type notificacaoDto = {
    title:string;
    body:string;
    icon:string;
    image?:string;
    badge?:string;
    data?:data;
    action?:action;    
}

export type data = {
    url:string
}

export type action = {
    action:string;
    title:string
}