import { ETipoArquivo } from "../../infrastructure/supabase/ETipoArquivo";

export type uploadoDto = {
    codigoProvedor:string;
    file: Buffer;
    nomeArquivo: string;
    tipo:ETipoArquivo;
}