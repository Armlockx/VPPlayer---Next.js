# Instruções para Deploy no Vercel

## ⚠️ Problema Comum: Build Command não executando

Se você está vendo o erro:
```
Error: The file "/vercel/path0/routes-manifest.json" couldn't be found
```

E o log mostra:
```
Running "echo 'No build step required'"
```

Isso significa que há uma configuração no **Dashboard do Vercel** que está sobrescrevendo o `vercel.json`.

## 🔧 Solução

### 1. Acesse o Dashboard do Vercel
1. Vá para [vercel.com](https://vercel.com)
2. Acesse seu projeto `VPPlayer---Next.js`
3. Vá em **Settings** → **General**

### 2. Verifique/Configure as seguintes opções:

#### Build & Development Settings:
- **Framework Preset**: Deve estar como `Next.js` (ou deixar em "Other" para detecção automática)
- **Build Command**: Deve estar **VAZIO** ou `npm run build`
  - ⚠️ Se estiver como `echo 'No build step required'`, **REMOVA** ou altere para `npm run build`
- **Output Directory**: Deve estar **VAZIO** (deixe o Next.js gerenciar)
- **Install Command**: Deve estar **VAZIO** ou `npm install`
- **Root Directory**: Deve estar **VAZIO** (ou `.` se o projeto estiver na raiz)

### 3. Após alterar as configurações:
1. Salve as alterações
2. Vá em **Deployments**
3. Clique nos três pontos (...) do último deployment
4. Selecione **Redeploy**
5. Ou faça um novo commit e push para triggerar um novo deploy

## ✅ Configuração Correta Esperada

O Vercel deve:
1. Detectar automaticamente que é um projeto Next.js
2. Executar `npm install`
3. Executar `npm run build` (não `echo 'No build step required'`)
4. Gerar os arquivos em `.next/`
5. Fazer o deploy

## 📝 Variáveis de Ambiente (OBRIGATÓRIO!)

⚠️ **IMPORTANTE**: As variáveis de ambiente devem ser configuradas no Vercel antes do deploy!

### Como configurar:

1. Acesse o Dashboard do Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://esvjyjnyrmysvylnszjd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdmp5am55cm15c3Z5bG5zempkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MzY2ODMsImV4cCI6MjA4MTMxMjY4M30.ZyEgF8y4cIdCPnlcfMOLt0fYMoZCJkXCdc6eqeF8xAA` |

4. Certifique-se de que as variáveis estão habilitadas para **Production**, **Preview** e **Development**
5. Após adicionar, faça um novo deploy

### ⚠️ Erro comum:

Se você ver o erro:
```
Error: Your project's URL and Key are required to create a Supabase client!
```

Isso significa que as variáveis de ambiente não foram configuradas no Vercel. Configure-as conforme acima e faça um novo deploy.

## 🐛 Se o problema persistir

1. Tente deletar o projeto no Vercel e recriar
2. Ou use o CLI do Vercel:
   ```bash
   npm i -g vercel
   vercel
   ```

