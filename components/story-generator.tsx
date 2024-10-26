'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LinkedSlider } from '@/components/ui/linkedslider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Moon, Sun, Upload, Pencil, Trash2, Wand2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown';



interface Character {
  id: number;
  name: string;
  description: string;
  personality: string;
}

type Setting = 'country-side' | 'city' | 'forest' | 'beach' | 'mountains' | 'space' | 'arctic';
type Tone = 'dark' | 'fantasy' | 'witty' | 'romantic' | 'scary' | 'comic' | 'mystery' | 'sci-fi';

interface CharData {
  name?: string;
  description?: string;
  personality?: string;
}

export function StoryGenerator() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [storyMode, setStoryMode] = useState('text')
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    description: '',
    personality: ''
  })
  const [editingIndex, setEditingIndex] = useState(-1)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [story, setStory] = useState("")
  const [tone, setTone] = useState<Tone>('witty');
  const [setting, setSetting] = useState<Setting>('country-side');

  const [storyParameters, setStoryParameters] = useState({
    setting: '',
    location: '',
    genre: '',
    tone: '',
    assistant: '',
    accent: '',
    customAssistantName: '',
    customAssistantDesc: '',
  })
  const [needsNewIndex, setNeedsNewIndex] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [chunkSize, setChunkSize] = useState<number>(1000);
  const [chunkOverlap, setChunkOverlap] = useState<number>(200);
  const [topK, setTopK] = useState<number>(5);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(0.9);

  // Livepeer variables to hold story sections  
  const [storySections, setStorySections] = useState<string[]>([]);
  const [playbackUrls, setPlaybackUrls] = useState<string[]>([]);
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

  // audio variables
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);



  useEffect(() => {
    setMounted(true)
  }, [])
  useEffect(() => {
    console.log("Characters state updated:", characters);
  }, [characters]);

  useEffect(() => {
    if (
      storyMode === 'slideshow' &&
      playbackUrls.length === 0 &&
      !isGeneratingVideos &&
      storySections.length > 0
    ) {
      fetchVideosForSections(storySections);
    }
  }, [storyMode, playbackUrls.length, isGeneratingVideos, storySections]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setNeedsNewIndex(true);
    } else {
      alert('Failed to load file');
    }
  };

  const extractCharactersFromText = useCallback(() => {
    if (!uploadedFile) {
      alert('Please upload a file first');
      return;
    }

    setIsExtracting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;

      try {
        const response = await fetch('/api/split', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document: text, chunkSize, chunkOverlap }),
        });

        const data = await response.json();

        console.log('Characters received from API:', data);

        // Flatten the nested array and map the characters
        const extractedCharacters: Character[] = data.flat().map((charData: CharData, index: number) => ({
          id: index + 1,
          name: charData.name || `Character ${index + 1}`,
          description: charData.description || 'No description available',
          personality: charData.personality || 'No personality traits provided',
        }));
        setCharacters(extractedCharacters);

        console.log('Characters state updated:', extractedCharacters);
      } catch (error) {
        console.error('Error extracting characters:', error);
      } finally {
        setIsExtracting(false);
      }
    };

    reader.readAsText(uploadedFile);
  }, [uploadedFile, chunkSize, chunkOverlap]);


  const formatStory = (rawStory: string) => {
    // Remove the numeric prefixes and quotes that OpenAI's streaming adds
    let cleanedStory = rawStory
      .replace(/\d+:"/g, '') // Remove numeric prefixes
      .replace(/\\"/g, '"')  // Fix escaped quotes
      .replace(/\\"([^"]+)\\"/g, '"$1"') // Fix dialogue quotes
      .replace(/\\n/g, '\n') // Fix newlines
      .replace(/\\/g, '')   // Remove remaining backslashes
      .trim();

    // Ensure proper markdown formatting
    if (!cleanedStory.startsWith('# ')) {
      cleanedStory = '# ' + cleanedStory;
    }

    return cleanedStory;
  };

  // split story into sections
  function splitStoryIntoSections(story: string): string[] {
    // Split the story into sections based on your criteria
    return story.split('\n\n').filter((section) => section.trim() !== '');
  }
  async function generateAudio(storyText: string) {
    setIsGeneratingAudio(true);
    try {
      const response = await fetch('/api/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: storyText }),
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error generating audio:', error);
    } finally {
      setIsGeneratingAudio(false);
    }
  }
  const generateStory = useCallback(async () => {
    setStory('Generating story...');
    setAudioUrl('');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone,
          setting,
          characters,
          temperature,
          topK,
          topP,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let storyContent = '';

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        storyContent += chunk;
        const formattedStory = formatStory(storyContent);
        setStory(formattedStory);
      }

      // After the story is fully generated, split it into sections
      const sections = splitStoryIntoSections(storyContent);
      setStorySections(sections);

      // Generate images by calling the API
      await fetchVideosForSections(sections);

    } catch (error) {
      console.error('Error generating story:', error);
      setStory('An error occurred while generating the story');
    }
  }, [tone, setting, characters, temperature, topK, topP]);

  const fetchVideosForSections = async (sections: string[]) => {
    setIsGeneratingVideos(true);
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${errorData.error}`);
      }

      const data = await response.json();
      setPlaybackUrls(data.playbackUrls);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setIsGeneratingVideos(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % playbackUrls.length);
  };

  const prevSlide = () => {
    setCurrentSlideIndex((prevIndex) =>
      prevIndex === 0 ? playbackUrls.length - 1 : prevIndex - 1
    );
  };

  const addCharacter = () => {
    if (newCharacter.name && newCharacter.description) {
      if (editingIndex === -1) {
        setCharacters([
          ...characters,
          { ...newCharacter, id: Date.now() },
        ]);
      } else {
        const updatedCharacters = [...characters];
        updatedCharacters[editingIndex] = {
          ...newCharacter,
          id: characters[editingIndex].id,
        };
        setCharacters(updatedCharacters);
        setEditingIndex(-1);
      }
      setNewCharacter({ name: '', description: '', personality: '' });
    }
  };

  const editCharacter = (index: number) => {
    setNewCharacter(characters[index])
    setEditingIndex(index)
  }

  const deleteCharacter = (index: number) => {
    const updatedCharacters = characters.filter((_, i) => i !== index)
    setCharacters(updatedCharacters)
  }

  const handleChunkSizeChange = (value: string) => {
    setChunkSize(Number(value));
    setNeedsNewIndex(true);
  };

  const handleChunkOverlapChange = (value: string) => {
    const numValue = parseFloat(value);
    setChunkOverlap(numValue);
    setNeedsNewIndex(true);
  };
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">AI Story Generator</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          </Button>
        </header>

        {/* AI Assistant Section */}
        <Card>
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>Choose or create an AI assistant for your story</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="assistant">AI Assistant</Label>
              <Select
                onValueChange={(value) =>
                  setStoryParameters({ ...storyParameters, assistant: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select AI Assistant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt3">GPT-3</SelectItem>
                  <SelectItem value="gpt4">GPT-4</SelectItem>
                  <SelectItem value="custom">Custom Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {storyParameters.assistant === 'custom' && (
              <>
                <Input
                  placeholder="Custom Assistant Name"
                  value={storyParameters.customAssistantName || ''}
                  onChange={(e) =>
                    setStoryParameters({ ...storyParameters, customAssistantName: e.target.value })
                  }
                />
                <Textarea
                  placeholder="Custom Assistant Description"
                  value={storyParameters.customAssistantDesc || ''}
                  onChange={(e) =>
                    setStoryParameters({ ...storyParameters, customAssistantDesc: e.target.value })
                  }
                />
              </>
            )}
            <div>
              <Label htmlFor="accent">Accent</Label>
              <Input
                id="accent"
                placeholder="e.g., British, American, Australian"
                value={storyParameters.accent}
                onChange={(e) =>
                  setStoryParameters({ ...storyParameters, accent: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>
        {/* Characters Section */}
        <Card>
          <CardHeader>
            <CardTitle>Characters</CardTitle>
          </CardHeader>
          <CardContent>

            <Table className="w-full table-auto overflow-x-auto">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Personality</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {characters.map((char, index) => (
                  <TableRow key={index}>
                    <TableCell>{char.name}</TableCell>
                    <TableCell>{char.description}</TableCell>
                    <TableCell>{char.personality}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => editCharacter(index)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCharacter(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 space-y-2">
              <Input
                placeholder="Character Name"
                value={newCharacter.name}
                onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
              />
              <Input
                placeholder="Character Description"
                value={newCharacter.description}
                onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
              />
              <Textarea
                placeholder="Character Personality"
                value={newCharacter.personality}
                onChange={(e) =>
                  setNewCharacter({ ...newCharacter, personality: e.target.value })
                }
              />
              <Button onClick={addCharacter}>
                {editingIndex === -1 ? 'Add Character' : 'Update Character'}
              </Button>
            </div>
            <div className="mt-4">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex items-center space-x-2">
                  <Upload className="h-6 w-6" />
                  <span>Upload Character Document</span>
                </div>
              </Label>
              <input
                id="file-upload"
                type="file"
                accept=".txt"
                className="hidden"
                onChange={handleFileUpload}
              />
              {uploadedFile && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Uploaded file: {uploadedFile.name}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Show RAG Controls and Extract Button only if a file is uploaded */}
        {uploadedFile && (
          <>
            {/* RAG Parameter Controls */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>RAG Parameters</CardTitle>
                <CardDescription>
                  Adjust the parameters for chunking and retrieval.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <LinkedSlider
                  label="Chunk Size:"
                  description="The maximum size of the chunks we are searching over, in tokens."
                  min={1}
                  max={3000}
                  step={1}
                  value={chunkSize.toString()}
                  onChange={handleChunkSizeChange}
                />
                <LinkedSlider
                  label="Chunk Overlap:"
                  description="The maximum amount of overlap between chunks, in tokens."
                  min={1}
                  max={600}
                  step={1}
                  value={chunkOverlap.toString()}
                  onChange={handleChunkOverlapChange}
                />
                <LinkedSlider
                  label="Top K:"
                  description="The maximum number of chunks to return from the search."
                  min={1}
                  max={15}
                  step={1}
                  value={topK.toString()}
                  onChange={(value) => setTopK(parseFloat(value))}
                />
                <LinkedSlider
                  label="Temperature:"
                  description="Controls the randomness of the output. Lower values make the output more focused and deterministic."
                  min={0}
                  max={1}
                  step={0.01}
                  value={temperature.toString()}
                  onChange={(value) => setTemperature(parseFloat(value))}
                />
                <LinkedSlider
                  label="Top P:"
                  description="An alternative to temperature, also known as nucleus sampling."
                  min={0}
                  max={1}
                  step={0.01}
                  value={topP.toString()}
                  onChange={(value) => setTopP(parseFloat(value))}
                />
              </CardContent>
            </Card>
            {/* Extract Characters Button */}
            <Button
              disabled={!needsNewIndex || isExtracting}
              onClick={extractCharactersFromText}
              className="w-full"
            >
              {isExtracting ? 'Extracting...' : 'Extract Characters'}
              <Wand2 className="ml-2 h-5 w-5" />
            </Button>
          </>
        )}
        {/* Story Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Story Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="setting">Setting</Label>
              <Input
                id="setting"
                placeholder="e.g., Medieval Europe, Futuristic Mars Colony"
                value={setting}
                onChange={(e) => setSetting(e.target.value as Setting)}
              />
            </div>
            <div>
              <Label htmlFor="tone">Tone</Label>
              <Select
                value={tone}
                onValueChange={(value) => setTone(value as Tone)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="witty">Witty</SelectItem>
                  <SelectItem value="romantic">Romantic</SelectItem>
                  <SelectItem value="comic">Comic</SelectItem>
                  <SelectItem value="mystery">Mystery</SelectItem>
                  <SelectItem value="sci-fi">Sci-fi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateStory}>Generate Story</Button>
          </CardContent>
        </Card>

        {/* Story Display Options */}
        <Card>
          <CardHeader>
            <CardTitle>Story Display Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={storyMode}
              onValueChange={(value) => {
                setStoryMode(value);
                if (
                  value === 'slideshow' &&
                  playbackUrls.length === 0 &&
                  !isGeneratingVideos &&
                  storySections.length > 0
                ) {
                  fetchVideosForSections(storySections);
                }
              }}
            >
              <TabsList>
                <TabsTrigger value="text">Text Only</TabsTrigger>
                <TabsTrigger value="audio">Text & Audio</TabsTrigger>
                <TabsTrigger value="slideshow">Slideshow & Audio</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Generated Story */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Story</CardTitle>
          </CardHeader>
          <CardContent>
            {storyMode === 'text' && (
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown>{story}</ReactMarkdown>
              </div>
            )}
            {storyMode === 'audio' && (
              <div className="space-y-4">
                <Textarea
                  className="min-h-[200px]"
                  placeholder="Your story will appear here..."
                  value={story}
                  readOnly
                />
                <div className="flex items-center space-x-2">
                  {isGeneratingAudio ? (
                    <p>Generating audio...</p>
                  ) : audioUrl ? (
                    <audio controls src={audioUrl}>
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <Button onClick={() => generateAudio(story)}>
                      Generate Audio
                    </Button>
                  )}
                </div>
              </div>
            )}

            {storyMode === 'slideshow' && (
              <div className="space-y-4">
                {isGeneratingVideos ? (
                  <p>Generating videos...</p>
                ) : playbackUrls.length > 0 ? (
                  <div className="relative">
                    <ReactPlayer
                      url={playbackUrls[currentSlideIndex]}
                      playing={false}
                      controls={true}
                      width="100%"
                      height="100%"
                    />
                    <div className="absolute bottom-0 bg-black bg-opacity-50 text-white p-4">
                      <p>{storySections[currentSlideIndex]}</p>
                    </div>
                    <div className="flex justify-between mt-2">
                      <Button variant="outline" onClick={prevSlide}>
                        Previous
                      </Button>
                      <Button variant="outline" onClick={nextSlide}>
                        Next
                      </Button>
                    </div>
                    {audioUrl && (
                      <audio controls src={audioUrl}>
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                ) : (
                  <p>No videos available. Please generate a story first.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

