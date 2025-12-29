
// This acts as the 'M' in MERN (MongoDB)
export const mockDb = {
  collection: (name: string) => {
    const key = `mern_db_${name}`;
    return {
      find: async () => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
      },
      insertOne: async (doc: any) => {
        const data = localStorage.getItem(key);
        const list = data ? JSON.parse(data) : [];
        const newDoc = { ...doc, _id: Date.now().toString(), createdAt: new Date() };
        list.push(newDoc);
        localStorage.setItem(key, JSON.stringify(list));
        return newDoc;
      },
      updateHighScore: async (score: number) => {
        const current = Number(localStorage.getItem('mern_high_score')) || 0;
        if (score > current) {
          localStorage.setItem('mern_high_score', score.toString());
          return true;
        }
        return false;
      },
      getHighScore: async () => {
        return Number(localStorage.getItem('mern_high_score')) || 0;
      }
    };
  }
};
