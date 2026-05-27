# Bora! — App de Descoberta de Locais e Eventos (Curitiba)

O **Bora!** é um web app móvel premium focado em geolocalização para descoberta de locais, eventos e experiências em Curitiba. Este projeto foi estruturado localmente do zero para proporcionar controle total sobre a interface, permitindo atualizações de UI/UX aprimoradíssimas, com custo operacional de **R$ 0,00 (Zero Real)**.

---

## 🎨 Design System e Psicologia das Cores

A interface foi projetada utilizando as melhores práticas visuais baseadas na psicologia de cores para aplicativos de entretenimento e exploração:
*   **Coral (`#FF5422`)**: Cor de ação principal, gera entusiasmo, energia e convite imediato para ação ("Bora!").
*   **Teal (`#14B800`)**: Usado em categorias e feedbacks positivos, traz um senso de frescor e segurança.
*   **Deep Indigo (`#1B0E3F`)**: Fundo escuro premium, gera elegância, remete a rolês noturnos e reduz o consumo de bateria em telas OLED/AMOLED.
*   **Warm Off-White/Card (`#FFFFFF` translúcido)**: Elementos flutuantes tipo vidro (Glassmorphism) que trazem modernidade extrema ao layout.

---

## 🚀 Como Rodar o Projeto Localmente

Como este é um projeto Vite + React + TypeScript + Tailwind CSS, você precisa do **Node.js** para executá-lo em sua máquina local.

### 1. Instalar o Node.js
Se você ainda não possui o Node.js no seu computador, baixe e instale a versão LTS recomendada no site oficial:
👉 [https://nodejs.org](https://nodejs.org)

### 2. Rodar os Comandos no Terminal
Abra o terminal (PowerShell ou Command Prompt) na pasta do projeto e execute:

```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Iniciar o servidor de desenvolvimento local
npm run dev
```

Abra o endereço exibido no terminal (geralmente `http://localhost:5173`) no seu navegador.

---

## 📍 Custo Zero com Mapas: Leaflet + CartoDB
Para garantir que o app rode com **custo zero absoluto**, o Google Maps (que cobra após 28.500 visualizações) foi substituído pelo **Leaflet** integrado com **CartoDB Dark Matter / Positron tiles**.
*   **Ilimitado e 100% gratuito**: Sem chaves de API pagas ou risco de cobrança inesperada.
*   **Design Premium**: O tema escuro do CartoDB combina perfeitamente com a paleta Deep Indigo do Bora!.
*   **Marcadores Customizados**: Marcadores leves com efeito de hover, pulso e transições dinâmicas.

---

## 🔗 Integração com Rotas Móveis (Uber, 99, Maps)
Os botões de ação do app abrem diretamente os respectivos aplicativos no smartphone do usuário caso instalados, ou abrem a rota no navegador com coordenadas exatas:
*   **Google Maps**: Direciona rotas de GPS a pé ou de carro.
*   **Uber**: Inicia uma corrida com destino pré-definido e o nome do local.
*   **99App**: Inicia a corrida no app da 99 com as coordenadas do estabelecimento.

---

## 🔒 Conexão com o Supabase (Opcional)
Por padrão, o app roda em **Modo Local Mock** caso as credenciais não estejam configuradas. Ele carrega automaticamente dados reais e detalhados de pontos turísticos de Curitiba (Jardim Botânico, Ópera de Arame, Parque Barigui, Bar do Alemão, Terrazza 40, etc.).

Para conectar o app ao seu banco de dados Supabase na nuvem:
1.  Crie um arquivo chamado `.env` na raiz do projeto.
2.  Copie o conteúdo do arquivo `.env.example`.
3.  Insira a URL do seu projeto e a Anon Key fornecidas no painel do Supabase.

O app irá ler automaticamente as chaves e desativar o modo simulado.

---

## 📂 Como Sincronizar com o GitHub

Para manter o código seguro e sincronizar com o Lovable ou implantar na Vercel gratuitamente:

1.  Crie um repositório **privado** no seu GitHub (ex: `bora-app`).
2.  Abra o terminal na pasta do projeto e rode:

```bash
# Inicializar o repositório Git local
git init

# Adicionar todos os arquivos
git add .

# Criar o primeiro commit
git commit -m "feat: estrutura inicial do Bora MVP com Leaflet e design Coral/Indigo"

# Vincular ao seu repositório GitHub (substitua pelo seu link real do GitHub)
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/bora-app.git

# Enviar os arquivos
git push -u origin main
```

Após fazer isso, você pode ir no **Lovable** ou na **Vercel** e conectar este repositório do GitHub para deploys automatizados e contínuos!
