// ===================================================================
// 📁 SCRIPT: generate_metadata.js (TURBO MODE - Otimizado para performance)
// ===================================================================

const fs = require('fs').promises; // Usando promises para melhor performance
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { promisify } = require('util');
const brotliCompress = promisify(zlib.brotliCompress);

// Configurações globais otimizadas
const config = {
  outputFile: 'files_metadata.json',
  compressedOutput: 'files_metadata.json.br', // Versão comprimida
  cacheFile: '.metadata_cache',
  excludedFiles: new Set([
    'index.html', 'style.css', 'script.js', 'files_metadata.json',
    'generate_metadata.js', '.gitignore', 'README.md', '.git',
    '.github', 'node_modules', 'package.json', 'package-lock.json'
  ]),
  includedExtensions: new Set([
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
  ]),
  githubUser: 'josieljluz',
  githubRepo: 'playlists',
  branch: process.env.CI_COMMIT_REF_NAME || 'main',
  updateInterval: 6,
  concurrencyLimit: 10 // Limite de operações de I/O simultâneas
};

// Cache para armazenar hashes de arquivos
const fileHashes = new Map();

// Pool de promessas para operações concorrentes
class PromisePool {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency;
    this.pending = [];
    this.inProgress = 0;
  }

  async add(task) {
    if (this.inProgress >= this.maxConcurrency) {
      await new Promise(resolve => this.pending.push(resolve));
    }

    this.inProgress++;
    try {
      return await task();
    } finally {
      this.inProgress--;
      if (this.pending.length > 0) {
        this.pending.shift()();
      }
    }
  }
}

const pool = new PromisePool(config.concurrencyLimit);

// Função para calcular hash MD5 de um arquivo de forma assíncrona
async function calculateFileHash(filePath) {
  return pool.add(async () => {
    const hash = crypto.createHash('md5');
    const fileHandle = await fs.open(filePath, 'r');
    const stream = fileHandle.createReadStream();
    
    return new Promise((resolve, reject) => {
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => {
        fileHandle.close();
        resolve(hash.digest('hex'));
      });
      stream.on('error', err => {
        fileHandle.close();
        reject(err);
      });
    });
  });
}

// Função para determinar o tipo do arquivo (otimizada)
const fileTypeMap = new Map([
  [['m3u', 'm3u8'], 'm3u'],
  [['xml', 'xml.gz', 'xmltv', 'json', 'json.gz'], 'epg'],
  [['pdf'], 'pdf'],
  [['doc','docx','docm','dot','dotx','dotm','rtf','odt'], 'word'],
  [['xls','xlsx','xlsm','xlt','xltx','xltm','csv','ods'], 'excel'],
  [['ppt','pptx','pptm','pps','ppsx','ppsm','pot','potx','potm','odp'], 'powerpoint'],
  [['jpg','jpeg','png','gif','svg','bmp','tiff','webp','heic','avif','ico','eps','raw','psd','ai'], 'image'],
  [['mp4','mkv','avi','mov','wmv','flv','webm','mpg','mpeg','m4v','3gp','ogv','ts','m2ts','vob','divx','asf','rm','rmvb'], 'video'],
  [['mp3','wav','aac','flac','ogg','wma','alac','aiff','m4a','amr','ape','opus','dsf','dff'], 'audio'],
  [['zip','rar','7z','tar','gz','bz2','xz','z','lzh','arj','cab','iso','dmg','jar','war','tgz','tbz2','txz'], 'archive'],
  [['txt','md','log','ini','conf'], 'text'],
  [['js','jsx','ts','tsx','py','java','cpp','c','cs','php','rb','go','swift','kt','rs','html','htm','css','scss','json','xml','yml','yaml','sh','bash','sql'], 'code']
]);

function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase().slice(1);
  for (const [exts, type] of fileTypeMap) {
    if (exts.includes(ext)) return type;
  }
  return 'other';
}

// Função para gerar descrição automática (otimizada)
const descriptionTemplates = {
  m3u: 'Playlist M3U: {name}',
  epg: 'Guia EPG: {name}',
  pdf: 'Documento PDF: {name}',
  word: 'Documento Word: {name}',
  excel: 'Planilha Excel: {name}',
  powerpoint: 'Apresentação PowerPoint: {name}',
  image: 'Imagem: {name}',
  video: 'Vídeo: {name}',
  audio: 'Áudio: {name}',
  archive: 'Arquivo Compactado: {name}',
  text: 'Arquivo de Texto: {name}',
  code: 'Arquivo de Código: {name}',
  other: 'Arquivo: {name}'
};

function generateFileDescription(filename, fileType) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  const cleanName = nameWithoutExt.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return descriptionTemplates[fileType].replace('{name}', cleanName);
}

// Função para formatar tamanho do arquivo (otimizada)
const sizeUnits = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizeUnits[i];
}

// Função para obter estatísticas detalhadas por tipo de arquivo (otimizada)
async function getFileTypeStatistics(files) {
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
    const type = file.type in stats ? file.type : 'other';
    stats[type].count++;
    stats[type].totalSize += file.size;
  });

  // Formata os tamanhos
  Object.keys(stats).forEach(type => {
    stats[type].totalSizeFormatted = formatFileSize(stats[type].totalSize);
  });

  return stats;
}

// Função principal para obter informações dos arquivos (otimizada)
async function getFilesInfo() {
  const dirents = await fs.readdir('.', { withFileTypes: true });
  const files = dirents.filter(dirent => dirent.isFile()).map(dirent => dirent.name);

  const validFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return config.includedExtensions.has(ext) && !config.excludedFiles.has(file);
  });

  // Processa arquivos em paralelo com limite de concorrência
  const filePromises = validFiles.map(async file => {
    const stats = await fs.stat(file);
    const fileType = getFileType(file);
    const fileHash = await calculateFileHash(file);
    
    fileHashes.set(file, fileHash);

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

  return Promise.all(filePromises);
}

// Função para verificar mudanças nos arquivos (otimizada)
async function checkForChanges(previousMetadata) {
  if (!previousMetadata?.files) return { changed: [], removed: [] };

  const dirents = await fs.readdir('.', { withFileTypes: true });
  const currentFiles = new Set(dirents.filter(dirent => dirent.isFile()).map(dirent => dirent.name));
  const previousFiles = new Set(previousMetadata.files.map(f => f.name));
  
  // Arquivos removidos
  const removedFiles = [...previousFiles].filter(file => !currentFiles.has(file));
  
  // Verifica arquivos modificados em paralelo
  const changedFiles = [];
  const checkPromises = [...currentFiles].map(async file => {
    if (config.excludedFiles.has(file)) return;

    const previousFile = previousMetadata.files.find(f => f.name === file);
    if (!previousFile) {
      changedFiles.push(file);
    } else {
      const currentHash = await calculateFileHash(file);
      if (currentHash !== previousFile.hash) {
        changedFiles.push(file);
      }
    }
  });

  await Promise.all(checkPromises);

  return {
    changed: changedFiles,
    removed: removedFiles
  };
}

// Função para carregar cache (se existir)
async function loadCache() {
  try {
    const cacheData = await fs.readFile(config.cacheFile, 'utf8');
    return JSON.parse(cacheData);
  } catch {
    return null;
  }
}

// Função para salvar cache
async function saveCache(metadata) {
  try {
    await fs.writeFile(config.cacheFile, JSON.stringify(metadata));
  } catch (err) {
    console.error('⚠️ Erro ao salvar cache:', err.message);
  }
}

// Função para gerar metadados completos (otimizada)
async function generateMetadata() {
  const startTime = process.hrtime();
  const now = new Date();
  const nextUpdate = new Date(now.getTime() + config.updateInterval * 60 * 60 * 1000);
  
  // Tenta carregar cache para comparação
  const cache = await loadCache();
  let changes = { changed: [], removed: [] };
  
  if (cache) {
    changes = await checkForChanges(cache);
  }

  const files = await getFilesInfo();
  const fileStats = await getFileTypeStatistics(files);
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  const metadata = {
    metadata: {
      generated_at: now.toISOString(),
      next_update: nextUpdate.toISOString(),
      generator: 'generate_metadata.js',
      version: '3.0-turbo',
      file_stats: fileStats,
      total_files: files.length,
      total_size: totalSize,
      total_size_formatted: formatFileSize(totalSize),
      changes_since_last_update: {
        changed_files: changes.changed.length,
        removed_files: changes.removed.length,
        new_files: files.length - (cache ? cache.files.length : 0) + changes.removed.length
      },
      performance: {
        files_processed: files.length,
        processing_time: null // Será preenchido após
      }
    },
    files: files.sort((a, b) => a.name.localeCompare(b.name))
  };

  // Calcula tempo de processamento
  const hrtime = process.hrtime(startTime);
  const processingTime = (hrtime[0] * 1000 + hrtime[1] / 1e6).toFixed(2);
  metadata.metadata.performance.processing_time = `${processingTime}ms`;
  
  // Escreve o arquivo de metadados e versão comprimida
  await Promise.all([
    fs.writeFile(config.outputFile, JSON.stringify(metadata, null, 2)),
    brotliCompress(JSON.stringify(metadata)).then(compressed => 
      fs.writeFile(config.compressedOutput, compressed)
    ),
    saveCache(metadata)
  ]);
  
  // Log de resultados otimizado
  console.log('✅ Metadados gerados com sucesso!');
  console.log(`⚡ Performance: ${processingTime}ms para processar ${files.length} arquivos`);
  console.log(`📊 Total de arquivos: ${metadata.metadata.total_files}`);
  console.log(`📦 Tamanho total: ${metadata.metadata.total_size_formatted}`);
  
  // Mostra estatísticas por tipo
  console.log('\n📋 Estatísticas por tipo:');
  Object.entries(metadata.metadata.file_stats)
    .filter(([_, stats]) => stats.count > 0)
    .forEach(([type, stats]) => {
      console.log(`- ${type.toUpperCase().padEnd(10)}: ${stats.count.toString().padStart(4)} arquivos (${stats.totalSizeFormatted})`);
    });
  
  // Mostra mudanças se houver
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

// Execução com tratamento de erros
generateMetadata().catch(err => {
  console.error('❌ Erro crítico ao gerar metadados:', err);
  process.exit(1);
});
