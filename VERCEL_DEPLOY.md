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

## 📝 Variáveis de Ambiente

Certifique-se de configurar no Vercel (Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🐛 Se o problema persistir

1. Tente deletar o projeto no Vercel e recriar
2. Ou use o CLI do Vercel:
   ```bash
   npm i -g vercel
   vercel
   ```

