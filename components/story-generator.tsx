'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Moon, Sun, Upload, Download, Play, Pause, Pencil, Trash2 } from 'lucide-react'

export function StoryGenerator() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [storyMode, setStoryMode] = useState('text')
  const [characters, setCharacters] = useState([])
  const [newCharacter, setNewCharacter] = useState({ name: '', role: '', description: '' })
  const [editingIndex, setEditingIndex] = useState(-1)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    // TODO: Implement character extraction logic
    console.log('File uploaded:', file.name)
  }

  const addCharacter = () => {
    if (newCharacter.name && newCharacter.role) {
      if (editingIndex === -1) {
        setCharacters([...characters, newCharacter])
      } else {
        const updatedCharacters = [...characters]
        updatedCharacters[editingIndex] = newCharacter
        setCharacters(updatedCharacters)
        setEditingIndex(-1)
      }
      setNewCharacter({ name: '', role: '', description: '' })
    }
  }

  const editCharacter = (index) => {
    setNewCharacter(characters[index])
    setEditingIndex(index)
  }

  const deleteCharacter = (index) => {
    const updatedCharacters = characters.filter((_, i) => i !== index)
    setCharacters(updatedCharacters)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen p-8 transition-colors duration-200 bg-background text-foreground">
      <div className="max-w-6xl mx-auto space-y-8">
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

        <Card>
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
            <CardDescription>Choose or create an AI assistant for your story</CardDescription>
          </CardHeader>
          <CardContent>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select AI Assistant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt3">GPT-3</SelectItem>
                <SelectItem value="gpt4">GPT-4</SelectItem>
                <SelectItem value="custom">Custom Assistant</SelectItem>
              </SelectContent>
            </Select>
            <Input className="mt-4" placeholder="Custom Assistant Name" />
            <Textarea className="mt-4" placeholder="Custom Assistant Description" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Story Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="setting">Setting</Label>
              <Input id="setting" placeholder="e.g., Medieval Europe, Futuristic Mars Colony" />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g., Castle, Spaceship, Underwater City" />
            </div>
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                  <SelectItem value="scifi">Science Fiction</SelectItem>
                  <SelectItem value="mystery">Mystery</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Custom Genre" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Characters</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {characters.map((char, index) => (
                  <TableRow key={index}>
                    <TableCell>{char.name}</TableCell>
                    <TableCell>{char.role}</TableCell>
                    <TableCell>{char.description}</TableCell>
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
                onChange={(e) => setNewCharacter({...newCharacter, name: e.target.value})}
              />
              <Input 
                placeholder="Character Role" 
                value={newCharacter.role}
                onChange={(e) => setNewCharacter({...newCharacter, role: e.target.value})}
              />
              <Textarea 
                placeholder="Character Description" 
                value={newCharacter.description}
                onChange={(e) => setNewCharacter({...newCharacter, description: e.target.value})}
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
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Story Display Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={storyMode} onValueChange={setStoryMode}>
              <TabsList>
                <TabsTrigger value="text">Text Only</TabsTrigger>
                <TabsTrigger value="audio">Text & Audio</TabsTrigger>
                <TabsTrigger value="slideshow">Slideshow & Audio</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generated Story</CardTitle>
          </CardHeader>
          <CardContent>
            {storyMode === 'text' && (
              <Textarea className="min-h-[300px]" placeholder="Your story will appear here..." />
            )}
            {storyMode === 'audio' && (
              <div className="space-y-4">
                <Textarea className="min-h-[200px]" placeholder="Your story will appear here..." />
                <div className="flex items-center space-x-2">
                  <Button size="icon"><Play className="h-4 w-4" /></Button>
                  <Button size="icon"><Pause className="h-4 w-4" /></Button>
                  <Button size="icon"><Download className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
            {storyMode === 'slideshow' && (
              <div className="space-y-4">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">Slideshow placeholder</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="icon"><Play className="h-4 w-4" /></Button>
                  <Button size="icon"><Pause className="h-4 w-4" /></Button>
                  <Button size="icon"><Download className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}