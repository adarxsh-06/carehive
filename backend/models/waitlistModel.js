
import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema({
  docId: {
    type: String,
    required: true
  },
  slotDate: {
    type: String,
    required: true
  },
  users: [
    {
      userId: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

const waitlistModel = mongoose.models.waitlist || mongoose.model("waitlist", waitlistSchema);
export default waitlistModel;
