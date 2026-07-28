import { inject, injectable } from "tsyringe";
import IPushNotificationRepository from "../../core/interfaces/IPushNotificationRepository";
import IDBContext from "../interfaces/IDbContext";
import PushSubscription from "../../core/domains/PushSubscription";

@injectable()
export default class PushNotificationRepository implements IPushNotificationRepository {

    private _db:IDBContext;

    constructor(@inject("IDBContext") db:IDBContext){
        this._db = db;
    }

    async Salvar(subscription: PushSubscription): Promise<string> {
        
        try{
            const result = await this._db.Execulte<string>(`INSERT INTO push_subscription (cpf, codigo_provedor, endpoint, auth, p256dh, device_name) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
                [subscription.Cpf, subscription.CodigoProvedor, subscription.Endpoint, subscription.Auth, subscription.P256dh, subscription.Device]
            )

            if(result.length > 0)
                return result[0];
            
            return "Não foi possivel salvar";

        }catch(error:any){
            throw new Error("Erro ao salvar subscription -> " + error.message)
        }


    }

    async BuscarPorCpf(cpf: string, codigoProvedor:string) : Promise<PushSubscription[]> {
        
        const result = await this._db.Execulte<any>("SELECT * FROM push_subscription WHERE cpf = $1 AND codigo_provedor = $2", [cpf, codigoProvedor])
        if(result.length < 1)
            return [];

        return result.map((sub: any) : PushSubscription => {
            const subscription = new PushSubscription()
            subscription.Cpf = sub.cpf,
            subscription.CodigoProvedor = sub.codigo_provedor,
            subscription.Device = sub.device_name,
            subscription.Endpoint = sub.endpoint,
            subscription.Auth = sub.auth,
            subscription.P256dh = sub.p256dh
            return subscription;
        })
    }

     async BuscarTodos(codigoProvedor:string) : Promise<PushSubscription[]> {
        
        const result = await this._db.Execulte<any>("SELECT * FROM push_subscription WHERE codigo_provedor = $1", [codigoProvedor])
        if(result.length < 1)
            return [];

        return result.map((sub: any) : PushSubscription => {
            const subscription = new PushSubscription()
            subscription.Cpf = sub.cpf,
            subscription.CodigoProvedor = sub.codigo_provedor,
            subscription.Device = sub.device_name,
            subscription.Endpoint = sub.endpoint,
            subscription.Auth = sub.auth,
            subscription.P256dh = sub.p256dh
            return subscription;
        })
    }
    
    Remover(endpoint: string): Promise<void> {
        throw new Error("Method not implemented.");
    }

}