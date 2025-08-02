// ===================================================================
// 📁 SCRIPT: generate_metadata.js (Aprimorado para index.html)
// ===================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
    'README.md',
    '.git',
    '.github',
    'node_modules',
    'package.json',
    'package-lock.json'
  ],
  includedExtensions: [
    // Playlists
    '.m3u', '.m3u8',
    // Guias EPG
    '.xml', '.xml.gz', '.xmltv', '.json', '.json.gz',
    // Documentos
    '.pdf', '.doc', '.docx', '.docm', '.dot', '.dotx', '.dotm', '.rtf', '.odt',
    // Planilhas
    '.xls', '.xlsx', '.xlsm', '.xlt', '.xltx', '.xltm', '.csv', '.ods',
    // Apresentações
    '.ppt', '.pptx', '.pptm', '.pps', '.ppsx', '.ppsm', '.pot', '.potx', '.potm', '.odp',
    // Imagens
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.tiff', '.webp', '.heic', '.avif', '.ico', '.eps', '.raw', '.psd', '.ai',
    // Vídeos
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mpg', '.mpeg', '.m4v', '.3gp', '.ogv', '.ts', '.m2ts', '.vob', '.divx', '.asf', '.rm', '.rmvb',
    // Áudios
    '.mp3', '.wav', '.aac', '.flac', '.ogg', '.wma', '.alac', '.aiff', '.m4a', '.amr', '.ape', '.opus', '.dsf', '.dff',
    // Compactados
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.z', '.lzh', '.arj', '.cab', '.iso', '.dmg', '.jar', '.war', '.tgz', '.tbz2', '.txz',
    // Texto
    '.txt', '.md', '.log', '.ini', '.conf',
    // Código
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.swift', '.kt', '.rs',
    '.html', '.htm', '.css', '.scss', '.json', '.xml', '.yml', '.yaml', '.sh', '.bash', '.sql'
  ],
  githubUser: 'josieljluz',
  githubRepo: 'playlists',
  branch: process.env.CI_COMMIT_REF_NAME || 'main',
  // Intervalo de atualização em horas
  updateInterval: 6
};

// Cache para armazenar hashes de arquivos
const fileHashes = {};

// Função para calcular hash MD5 de um arquivo
function calculateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

// Função para determinar o tipo do arquivo
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase().slice(1); // Remove o ponto

  // Playlists M3U
  if (['m3u', 'm3u8'].includes(ext)) return 'm3u';
  
  // Guias EPG
  if (['xml', 'xml.gz', 'xmltv', 'json', 'json.gz'].includes(ext)) return 'epg';
  
  // Documentos
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'docm', 'dot', 'dotx', 'dotm', 'rtf', 'odt'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'xlsm', 'xlt', 'xltx', 'xltm', 'csv', 'ods'].includes(ext)) return 'excel';
  if (['ppt', 'pptx', 'pptm', 'pps', 'ppsx', 'ppsm', 'pot', 'potx', 'potm', 'odp'].includes(ext)) return 'powerpoint';
  
  // Mídia
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'tiff', 'webp', 'heic', 'avif', 'ico', 'eps', 'raw', 'psd', 'ai'].includes(ext)) return 'image';
  if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mpg', 'mpeg', 'm4v', '3gp', 'ogv', 'ts', 'm2ts', 'vob', 'divx', 'asf', 'rm', 'rmvb'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'alac', 'aiff', 'm4a', 'amr', 'ape', 'opus', 'dsf', 'dff'].includes(ext)) return 'audio';
  
  // Compactados
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'z', 'lzh', 'arj', 'cab', 'iso', 'dmg', 'jar', 'war', 'tgz', 'tbz2', 'txz'].includes(ext)) return 'archive';
  
  // Texto e código
  if (['txt', 'md', 'log', 'ini', 'conf'].includes(ext)) return 'text';
  if ([
    'js', 'jsx', 'ts', 'tsx',       // JavaScript/TypeScript
    'py', 'java', 'cpp', 'c', 'cs', // Python, Java, C/C++, C#
    'php', 'rb', 'go', 'swift', 'kt', 'rs', // PHP, Ruby, Go, Swift, Kotlin, Rust
    'html', 'htm', 'css', 'scss',   // Web
    'json', 'yml', 'yaml', 'xml',   // Configuração
    'sh', 'bash', 'sql'            // Shell, SQL
  ].includes(ext)) return 'code';

  return 'other';
}

// Função para gerar descrição automática baseada no tipo e nome do arquivo
function generateFileDescription(filename, fileType) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  const cleanName = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  switch(fileType) {
    case 'm3u':
      return `Playlist M3U: ${cleanName}`;
    case 'epg':
      return `Guia EPG: ${cleanName}`;
    case 'pdf':
      return `Documento PDF: ${cleanName}`;
    case 'word':
      return `Documento Word: ${cleanName}`;
    case 'excel':
      return `Planilha Excel: ${cleanName}`;
    case 'powerpoint':
      return `Apresentação PowerPoint: ${cleanName}`;
    case 'image':
      return `Imagem: ${cleanName}`;
    case 'video':
      return `Vídeo: ${cleanName}`;
    case 'audio':
      return `Áudio: ${cleanName}`;
    case 'archive':
      return `Arquivo Compactado: ${cleanName}`;
    case 'text':
      return `Arquivo de Texto: ${cleanName}`;
    case 'code':
      return `Arquivo de Código: ${cleanName}`;
    default:
      return `Arquivo: ${cleanName}`;
  }
}

// Função para formatar tamanho do arquivo
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Função para obter estatísticas detalhadas por tipo de arquivo
function getFileTypeStatistics(files) {
  const stats = {
    m3u: { count: 0, totalSize: 0 },
    epg: { count: 0, totalSize: 0 },
    pdf: { count: 0, totalSize: 0 },
    word: { count: 0, totalSize: 0 },
    excel: { count: 0, totalSize: 0 },
    powerpoint: { count: 0, totalSize: 0 },
    image: { count: 0, totalSize: 0 },
    video: { count: 0, totalSize: 0 },
    audio: { count: 0, totalSize: 0 },
    archive: { count: 0, totalSize: 0 },
    text: { count: 0, totalSize: 0 },
    code: { count: 0, totalSize: 0 },
    other: { count: 0, totalSize: 0 }
  };

  files.forEach(file => {
    if (stats[file.type]) {
      stats[file.type].count++;
      stats[file.type].totalSize += file.size;
    } else {
      stats.other.count++;
      stats.other.totalSize += file.size;
    }
  });

  // Formata os tamanhos
  Object.keys(stats).forEach(type => {
    stats[type].totalSizeFormatted = formatFileSize(stats[type].totalSize);
  });

  return stats;
}

// Função principal para obter informações dos arquivos
function getFilesInfo() {
  const allFiles = fs.readdirSync('.', { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);

  const validFiles = allFiles.filter(file => {
    // Verifica se a extensão está na lista de inclusão
    const ext = path.extname(file).toLowerCase();
    const hasValidExt = config.includedExtensions.some(includedExt => ext === includedExt.toLowerCase());
    
    // Verifica se não está na lista de exclusão
    const isExcluded = config.excludedFiles.includes(file);
    
    return hasValidExt && !isExcluded;
  });

  // Processa cada arquivo válido
  return validFiles.map(file => {
    const stats = fs.statSync(file);
    const fileType = getFileType(file);
    const fileHash = calculateFileHash(file);
    
    // Armazena o hash para verificação de mudanças
    fileHashes[file] = fileHash;

    return {
      name: file,
      type: fileType,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      updated: stats.mtime.toISOString(),
      created: stats.birthtime.toISOString(),
      hash: fileHash,
      description: generateFileDescription(file, fileType),
      download_url: `https://raw.githubusercontent.com/${config.githubUser}/${config.githubRepo}/${config.branch}/${encodeURIComponent(file)}`,
      raw_url: `https://github.com/${config.githubUser}/${config.githubRepo}/raw/${config.branch}/${encodeURIComponent(file)}`,
      github_url: `https://github.com/${config.githubUser}/${config.githubRepo}/blob/${config.branch}/${encodeURIComponent(file)}`
    };
  });
}

// Função para verificar mudanças nos arquivos
function checkForChanges(previousMetadata) {
  if (!previousMetadata || !previousMetadata.files) return { changed: [], removed: [] };

  const currentFiles = fs.readdirSync('.', { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);

  const previousFiles = previousMetadata.files.map(f => f.name);
  
  // Arquivos removidos
  const removedFiles = previousFiles.filter(file => !currentFiles.includes(file));
  
  // Arquivos modificados ou novos
  const changedFiles = [];
  
  currentFiles.forEach(file => {
    if (config.excludedFiles.includes(file)) return;
    
    const previousFile = previousMetadata.files.find(f => f.name === file);
    if (!previousFile) {
      changedFiles.push(file); // Novo arquivo
    } else {
      const currentHash = calculateFileHash(file);
      if (currentHash !== previousFile.hash) {
        changedFiles.push(file); // Arquivo modificado
      }
    }
  });

  return {
    changed: changedFiles,
    removed: removedFiles
  };
}

// Função para gerar metadados completos
function generateMetadata() {
  const now = new Date();
  const nextUpdate = new Date(now.getTime() + config.updateInterval * 60 * 60 * 1000);
  
  // Verifica se existe um metadata anterior para comparar
  let previousMetadata = null;
  let changes = { changed: [], removed: [] };
  
  try {
    if (fs.existsSync(config.outputFile)) {
      previousMetadata = JSON.parse(fs.readFileSync(config.outputFile, 'utf8'));
      changes = checkForChanges(previousMetadata);
    }
  } catch (e) {
    console.error('⚠️ Erro ao ler metadata anterior:', e.message);
  }

  const files = getFilesInfo();
  const fileStats = getFileTypeStatistics(files);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  const metadata = {
    metadata: {
      generated_at: now.toISOString(),
      next_update: nextUpdate.toISOString(),
      generator: 'generate_metadata.js',
      version: '2.0',
      file_stats: fileStats,
      total_files: files.length,
      total_size: totalSize,
      total_size_formatted: formatFileSize(totalSize),
      changes_since_last_update: {
        changed_files: changes.changed.length,
        removed_files: changes.removed.length,
        new_files: files.length - (previousMetadata ? previousMetadata.files.length : 0) + changes.removed.length
      }
    },
    files: files.sort((a, b) => a.name.localeCompare(b.name))
  };

  // Escreve o arquivo de metadados
  fs.writeFileSync(config.outputFile, JSON.stringify(metadata, null, 2));
  
  // Log de resultados
  console.log('✅ Metadados gerados com sucesso!');
  console.log(`📊 Total de arquivos: ${metadata.metadata.total_files}`);
  console.log(`📦 Tamanho total: ${metadata.metadata.total_size_formatted}`);
  
  // Mostra estatísticas por tipo
  console.log('\n📋 Estatísticas por tipo:');
  Object.entries(metadata.metadata.file_stats).forEach(([type, stats]) => {
    if (stats.count > 0) {
      console.log(`- ${type.toUpperCase()}: ${stats.count} arquivos (${stats.totalSizeFormatted})`);
    }
  });
  
  // Mostra mudanças
  if (changes.changed.length > 0 || changes.removed.length > 0) {
    console.log('\n🔄 Mudanças desde a última atualização:');
    if (changes.changed.length > 0) {
      console.log(`- ${changes.changed.length} arquivos modificados/novos`);
    }
    if (changes.removed.length > 0) {
      console.log(`- ${changes.removed.length} arquivos removidos`);
    }
  }
}

// Execução
generateMetadata();
