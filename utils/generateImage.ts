import { LivepeerImage } from "./types";

// Environment variables and default values
const livepeer_sd_gateway =
    process.env.LIVEPEER_SD_GATEWAY_HOST ?? 'dream-gateway.livepeer.cloud';
const model_id = process.env.LIVEPEER_SD_MODEL_ID ?? 'ByteDance/SDXL-Lightning';
const negative_prompt = process.env.LIVEPEER_SD_NEGATIVE_PROMPT ?? undefined;
const image_size = Number(process.env.LIVEPEER_SD_IMAGE_SIZE ?? '1024');
const guidance_scale = Number(process.env.LIVEPEER_SD_GUIDANCE ?? '15');
const num_images = Number(process.env.LIVEPEER_SD_IMAGE_COUNT ?? '1'); // Generate one image per section

const livePeerRequestOptions = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
    },
};

export const generateImages = async (prompt: string) => {
    let urls: string[];
    const body = {
        prompt,
        model_id,
        guidance_scale,
        negative_prompt,
        width: image_size,
        height: image_size,
        num_images_per_prompt: num_images,
    };

    const request = await _request({
        ...livePeerRequestOptions,
        body: JSON.stringify(body),
    });

    const { images } = await request.json();
    if (!images || images.length === 0) {
        throw new Error('No images returned from Livepeer');
    }

    try {
        urls = images.map((image: LivepeerImage) => {
            return image.url;
        });
    } catch (e) {
        console.error('Error parsing image URLs', e);
        throw e;
    }
    return urls;
};

const _request = async (options: RequestInit) => {
    const endpoint = `https://${livepeer_sd_gateway}/text-to-image`;
    return fetch(endpoint, options);
};