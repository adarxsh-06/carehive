
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
      userId: {  type: mongoose.Schema.Types.ObjectId,  ref: 'user'},
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

waitlistSchema.index({ docId: 1, slotDate: 1 }, { unique: true });

const waitlistModel = mongoose.models.waitlist || mongoose.model("waitlist", waitlistSchema);
export default waitlistModel;
