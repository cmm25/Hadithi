import ffmpeg from "fluent-ffmpeg";
import path from 'path';
import fs from 'fs';

export const generateVideo = async (text: string, index: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const videoFileName = `story-section-${index}.mp4`;
        const tempDir = path.join('/tmp', 'videos');

        // Ensure the temp directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const videoPath = path.join(tempDir, videoFileName);

        ffmpeg()
            .input('color=c=black:s=1280x720:d=5') // 5-second black screen
            .inputFormat('lavfi')
            .complexFilter([
                {
                    filter: 'drawtext',
                    options: {
                        fontfile: '/path/to/font.ttf', // Update this path based on your system
                        text,
                        fontsize: 36,
                        fontcolor: 'white',
                        x: '(w-text_w)/2',
                        y: '(h-text_h)/2',
                        box: 1,
                        boxcolor: 'black@0.5',
                    },
                },
            ])
            .outputOptions('-movflags frag_keyframe+empty_moov')
            .output(videoPath)
            .on('end', () => {
                console.log(`Video created successfully at ${videoPath}`);
                resolve(videoPath);
            })
            .on('error', (err) => {
                console.error('FFMPEG Error:', err);
                reject(err);
            })
            .run();
    });
};