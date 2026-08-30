export type pushSubscriptionPainelDto = {
    codigoProvedor:string;
    device:string;
    endpoint: string;
    expirationTime: number | null;
    keys: {
        p256dh: string;
        auth: string;
    }
}
