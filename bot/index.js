import { Client, GatewayIntentBits, Events } from 'discord.js';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH;

if (!DISCORD_TOKEN || !GEMINI_API_KEY || !VAULT_PATH) {
    console.error("ERRO: Faltam variáveis de ambiente. Verifique seu arquivo .env");
    process.exit(1);
}

// Initialize AI and Discord
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Helper to determine the folder
async function decideFolder(messageContent) {
    try {
        const prompt = `
        Analise a seguinte mensagem e decida em qual destas pastas do método PARA ela se encaixa melhor:
        - 00_Inbox (Para ideias rápidas, memórias, pensamentos soltos ou se não tiver certeza)
        - 10_Projetos (Para algo que parece parte de um projeto ativo com começo, meio e fim)
        - 20_Areas (Para anotações de estudo, programação, áreas de interesse contínuo)
        - 30_Recursos (Para links, tutoriais, referências, ferramentas úteis)

        Responda APENAS com o nome exato da pasta escolhida.
        
        Mensagem: "${messageContent}"
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const answer = response.text.trim();
        
        // Validation
        const validFolders = ['00_Inbox', '10_Projetos', '20_Areas', '30_Recursos'];
        if (validFolders.includes(answer)) {
            return answer;
        }
        return '00_Inbox'; // Fallback
    } catch (error) {
        console.error("Erro na IA:", error);
        return '00_Inbox'; // Fallback
    }
}

// Format the Markdown content
function formatNote(content, authorName) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Extract a short title from the first line
    const titleRaw = content.split('\n')[0].replace(/[^\w\s-]/gi, '').trim();
    const title = titleRaw.split(' ').slice(0, 5).join(' ') || 'Nota-do-Discord';

    const yaml = `---
aliases: []
tags: [#discord-sync, #antigravity-brain]
criado_em: ${dateStr}
---
# ${title}

${content}

---
*Enviado por ${authorName} via Discord*
`;
    
    // Generate safe filename
    const safeTitle = title.replace(/\s+/g, '-').toLowerCase();
    const timestamp = today.getTime();
    const filename = `${safeTitle}-${timestamp}.md`;

    return { yaml, filename };
}

client.once(Events.ClientReady, readyClient => {
    console.log(`Ponte pronta! Logado como ${readyClient.user.tag}`);
    console.log(`Vault alvo: ${VAULT_PATH}`);
});

client.on(Events.MessageCreate, async message => {
    // Ignore bots
    if (message.author.bot) return;

    console.log(`\nRecebido: "${message.content.substring(0, 50)}..."`);

    // 1. Decide where it goes
    console.log("Pensando na melhor pasta...");
    const folder = await decideFolder(message.content);
    console.log(`Decisão: ${folder}`);

    // 2. Format the content
    const { yaml, filename } = formatNote(message.content, message.author.username);

    // 3. Save to Obsidian Vault
    try {
        const fullPath = path.join(VAULT_PATH, folder, filename);
        await fs.writeFile(fullPath, yaml, 'utf8');
        console.log(`✅ Salvo com sucesso em: ${fullPath}`);
        
        // Optional: React to the message to show success
        await message.react('🧠');
    } catch (error) {
        console.error("Erro ao salvar arquivo:", error);
        await message.react('❌');
    }
});

client.login(DISCORD_TOKEN);
