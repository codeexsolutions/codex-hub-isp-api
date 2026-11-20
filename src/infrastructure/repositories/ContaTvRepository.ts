import { inject, injectable } from "tsyringe";
import IContaTvRepository, { DadosIptvTeste } from "../../core/interfaces/IContaTvRepository";
import IDBContext from "../interfaces/IDbContext";
import { contaTvModel } from "../../core/models/contaTvModel";

@injectable()
export default class ContaTvRepository implements IContaTvRepository {

    private readonly _db: IDBContext;

    constructor(@inject("IDBContext") db: IDBContext) {
        this._db = db;
    }

    async ObterPorEmail(email: string): Promise<contaTvModel | null> {
        const select = `SELECT * FROM contas_tv WHERE email = $1;`;
        const result = await this._db.Execulte<contaTvModel>(select, [email]);
        return result[0] ?? null;
    }

    async ObterPorId(id: number): Promise<contaTvModel | null> {
        const select = `SELECT * FROM contas_tv WHERE id = $1;`;
        const result = await this._db.Execulte<contaTvModel>(select, [id]);
        return result[0] ?? null;
    }

    async Criar(nome: string, email: string, senhaHash: string, iptv: DadosIptvTeste): Promise<contaTvModel> {
        const insert = `INSERT INTO contas_tv
            (nome, email, senha_hash, iptv_usuario, iptv_senha, iptv_dns, iptv_pacote, iptv_vencimento, link_pagamento)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *;`;
        const result = await this._db.Execulte<contaTvModel>(insert, [
            nome, email, senhaHash,
            iptv.usuario, iptv.senha, iptv.dns, iptv.pacote, iptv.vencimento, iptv.linkPagamento,
        ]);
        return result[0];
    }

    async Listar(): Promise<contaTvModel[]> {
        const select = `SELECT * FROM contas_tv ORDER BY criado_em DESC;`;
        return await this._db.Execulte<contaTvModel>(select, []);
    }

    async DefinirStatusPagamento(id: number, status: string): Promise<contaTvModel> {
        const update = `UPDATE contas_tv SET status_pagamento = $1 WHERE id = $2 RETURNING *;`;
        const result = await this._db.Execulte<contaTvModel>(update, [status, id]);
        return result[0];
    }

    async DefinirIptv(id: number, usuario: string, senha: string, dns: string, vencimento: Date | null): Promise<contaTvModel> {
        const update = `UPDATE contas_tv SET iptv_usuario = $1, iptv_senha = $2, iptv_dns = $3, iptv_vencimento = $4 WHERE id = $5 RETURNING *;`;
        const result = await this._db.Execulte<contaTvModel>(update, [usuario, senha, dns, vencimento, id]);
        return result[0];
    }

    async ContarNaoNotificadas(): Promise<number> {
        const select = `SELECT COUNT(*)::int AS total FROM contas_tv WHERE notificado = false;`;
        const result = await this._db.Execulte<{ total: number }>(select, []);
        return result[0]?.total ?? 0;
    }

    async MarcarNotificada(id: number): Promise<void> {
        await this._db.Execulte(`UPDATE contas_tv SET notificado = true WHERE id = $1;`, [id]);
    }
}
