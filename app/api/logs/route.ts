import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const ALLOWED_FILES = [
  'PROGRESSO_ATUAL.md',
  'CHECKLIST_MELHORIAS.md',
  'INSTRUCOES_ICONES_PWA.md',
  'INSTRUCOES_HISTORICO.md',
  'INSTRUCOES_ADMIN.md',
  'README.md',
  'ANALISE_NEXTJS.md',
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json(
        { error: 'Nome do arquivo não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se o arquivo está na lista de permitidos
    if (!ALLOWED_FILES.includes(fileName)) {
      return NextResponse.json(
        { error: 'Arquivo não permitido' },
        { status: 403 }
      );
    }

    // Ler o arquivo da raiz do projeto
    const filePath = join(process.cwd(), fileName);
    const content = await readFile(filePath, 'utf-8');

    return NextResponse.json({ content }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Erro ao ler arquivo:', error);
    
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao ler arquivo' },
      { status: 500 }
    );
  }
}

