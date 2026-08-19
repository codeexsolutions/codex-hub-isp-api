// 8 caracteres alfanuméricos maiúsculos, sem caracteres ambíguos (0/O, 1/I).
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function gerarCupom(): string {
    let codigo = "";
    for (let i = 0; i < 8; i++) {
        codigo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
    }
    return codigo;
}
