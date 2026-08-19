import { Request } from "express";

export interface AuthRequest extends Request {
    usuario?: {
        id: string;
        codigoProvedor: string;
        role?: string;
        parceiroId?: string;
    };
}
