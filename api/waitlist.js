export default async function handler(req, res) {
    if (req.method === 'POST') {
      const { email } = req.body;
      
      // Pour la beta, on stocke dans un fichier JSON
      // En production, utilisez une vraie DB
      console.log('New signup:', email);
      
      res.status(200).json({ 
        success: true, 
        message: 'Added to waitlist',
        position: Math.floor(Math.random() * 100) + 1
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  }