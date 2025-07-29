import express from 'express';
import multer from 'multer';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket, addCommentToTicket,
  resolveTicket
} from '../../controllers/tickets.controller.js';



const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Routes
router.post('/', upload.single('file'), createTicket);
router.get('/', getAllTickets);
router.get('/:id', getTicketById);
router.put('/:id', updateTicket);
router.delete('/:id', deleteTicket);
router.post("/:id/comment", addCommentToTicket);
router.patch("/:id/resolve", resolveTicket);


export default router;
