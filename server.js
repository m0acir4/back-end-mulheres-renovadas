// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fetch = require('node-fetch'); // Precisamos importar o fetch para o ping

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO DO CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- CONFIGURAÇÃO DO MULTER ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- CONEXÃO COM O MONGODB ---
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB conectado com sucesso!'))
  .catch(err => console.error('Erro ao conectar no MongoDB:', err));

// --- MODELO DOS DADOS (Schema) ---
const memberSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  dataNascimento: { type: String, required: true },
  endereco: String,
  telefone: String,
  cargo: { type: String, required: true },
  foto: String,
});
const Member = mongoose.model('Member', memberSchema);

// --- ROTAS DA API ---

// ROTA PARA O AUTO-PING
app.get('/ping', (req, res) => {
  res.status(200).send('Ping recebido com sucesso!');
});

// ROTA PARA UPLOAD DE IMAGEM
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
  }
  cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
    if (error) {
      console.error('Erro no upload para o Cloudinary:', error);
      return res.status(500).json({ message: 'Erro ao fazer upload da imagem.' });
    }
    res.status(200).json({ secure_url: result.secure_url });
  }).end(req.file.buffer);
});

// Rotas de membros
app.get('/members', async (req, res) => {
  try {
    const members = await Member.find().sort({ nome: 1 });
    res.json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/members', async (req, res) => {
  const member = new Member({ ...req.body });
  try {
    const newMember = await member.save();
    res.status(201).json(newMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.put('/members/:id', async (req, res) => {
  try {
    const updatedMember = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedMember) {
        return res.status(404).json({ message: 'Membro não encontrado' });
    }
    res.json(updatedMember);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/members/:id', async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) {
        return res.status(404).json({ message: 'Membro não encontrado' });
    }
    res.json({ message: 'Membro deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// --- LÓGICA DO AUTO-PING ---
const PING_URL = "https://back-end-mulheres-renovadas.onrender.com/ping";
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutos

setInterval(() => {
  fetch(PING_URL)
    .then(res => console.log(`Ping enviado, status: ${res.status}`))
    .catch(err => console.error("Erro ao enviar ping:", err));
}, PING_INTERVAL);