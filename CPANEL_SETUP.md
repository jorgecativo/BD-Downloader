# Guia de Configuração no cPanel (V3.8.1)

Para que o seu projeto funcione no cPanel, siga estes passos exatos baseados na sua configuração atual:

## Passo 1: Preparação
1. Envie todos os ficheiros atualizados para o cPanel (incluindo o novo `server.js` que eu criei).
2. A pasta `dist` também deve estar presente.

## Passo 2: Configurar o Node.js no cPanel
1. Abra o **"Setup Node.js App"**.
2. **Node.js version**: 22.17.0 (conforme a sua imagem).
3. **Modo de aplicação**: `Production`.
4. **Raiz do aplicativo (Application root)**: Use `/home/ambweb/public_html`.
   - *Nota: Verifique se os arquivos (package.json, server.js) estão exatamente dentro da pasta public_html.*
5. **URL do aplicativo**: Selecione `ambweb.com.br`.
6. **Arquivo de inicialização (Application startup file)**: Use **`server.js`**.
7. Clique em **SAVE**.

## Passo 3: Ativar o Instalador do NPM
Após salvar, o botão **"Run npm install"** (ou "Executar instalação do NPM") deverá ficar clicável. 
- Clique nele para instalar as dependências no servidor.
- Se o botão continuar cinza, significa que o cPanel não encontrou o arquivo `package.json` na pasta indicada no campo "Application root".

## Por que mudei para server.js?
O cPanel por padrão procura arquivos `.js`. Eu criei um arquivo `server.js` que apenas "chama" o nosso servidor principal em TypeScript. Isso resolve o erro de inicialização.

## Permissões
Certifique-se de que a pasta `public_html` tem permissões de escrita, para que o servidor possa baixar o FFmpeg automaticamente quando rodar pela primeira vez.
