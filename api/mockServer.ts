
import { mockDb } from './mockDb';

// This acts as the 'E' and 'N' in MERN (Express and Node.js)
// It provides a 'fetch-like' interface for the frontend.
export const api = {
  // GET /api/stats
  getStats: async () => {
    await new Promise(r => setTimeout(r, 600)); // Mimic network latency
    const history = await mockDb.collection('scores').find();
    const highScore = await mockDb.collection('system').getHighScore();
    return {
      success: true,
      data: {
        history: history.slice(-5).reverse(),
        highScore
      }
    };
  },

  // POST /api/scores
  saveScore: async (score: number, dodged: number) => {
    await new Promise(r => setTimeout(r, 800)); // Mimic network latency
    const newDoc = await mockDb.collection('scores').insertOne({ score, dodged });
    const isNewHigh = await mockDb.collection('system').updateHighScore(score);
    return {
      success: true,
      message: "Score saved to database",
      data: { ...newDoc, isNewHigh }
    };
  }
};
