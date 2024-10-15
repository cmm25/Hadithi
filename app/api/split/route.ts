import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

const MAX_CHUNK_SIZE = 4000;
const MAX_CHUNKS_PER_BATCH = 10;

export async function POST(req: Request) {
    try {
        const { document, chunkSize = 1000, chunkOverlap = 200 } = await req.json();

        if (!document || typeof document !== "string") {
            return NextResponse.json({ message: "Invalid input document" }, { status: 400 });
        }

        if (document.trim().length === 0) {
            return NextResponse.json({ message: "Empty document provided" }, { status: 400 });
        }

        console.log(`Received document of length: ${document.length}`);
        console.log(`Chunk size: ${chunkSize}, Chunk overlap: ${chunkOverlap}`);

        const systemMessage = `You are a helpful assistant that extracts character information from text.
        For each character, provide their name, a brief description, and their personality traits.
        Format the output as a JSON array of objects, where each object represents a character with 'name', 'description', and 'personality' fields.`;

        const chunks = splitTextIntoChunks(document, Math.min(chunkSize, MAX_CHUNK_SIZE), chunkOverlap);
        console.log(`Split document into ${chunks.length} chunks`);

        const allCharacters: Character[] = [];
        for (let i = 0; i < chunks.length; i += MAX_CHUNKS_PER_BATCH) {
            const batchChunks = chunks.slice(i, i + MAX_CHUNKS_PER_BATCH);
            const batchCharacters = await processBatch(batchChunks, systemMessage, i);
            allCharacters.push(...batchCharacters);
        }

        const characters = deduplicateCharacters(allCharacters);
        console.log(`Extracted ${characters.length} unique characters`);

        return NextResponse.json(characters);

    } catch (error: unknown) {
        console.error("Error extracting characters:", error);

        let errorMessage = "An unexpected error occurred";
        if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { message: `Failed to extract characters: ${errorMessage}` },
            { status: 500 }
        );
    }
}

async function processBatch(chunks: string[], systemMessage: string, startIndex: number) {
    return await Promise.all(
        chunks.map(async (chunk, index) => {
            if (!chunk.trim()) return [];

            try {
                console.log(`Processing chunk ${startIndex + index + 1}`);
                const response = await openai.chat.completions.create({
                    model: "gpt-4",
                    stream: false,
                    temperature: 0.1,
                    messages: [
                        { role: "system", content: systemMessage },
                        { role: "user", content: `Extract all characters from the following text:\n\n${chunk}` },
                    ],
                });

                const result = response.choices[0].message?.content ?? "[]";
                return JSON.parse(result);
            } catch (error) {
                console.error(`Error processing chunk ${startIndex + index + 1}:`, error);
                return [];
            }
        })
    );
}

function splitTextIntoChunks(text: string, chunkSize: number, chunkOverlap: number): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        const endIndex = Math.min(startIndex + chunkSize, text.length);
        chunks.push(text.slice(startIndex, endIndex));

        if (endIndex === text.length) {
            break; 
        }

        startIndex = endIndex - chunkOverlap;
    }

    return chunks;
}

interface Character {
    name: string;
    description: string;
    personality: string;
}

function deduplicateCharacters(characters: Character[]): Character[] {
    const uniqueCharacters: { [name: string]: Character } = {};

    for (const character of characters) {
        if (!uniqueCharacters[character.name]) {
            uniqueCharacters[character.name] = character;
        } else {
            uniqueCharacters[character.name].description += ' ' + character.description;
            uniqueCharacters[character.name].personality += ' ' + character.personality;
        }
    }

    return Object.values(uniqueCharacters);
}
