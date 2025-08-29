// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

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
// Usaremos armazenamento em memória para processar o upload
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
  foto: String, // Agora vai armazenar a URL do Cloudinary
});
const Member = mongoose.model('Member', memberSchema);

// --- ROTAS DA API ---

// NOVA ROTA PARA UPLOAD DE IMAGEM
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
  }

  // Envia o buffer da imagem para o Cloudinary
  cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
    if (error) {
      console.error('Erro no upload para o Cloudinary:', error);
      return res.status(500).json({ message: 'Erro ao fazer upload da imagem.' });
    }
    res.status(200).json({ secure_url: result.secure_url });
  }).end(req.file.buffer);
});


// Rotas existentes (sem alteração na lógica, apenas no que o campo 'foto' representa)
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
