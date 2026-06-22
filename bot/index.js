import { Client, GatewayIntentBits, Events } from 'discord.js';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
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

// Download helper
async function downloadFile(url, destPath) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Unexpected response ${response.statusText}`);
        
        // Use stream pipeline for better memory management with large files (PDFs, videos)
        await pipeline(response.body, createWriteStream(destPath));
        return true;
    } catch (error) {
        console.error(`Erro ao baixar arquivo de ${url}:`, error);
        return false;
    }
}

// Check if file is image for markdown syntax
function isImage(filename) {
    const ext = path.extname(filename).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
}

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
        const validFolders = ['00_Inbox', '10_Projetos', '20_Areas', '30_Recursos'];
        return validFolders.includes(answer) ? answer : '00_Inbox';
    } catch (error) {
        console.error("Erro na IA:", error);
        return '00_Inbox';
    }
}

// Format single message
function formatSingleNote(content, authorName) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
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
    
    const safeTitle = title.replace(/\s+/g, '-').toLowerCase();
    const timestamp = today.getTime();
    const filename = `${safeTitle}-${timestamp}.md`;

    return { yaml, filename };
}

// Generate history synthesis
async function synthesizeHistory(messages) {
    try {
        let historyRaw = "";
        
        for (const msg of messages.reverse().values()) {
            if (msg.author.bot) continue;

            let contentWithLocalFiles = msg.content;
            
            // Download attachments for history and add Obsidian links
            if (msg.attachments.size > 0) {
                for (const attachment of msg.attachments.values()) {
                    const safeFilename = `${Date.now()}-${attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    const targetFolder = '00_Inbox'; // Synthesis always goes to 00_Inbox
                    const destPath = path.join(VAULT_PATH, targetFolder, safeFilename);
                    
                    const downloaded = await downloadFile(attachment.url, destPath);
                    if (downloaded) {
                        const obsidianLink = isImage(safeFilename) ? `![[${safeFilename}]]` : `[[${safeFilename}]]`;
                        contentWithLocalFiles += `\n${obsidianLink}`;
                    }
                }
            }

            historyRaw += `[${msg.author.username}]: ${contentWithLocalFiles}\n---\n`;
        }

        const prompt = `
        Atue como um arquivista e organizador especialista.
        Abaixo está o histórico bruto das últimas 100 mensagens de um canal do Discord.
        Muitas mensagens possuem links nativos do Obsidian como ![[imagem.png]] ou [[documento.pdf]].
        
        Sua tarefa:
        1. Limpe o histórico, transformando-o em um documento coeso e fluido.
        2. Corrija erros óbvios de digitação e gramática.
        3. Organize a informação por tópicos abordados.
        4. PRESERVE TODOS OS LINKS DO OBSIDIAN EXATAMENTE COMO ESTÃO (![[...]] e [[...]]). Não mude o formato deles.
        5. Não invente nenhuma informação nova, apenas reestruture o que foi dito.
        6. Crie um breve resumo executivo no início.
        
        Retorne APENAS o conteúdo em Markdown pronto para ser salvo.
        
        HISTÓRICO BRUTO:
        ${historyRaw}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        
        const yaml = `---
aliases: [sintese-canal]
tags: [#discord-sintese, #antigravity-brain]
criado_em: ${dateStr}
---
# Síntese do Canal
*Gerado por Inteligência Artificial a partir das últimas 100 mensagens.*

${response.text}
`;
        
        const filename = `Sintese-Discord-${today.getTime()}.md`;
        return { yaml, filename };

    } catch (error) {
        console.error("Erro na síntese da IA:", error);
        throw error;
    }
}

client.once(Events.ClientReady, readyClient => {
    console.log(`Ponte pronta! Logado como ${readyClient.user.tag}`);
    console.log(`Vault alvo: ${VAULT_PATH}`);
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    // ======== MODO ARQUIVISTA (SÍNTESE DE HISTÓRICO) ========
    if (message.mentions.has(client.user.id)) {
        try {
            console.log("Iniciando Modo Arquivista...");
            await message.react('⏳');

            const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
            console.log(`Analisando ${fetchedMessages.size} mensagens e baixando anexos...`);
            
            const { yaml, filename } = await synthesizeHistory(fetchedMessages);
            
            const fullPath = path.join(VAULT_PATH, '00_Inbox', filename);
            await fs.writeFile(fullPath, yaml, 'utf8');
            
            console.log(`✅ Síntese salva em: ${fullPath}`);
            await message.react('🧠');
            await message.reply("✅ Histórico analisado e anexos salvos na sua `00_Inbox`!");

        } catch (error) {
            console.error("Erro no Modo Arquivista:", error);
            await message.react('❌');
            await message.reply("Houve um erro ao processar o histórico.");
        }
        return;
    }

    // ======== MODO SILENCIOSO (MENSAGEM ÚNICA COM ANEXOS) ========
    console.log(`\nRecebido: "${message.content.substring(0, 50)}..."`);
    console.log("Pensando na melhor pasta...");
    
    const folder = await decideFolder(message.content);
    console.log(`Decisão: ${folder}`);

    let finalContent = message.content;

    // Baixar anexos e gerar links nativos
    if (message.attachments.size > 0) {
        console.log(`Baixando ${message.attachments.size} anexos para a pasta ${folder}...`);
        for (const attachment of message.attachments.values()) {
            const safeFilename = `${Date.now()}-${attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const destPath = path.join(VAULT_PATH, folder, safeFilename);
            
            const downloaded = await downloadFile(attachment.url, destPath);
            if (downloaded) {
                const obsidianLink = isImage(safeFilename) ? `![[${safeFilename}]]` : `[[${safeFilename}]]`;
                finalContent += `\n${obsidianLink}`;
            }
        }
    }

    const { yaml, filename } = formatSingleNote(finalContent, message.author.username);

    try {
        const fullPath = path.join(VAULT_PATH, folder, filename);
        await fs.writeFile(fullPath, yaml, 'utf8');
        console.log(`✅ Salvo com sucesso em: ${fullPath}`);
        await message.react('🧠');
    } catch (error) {
        console.error("Erro ao salvar arquivo:", error);
        await message.react('❌');
    }
});

client.login(DISCORD_TOKEN);
