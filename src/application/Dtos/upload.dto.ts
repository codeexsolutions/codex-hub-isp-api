import { ETipoArquivo } from "../../infrastructure/supabase/ETipoArquivo";

export type uploadoDto = {
    codigoProvedor:string;
    file?: Buffer | undefined;
    nomeArquivo: string;
    tipo:ETipoArquivo;
}