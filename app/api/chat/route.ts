import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
    const {
        tone = "witty",
        setting = "forest",
        characters = [],
        language = "en",
        temperature = 0.8
    } = await req.json();

    const systemMessage = `You are a master storyteller known for creating engaging narratives in various settings.
Your stories should be rich in detail, capturing the essence of the setting and characters, while being easy to understand in the specified language.
Be creative, imaginative, and tailor the story to the chosen tone and setting. Story should always be complete regardless of token size

Format your story using proper Markdown syntax:

1. Start with a title: "# Story Title"
2. Use "##" for chapter headers
3. Use proper paragraph breaks
4. Use *italics* or **bold** for emphasis
5. Use proper quotation marks for dialogue: "Like this"

Example format:
# The Great Adventure

## Chapter One: The Beginning
In a distant land...

"What do you think?" asked John.
"It's beautiful," Mary replied.

Remember to maintain consistent formatting throughout the story.`;

    interface Character {
        name: string;
        description: string;
        personality: string;
    }

    const characterPrompts = characters.map((c: Character) => `${c.name}: ${c.description}. Personality: ${c.personality}`).join('\n');

    const userPrompt = `Generate a ${tone} story set in a ${setting} in ${language}. The story should be engaging and immersive.
Include the following characters in your story:
${characterPrompts}
Be creative and don't hold back! Remember to format the story as specified in the system message.`;

    const apiMessages: ChatCompletionMessageParam[] = [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt }
    ];

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            stream: true,
            temperature: temperature,
            messages: apiMessages,
            max_tokens: 500,
            presence_penalty: 0.6,
            frequency_penalty: 0.3,
        });

        // Return the stream directly without manipulation
        const cleanStream = new TransformStream({
            async transform(chunk: Uint8Array, controller) {
                // Convert Uint8Array to string
                const chunkString = new TextDecoder().decode(chunk);
                const cleanedChunk = chunkString.replace(/\d+:"/g, '').replace(/"/g, '');
                controller.enqueue(new TextEncoder().encode(cleanedChunk));
            },
        });

        const stream = OpenAIStream(response).pipeThrough(cleanStream);
        return new StreamingTextResponse(stream);
    } catch (error) {
        console.error("Error generating story:", error);
        return new Response("Failed to generate story", { status: 500 });
    }
}
