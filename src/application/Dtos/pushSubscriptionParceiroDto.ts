export type pushSubscriptionParceiroDto = {
    parceiroId:number;
    device:string;
    endpoint: string;
    expirationTime: number | null;
    keys: {
        p256dh: string;
        auth: string;
    }
}
