import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;

const loadFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();

  // Load FFmpeg core from CDN
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
};

export const extractAudioFromVideo = async (
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<File> => {
  try {
    const ffmpeg = await loadFFmpeg();

    // Generate unique filenames
    const inputFileName = `input-${Date.now()}.${videoFile.name.split('.').pop()}`;
    const outputFileName = `output-${Date.now()}.mp3`;

    // Write the input video file to FFmpeg's virtual file system
    await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

    // Extract audio using FFmpeg
    // -i: input file
    // -vn: no video
    // -acodec libmp3lame: encode to MP3
    // -b:a 128k: audio bitrate 128kbps
    // -ar 44100: audio sample rate 44.1kHz
    // -y: overwrite output file if exists
    await ffmpeg.exec([
      '-i',
      inputFileName,
      '-vn',
      '-acodec',
      'libmp3lame',
      '-b:a',
      '128k',
      '-ar',
      '44100',
      '-y',
      outputFileName
    ]);

    // Read the output audio file
    const audioData = await ffmpeg.readFile(outputFileName);

    // Clean up input and output files from virtual filesystem
    await ffmpeg.deleteFile(inputFileName);
    await ffmpeg.deleteFile(outputFileName);

    // Convert Uint8Array to Blob and then to File
    // Use unknown as intermediate type to bypass strict type checking
    // This is safe because FileData is effectively a Uint8Array at runtime
    const audioBlob = new Blob([audioData as unknown as BlobPart], { type: 'audio/mp3' });
    const audioFile = new File(
      [audioBlob],
      videoFile.name.replace(/\.[^/.]+$/, '') + '.mp3',
      { type: 'audio/mp3' }
    );

    if (onProgress) {
      onProgress(100);
    }

    return audioFile;
  } catch (error) {
    console.error('Error extracting audio:', error);
    throw new Error(
      `Failed to extract audio from video: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

export const cleanupFFmpeg = (): void => {
  ffmpegInstance = null;
};
