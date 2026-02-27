# Guia de Configuração no cPanel

Para que o seu projeto funcione corretamente no cPanel, não basta apenas enviar a pasta `dist`. É necessário configurar o **Node.js Application Manager**.

## Passo 1: Preparação
1. Certifique-se de que enviou todos os arquivos do projeto (incluindo `server.ts`, `package.json` e a pasta `src`) para o cPanel.
2. A pasta `dist` (gerada pelo `npm run build`) também deve estar presente.

## Passo 2: Configurar o Node.js no cPanel
1. Procure por **"Setup Node.js App"** no seu painel cPanel.
2. Clique em **"Create Application"**.
3. **Node.js version**: Escolha a versão mais recente disponível (ex: 20.x ou 22.x).
4. **Application mode**: Mude para `Production`.
5. **Application root**: Onde os arquivos do projeto estão (ex: `public_html/downloader`).
6. **Application URL**: A URL onde o app ficará visível.
7. **Application startup file**: Defina como `server.ts`. 
   - *Nota: O servidor agora usa `tsx` para rodar diretamente o `.ts`. Se o seu cPanel não suportar `server.ts` diretamente, você pode precisar renomear para `server.js` ou usar um arquivo `index.js` que chame o servidor.*

## Passo 3: Instalar Dependências
1. Após criar a aplicação, você verá um botão **"Run npm install"**. Clique nele.
2. Se houver um terminal disponível, você pode rodar manualmente:
   ```bash
   npm install
   ```

## Passo 4: Variáveis de Ambiente
O servidor agora detecta automaticamente se está no cPanel (Linux) e baixa o FFmpeg necessário. Certifique-se de que a pasta do projeto tem permissões de escrita para que ele possa baixar os binários (`yt-dlp` e `ffmpeg`).

## Por que não funcionava antes?
- **O projeto é Fullstack**: O frontend (`dist`) tenta se comunicar com uma API (`/api/...`). Se você não iniciar o servidor Node.js, a API não existe.
- **FFmpeg no Linux**: O cPanel usa Linux. Eu adicionei um script no `server.ts` que baixa automaticamente a versão correta do FFmpeg para Linux na primeira vez que o app rodar.
- **Portas**: O cPanel redireciona o tráfego para portas específicas. O código agora usa `process.env.PORT` para se adaptar automaticamente.
