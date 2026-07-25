import multer from "multer";

export const uploadMiddleware = multer({

    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 // 1 MB
    },
    fileFilter(req, file, cb) {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Somente imagens são permitidas."));
        }

        cb(null, true);
    }
}).fields([
    { name: "logo", maxCount: 1 },
    { name: "favicon", maxCount: 1 },
    { name: "icon192", maxCount: 1 },
    { name: "icon512", maxCount: 1 },
    { name: "maskable", maxCount: 1 }
]);