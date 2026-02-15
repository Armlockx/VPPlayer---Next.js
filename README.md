# 👌vPlay

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-2.38-green?logo=supabase)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Um player de vídeo moderno e completo, inspirado no Netflix, com integração Supabase e recursos avançados de interação social.**

[Features](#-features) • [Instalação](#-instalação) • [Documentação](#-documentação) • [Deploy](#-deploy)

</div>

---

## 📖 Sobre o Projeto

👌vPlay é uma plataforma de streaming de vídeos moderna e completa, construída com Next.js 14 e TypeScript. O projeto oferece uma experiência de usuário rica e intuitiva, similar ao Netflix, com funcionalidades avançadas de interação social, histórico personalizado, sistema de favoritos e muito mais.

### 🎯 Objetivos

- Fornecer uma experiência de streaming de vídeos moderna e responsiva
- Implementar recursos de interação social (comentários, likes, favoritos)
- Manter histórico e progresso de visualização por usuário
- Oferecer painel administrativo completo para gerenciamento de conteúdo
- Suportar PWA para experiência mobile nativa

---

## ✨ Features

### 🎬 Player de Vídeo
- ✅ Player customizado estilo Netflix
- ✅ Controles automáticos que desaparecem após inatividade
- ✅ Velocidade de reprodução ajustável (0.25x - 2x)
- ✅ Seletor de qualidade visual
- ✅ Indicador de buffer na barra de progresso
- ✅ Indicador de qualidade de conexão
- ✅ Suporte completo a fullscreen
- ✅ Atalhos de teclado (modal de ajuda)

### 📚 Histórico e Continuidade
- ✅ Sistema de histórico de vídeos assistidos
- ✅ Salvar progresso de reprodução por vídeo
- ✅ Seção "Continuar Assistindo" na home
- ✅ Botão "Assistir de novo" para vídeos completos
- ✅ Limpar histórico individual ou em massa
- ✅ Rastreamento preciso de watch time

### 💬 Interação Social
- ✅ Sistema de comentários com threads (respostas)
- ✅ Editar próprios comentários
- ✅ Timestamps clicáveis em comentários
- ✅ Sistema de likes (curtir vídeos)
- ✅ Página dedicada para vídeos curtidos

### ⭐ Favoritos e Watchlist
- ✅ Sistema de favoritos
- ✅ Watchlist (assistir mais tarde)
- ✅ Páginas dedicadas para favoritos e watchlist
- ✅ Integração com cards de vídeo

### 👤 Perfil e Autenticação
- ✅ Autenticação completa (login/registro)
- ✅ Perfis de usuário
- ✅ Sistema de administração
- ✅ Gerenciamento de usuários

### 🛠️ Painel Administrativo
- ✅ Dashboard com estatísticas em tempo real
- ✅ Gerenciamento de vídeos (CRUD completo)
- ✅ Gerenciamento de usuários
- ✅ Visualização de logs do projeto
- ✅ Estatísticas atualizadas a cada 5 segundos

### 📱 PWA (Progressive Web App)
- ✅ Manifest.json configurado
- ✅ Service Worker para funcionamento offline
- ✅ Ícones para instalação
- ✅ Splash screen customizado

### 🎨 UI/UX
- ✅ Design moderno e responsivo
- ✅ Scrollbar customizada
- ✅ Sidebar com navegação intuitiva
- ✅ Thumbnails padronizados
- ✅ Animações suaves
- ✅ Tema escuro

---

## 🛠️ Tecnologias

### Frontend
- **[Next.js 14](https://nextjs.org/)** - Framework React com App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[React 18](https://react.dev/)** - Biblioteca UI
- **[Framer Motion](https://www.framer.com/motion/)** - Animações
- **[React Icons](https://react-icons.github.io/react-icons/)** - Ícones

### Backend & Database
- **[Supabase](https://supabase.com/)** - Backend as a Service
  - PostgreSQL Database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Storage para vídeos
  - Authentication

### Deploy
- **[Vercel](https://vercel.com/)** - Hosting e CI/CD

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **[Node.js](https://nodejs.org/)** (versão 18 ou superior)
- **[npm](https://www.npmjs.com/)** ou **[yarn](https://yarnpkg.com/)**
- Conta no **[Supabase](https://supabase.com/)** (gratuita)
- Conta no **[Vercel](https://vercel.com/)** (opcional, para deploy)

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/Armlockx/VPPlayer---Next.js.git
cd vpnextjs
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure o Supabase

1. Crie um projeto no [Supabase](https://supabase.com/)
2. Execute as migrations na ordem:
   - Veja [database/README.md](./database/README.md) para instruções detalhadas
   - Execute os scripts em `database/migrations/` na ordem numérica

### 4. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp env.local.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Execute o projeto

```bash
npm run dev
# ou
yarn dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## 📁 Estrutura do Projeto

```
vpnextjs/
├── app/                    # Next.js App Router
│   ├── admin/             # Páginas administrativas
│   ├── api/                # API Routes
│   ├── favorites/          # Página de favoritos
│   ├── history/            # Página de histórico
│   ├── liked/              # Página de vídeos curtidos
│   ├── watchlist/          # Página de watchlist
│   ├── watch/[id]/         # Player de vídeo
│   └── layout.tsx          # Layout principal
│
├── components/             # Componentes React
│   ├── admin/              # Componentes do painel admin
│   ├── auth/               # Componentes de autenticação
│   ├── home/                # Componentes da home
│   ├── layout/              # Componentes de layout
│   ├── modals/              # Modais
│   ├── player/              # Componentes do player
│   └── user/                # Componentes de usuário
│
├── database/               # Migrations e seeds
│   ├── migrations/          # Migrations versionadas
│   ├── seeds/               # Scripts de seed
│   └── README.md            # Documentação do banco
│
├── docs/                   # Documentação
│   ├── database/            # Docs do banco de dados
│   ├── deployment/          # Guias de deploy
│   ├── development/         # Docs de desenvolvimento
│   ├── features/            # Docs de features
│   ├── setup/               # Guias de setup
│   └── README.md            # Índice da documentação
│
├── lib/                     # Código compartilhado
│   ├── hooks/               # React Hooks customizados
│   ├── services/            # Camada de serviços (API)
│   ├── supabase/            # Cliente Supabase
│   └── utils/               # Utilitários
│
├── public/                  # Arquivos estáticos
│   ├── icons/               # Ícones PWA
│   ├── manifest.json        # Manifest PWA
│   └── sw.js                # Service Worker
│
├── types/                   # Definições TypeScript
└── README.md                # Este arquivo
```

---

## 🗄️ Banco de Dados

O projeto utiliza Supabase (PostgreSQL) com as seguintes tabelas principais:

- `videos` - Armazena informações dos vídeos
- `profiles` - Perfis de usuários
- `video_history` - Histórico de visualização
- `video_comments` - Comentários e threads
- `video_likes` - Likes de vídeos
- `video_favorites` - Favoritos e watchlist

Para mais detalhes sobre o schema e migrations, consulte [database/README.md](./database/README.md).

---

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Produção
npm run build        # Cria build de produção
npm run start        # Inicia servidor de produção

# Qualidade
npm run lint         # Executa ESLint
```

---

## 🚀 Deploy

### Deploy no Vercel (Recomendado)

1. Conecte seu repositório ao [Vercel](https://vercel.com/)
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. O Vercel detectará automaticamente a configuração Next.js
4. Deploy automático a cada push na branch principal

Para instruções detalhadas, veja [docs/deployment/VERCEL_DEPLOY.md](./docs/deployment/VERCEL_DEPLOY.md).

---

## 📚 Documentação

A documentação completa está organizada em `docs/`:

- **[Setup Inicial](./docs/setup/SETUP.md)** - Guia de configuração
- **[Database](./database/README.md)** - Documentação do banco de dados
- **[Deploy](./docs/deployment/VERCEL_DEPLOY.md)** - Guias de deploy
- **[Progresso](./docs/development/PROGRESSO_ATUAL.md)** - Status do projeto
- **[Checklist](./docs/development/CHECKLIST_MELHORIAS.md)** - Melhorias planejadas

Veja [docs/README.md](./docs/README.md) para o índice completo.

---

## 🎯 Roadmap

Veja [docs/development/CHECKLIST_MELHORIAS.md](./docs/development/CHECKLIST_MELHORIAS.md) para a lista completa de melhorias planejadas.

### Próximas Features
- [ ] Sistema de playlists
- [ ] Recomendações baseadas em histórico
- [ ] Compartilhamento de vídeos
- [ ] Notificações push
- [ ] Modo offline avançado
- [ ] Suporte a legendas

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Julio Reus**

- GitHub: [@Armlockx](https://github.com/Armlockx)
- Email: seu-email@exemplo.com

---

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/) - Framework incrível
- [Supabase](https://supabase.com/) - Backend poderoso
- [Vercel](https://vercel.com/) - Deploy simplificado
- Comunidade open source

---

<div align="center">

**Feito com ❤️(ódio) usando Next.js e Supabase**

⭐ Se este projeto foi útil, considere dar uma estrela!

</div>
