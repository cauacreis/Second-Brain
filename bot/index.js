import { Client, GatewayIntentBits, Events, ChannelType } from 'discord.js';
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

// Generate history transcription
async function transcribeHistory(messages, targetFolderStr) {
    try {
        let historyRaw = "";
        
        for (const msg of messages.reverse().values()) {
            if (msg.author.bot) continue;

            let contentWithLocalFiles = msg.content;
            
            // Download attachments
            if (msg.attachments.size > 0) {
                for (const attachment of msg.attachments.values()) {
                    const safeFilename = `${Date.now()}-${attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    const destPath = path.join(VAULT_PATH, targetFolderStr, safeFilename);
                    
                    const downloaded = await downloadFile(attachment.url, destPath);
                    if (downloaded) {
                        const obsidianLink = isImage(safeFilename) ? `![[${safeFilename}]]` : `[[${safeFilename}]]`;
                        contentWithLocalFiles += `\n${obsidianLink}`;
                    }
                }
            }

            historyRaw += `[${msg.author.username}]: ${contentWithLocalFiles}\n---\n`;
        }

        if (historyRaw.trim() === "") {
            return null; // Empty channel
        }

        const prompt = `
        Abaixo está o histórico das mensagens de um canal do Discord.
        Muitas mensagens possuem links nativos do Obsidian como ![[imagem.png]] ou [[documento.pdf]].
        
        Sua tarefa:
        1. COPIE TODO o histórico de mensagens EXATAMENTE como foi escrito. Não resuma nem condense.
        2. Corrija apenas erros óbvios de digitação, ortografia e gramática que encontrar pelo caminho.
        3. PRESERVE TODOS OS LINKS DO OBSIDIAN EXATAMENTE COMO ESTÃO (![[...]] e [[...]]). Não mude o formato deles.
        4. Preserve o nome dos autores e a estrutura de chat ([Autor]: Mensagem).
        
        Retorne APENAS o conteúdo corrigido em Markdown pronto para ser salvo.
        
        HISTÓRICO BRUTO:
        ${historyRaw}
        `;

        let responseText = "";
        let isFallback = false;
        
        let retries = 3;
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        while(retries > 0) {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                responseText = response.text;
                break;
            } catch(err) {
                retries--;
                if(retries === 0) {
                    console.error("Falha total na IA. Usando modo de emergência (cópia bruta).");
                    isFallback = true;
                    responseText = historyRaw;
                    break;
                }
                console.log(`Erro na IA. Retentativas restantes: ${retries}. Aguardando 20s...`);
                await sleep(20000);
            }
        }

        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        
        const subtitle = isFallback 
            ? "*⚠️ Cópia bruta de emergência. A Inteligência Artificial estava indisponível no momento do backup.*"
            : "*Cópia do histórico corrigida ortograficamente pela IA.*";

        const yaml = `---
aliases: [transcricao-canal]
tags: [#discord-transcricao, #antigravity-brain]
criado_em: ${dateStr}
---
# Transcrição do Canal
${subtitle}

${responseText}
\`;
        
        const filename = \`Transcricao-\${today.getTime()}.md\`;
        return { yaml, filename, isFallback };

    } catch (error) {
        console.error("Erro na transcrição da IA:", error);
        throw error;
    }
}

client.once(Events.ClientReady, readyClient => {
    console.log(`Ponte pronta! Logado como ${readyClient.user.tag}`);
    console.log(`Vault alvo: ${VAULT_PATH}`);
});

client.on(Events.MessageCreate, async message => {
    // IGNORA QUALQUER MENSAGEM SE NÃO FOR UMA MENÇÃO AO BOT OU FOR DE OUTRO BOT
    if (message.author.bot || !message.mentions.has(client.user.id)) return;

    const contentLower = message.content.toLowerCase();

    // =========================================================
    // COMANDO 1: SALVAR MENSAGEM ESPECÍFICA (VIA RESPONDER)
    // =========================================================
    if (message.reference && message.reference.messageId) {
        try {
            await message.react('🔍');
            console.log("Comando: Salvar mensagem específica");
            
            // Puxa a mensagem original que foi respondida
            const targetMessage = await message.channel.messages.fetch(message.reference.messageId);
            
            if (targetMessage.author.bot) {
                await message.reply("Não posso salvar mensagens de outros bots.");
                return;
            }

            const folder = await decideFolder(targetMessage.content);
            let finalContent = targetMessage.content;

            if (targetMessage.attachments.size > 0) {
                for (const attachment of targetMessage.attachments.values()) {
                    const safeFilename = `${Date.now()}-${attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
                    const destPath = path.join(VAULT_PATH, folder, safeFilename);
                    
                    const downloaded = await downloadFile(attachment.url, destPath);
                    if (downloaded) {
                        const obsidianLink = isImage(safeFilename) ? `![[${safeFilename}]]` : `[[${safeFilename}]]`;
                        finalContent += `\n${obsidianLink}`;
                    }
                }
            }

            const { yaml, filename } = formatSingleNote(finalContent, targetMessage.author.username);
            const fullPath = path.join(VAULT_PATH, folder, filename);
            await fs.writeFile(fullPath, yaml, 'utf8');
            
            await message.react('🧠');
            await message.reply(`✅ Mensagem salva com sucesso em \`${folder}\`!`);
        } catch (error) {
            console.error("Erro no Comando 1:", error);
            await message.react('❌');
        }
        return;
    }

    // =========================================================
    // COMANDO 2: EXPORTAR CATEGORIA INTEIRA
    // =========================================================
    if (contentLower.includes('categoria')) {
        try {
            const category = message.channel.parent;
            if (!category) {
                await message.reply("Este canal não pertence a nenhuma categoria!");
                return;
            }

            await message.react('⏳');
            await message.reply(`Iniciando backup em lote da categoria **${category.name}**. Isso pode demorar...`);
            console.log(`Comando: Exportar Categoria ${category.name}`);

            const safeCatName = category.name.replace(/[^a-zA-Z0-9 -]/g, '').trim();
            const categoryFolder = path.join(VAULT_PATH, '00_Inbox', safeCatName);
            
            // Create the folder for the category
            await fs.mkdir(categoryFolder, { recursive: true });

            const channels = category.children.cache.filter(c => c.type === ChannelType.GuildText);
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
            for (const [channelId, channel] of channels) {
                console.log(`Lendo canal: ${channel.name}`);
                const fetchedMessages = await channel.messages.fetch({ limit: 100 });
                
                try {
                    // Pass relative path so attachments go to the same folder
                    const relativePath = path.join('00_Inbox', safeCatName);
                    const result = await transcribeHistory(fetchedMessages, relativePath);
                    
                    if (result) {
                        // Override filename to be the channel name
                        const customFilename = `${channel.name.replace(/[^a-zA-Z0-9 -]/g, '')}.md`;
                        const fullPath = path.join(categoryFolder, customFilename);
                        await fs.writeFile(fullPath, result.yaml, 'utf8');
                        console.log(`Salvo: ${fullPath}`);
                        
                        if (result.isFallback) {
                            await message.channel.send(`⚠️ A IA falhou no canal **${channel.name}**. Salvei a cópia bruta de emergência sem correção ortográfica.`);
                        }
                    }
                } catch(channelErr) {
                    console.error(`Falha fatal e inesperada no canal ${channel.name}:`, channelErr);
                    await message.channel.send(`⚠️ Pulei o canal **${channel.name}** devido a um erro inesperado. Continuando com os próximos...`);
                }

                console.log("Pausando 35 segundos para evitar bloqueio (limite de requisições) da API do Gemini...");
                await sleep(35000);
            }

            await message.react('🧠');
            await message.reply(`✅ Categoria inteira salva com sucesso em \`00_Inbox/${safeCatName}\`!`);
        } catch (error) {
            console.error("Erro no Comando 2:", error);
            await message.react('❌');
            await message.reply("Houve um erro ao processar a categoria.");
        }
        return;
    }

    // =========================================================
    // COMANDO 3: TRANSCRIÇÃO DE CANAL (PADRÃO)
    // =========================================================
    try {
        console.log("Comando: Transcrição do Canal atual");
        await message.react('⏳');

        const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
        const result = await transcribeHistory(fetchedMessages, '00_Inbox');
        
        if (result) {
            const fullPath = path.join(VAULT_PATH, '00_Inbox', result.filename);
            await fs.writeFile(fullPath, result.yaml, 'utf8');
            await message.react('🧠');
            await message.reply("✅ Histórico deste canal copiado para a sua `00_Inbox`!");
        } else {
            await message.reply("Não encontrei mensagens úteis neste canal.");
        }
    } catch (error) {
        console.error("Erro no Comando 3:", error);
        await message.react('❌');
    }
});

client.login(DISCORD_TOKEN);
