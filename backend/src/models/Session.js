import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    unitId: { type: String, default: null },
    line: { type: String, default: null },
    status: { type: String, enum: ["active", "finished"], default: "active" },
    startedAt: { type: Date }, // 🔥
    endedAt: { type: Date },   // 🔥
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
