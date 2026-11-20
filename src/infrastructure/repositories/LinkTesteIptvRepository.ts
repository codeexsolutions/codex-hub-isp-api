import { inject, injectable } from "tsyringe";
import ILinkTesteIptvRepository from "../../core/interfaces/ILinkTesteIptvRepository";
import IDBContext from "../interfaces/IDbContext";
import { linkTesteIptvModel } from "../../core/models/linkTesteIptvModel";

@injectable()
export default class LinkTesteIptvRepository implements ILinkTesteIptvRepository {

    private readonly _db: IDBContext;

    constructor(@inject("IDBContext") db: IDBContext) {
        this._db = db;
    }

    async Listar(): Promise<linkTesteIptvModel[]> {
        const select = `SELECT * FROM links_teste_iptv ORDER BY padrao DESC, criado_em DESC;`;
        return await this._db.Execulte<linkTesteIptvModel>(select, []);
    }

    async ObterPadrao(): Promise<linkTesteIptvModel | null> {
        const select = `SELECT * FROM links_teste_iptv WHERE padrao = true LIMIT 1;`;
        const result = await this._db.Execulte<linkTesteIptvModel>(select, []);
        return result[0] ?? null;
    }

    async Criar(rotulo: string, url: string): Promise<linkTesteIptvModel> {
        const insert = `INSERT INTO links_teste_iptv (rotulo, url) VALUES ($1, $2) RETURNING *;`;
        const result = await this._db.Execulte<linkTesteIptvModel>(insert, [rotulo, url]);
        return result[0];
    }

    // Só um pode ser padrão — desmarca todos antes de marcar o escolhido
    // (o índice único parcial em `padrao` garante isso mesmo se essas duas
    // instruções não rodarem como transação).
    async DefinirPadrao(id: number): Promise<linkTesteIptvModel> {
        await this._db.Execulte(`UPDATE links_teste_iptv SET padrao = false WHERE padrao = true;`, []);
        const update = `UPDATE links_teste_iptv SET padrao = true WHERE id = $1 RETURNING *;`;
        const result = await this._db.Execulte<linkTesteIptvModel>(update, [id]);
        return result[0];
    }
}
