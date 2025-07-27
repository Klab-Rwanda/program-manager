import multer from "multer";
import fs from "fs";

// --- THIS IS THE FIX ---
// Use a persistent 'uploads' directory instead of 'temp'
const uploadDir = './public/uploads';
// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir) // Use the new persistent directory
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const extension = file.originalname.split('.').pop();
      cb(null, `${file.fieldname}-${uniqueSuffix}.${extension}`)
    }
})

export const upload = multer({ storage });