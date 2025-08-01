// ===================================================================
// 📁 SCRIPT: generate_metadata.js (Compatível com index.html)
// ===================================================================

const fs = require('fs');
const path = require('path');

// Configurações globais
const config = {
  outputFile: 'files_metadata.json',
  excludedFiles: [
    'index.html',
    'style.css',
    'script.js',
    'files_metadata.json',
    'generate_metadata.js',
    '.gitignore',
    'README.md'
  ],
  includedExtensions: ['.m3u', '.xml', '.xml.gz', '.txt'],
  githubUser: 'josieljluz',
  githubRepo: 'playlists',
  branch: process.env.CI_COMMIT_REF_NAME || 'main'
};

// Função para determinar o tipo do arquivo
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.m3u') return 'm3u';
  if (ext === '.xml' || ext === '.xml.gz') return 'epg';
  return 'file';
}

// Função para formatar tamanho do arquivo
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Função principal para obter informações dos arquivos
function getFilesInfo() {
  return fs.readdirSync('.', { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name)
    .filter(file => {
      const hasValidExt = config.includedExtensions.some(ext => file.endsWith(ext));
      return hasValidExt && !config.excludedFiles.includes(file);
    })
    .map(file => {
      const stats = fs.statSync(file);
      return {
        name: file,
        type: getFileType(file),
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        updated: stats.mtime.toISOString(),
        download_url: `https://raw.githubusercontent.com/${config.githubUser}/${config.githubRepo}/${config.branch}/${file}`
      };
    });
}

// Função para gerar metadados completos
function generateMetadata() {
  const files = getFilesInfo();
  const now = new Date();

  const metadata = {
    metadata: {
      generated_at: now.toISOString(),
      next_update: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      m3u_count: files.filter(f => f.type === 'm3u').length,
      epg_count: files.filter(f => f.type === 'epg').length,
      total_files: files.length,
      total_size: files.reduce((sum, file) => sum + file.size, 0),
      total_size_formatted: formatFileSize(
        files.reduce((sum, file) => sum + file.size, 0)
      )
    },
    files: files.sort((a, b) => a.name.localeCompare(b.name))
  };

  fs.writeFileSync(config.outputFile, JSON.stringify(metadata, null, 2));
  console.log('✅ Metadados gerados com sucesso!');
  console.log(`📊 Total de arquivos: ${metadata.metadata.total_files} (${metadata.metadata.m3u_count} M3U, ${metadata.metadata.epg_count} EPG)`);
}

// Execução
generateMetadata();
