import express from 'express';
const app = express();
app.get('/test', (req, res) => {
  const p = req.query.path as string;
  try {
    require('path').resolve('/app', p);
    res.send('ok');
  } catch (e) {
    res.status(500).send(e.message);
  }
});
app.listen(3001, () => {
  console.log('Listening');
});
