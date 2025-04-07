
const { default: makeWASocket, useSingleFileAuthState, MessageType } = require('@whiskeysockets/baileys');
const fs = require('fs');
const { Boom } = require('@hapi/boom');
const P = require('pino');

const { state, saveState } = useSingleFileAuthState('./auth.json');

const startBot = async () => {
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];

    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    
    if (text.toLowerCase() === '.stiker' && msg.message.imageMessage) {
      const buffer = await sock.downloadMediaMessage(msg);
      await sock.sendMessage(from, { sticker: buffer }, { quoted: msg });
    }
  });
};

startBot();
