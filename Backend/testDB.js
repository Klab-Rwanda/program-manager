import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ticket from './src/api/models/ticket.model.js';
import {User} from './src/api/models/user.model.js';  // Import the User model

dotenv.config();

async function testFetch() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Ensure the User model is registered before populating
    mongoose.model('User', User.schema);

    const tickets = await Ticket.find()
      .limit(5)
      .populate('createdBy', 'name email role');

    console.log("Tickets found:", tickets);

    process.exit(0);
  } catch (err) {
    console.error("Error fetching tickets:", err);
    process.exit(1);
  }
}

testFetch();
