const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const chatbot = require('../services/chatbot');

const router = express.Router();

router.post('/', optionalAuth, (req, res) => {
  const message = String(req.body.message || '').slice(0, 500);
  if (!message.trim()) return res.status(400).json({ error: 'Message is empty.' });
  res.json(chatbot.reply({ message, context: req.body.context || {}, user: req.user }));
});

module.exports = router;
