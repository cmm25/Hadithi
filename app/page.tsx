import { Metadata } from 'next'
import { StoryGenerator } from '@/components/story-generator'

export const metadata: Metadata = {
  title: 'AI Story Generator',
  description: 'Create unique stories with AI assistance, customizable settings, and multiple output formats.',
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <StoryGenerator />
    </main>
  )
}