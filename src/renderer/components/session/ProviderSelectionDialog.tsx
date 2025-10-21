import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { ProviderType } from '../../types/session'

interface ProviderSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (provider: ProviderType, customUrl?: string) => void
}

const PROVIDERS = [
  {
    id: 'claude' as ProviderType,
    name: 'Claude',
    description: 'Anthropic Claude AI',
    color: 'bg-blue-500',
    url: 'https://claude.ai',
  },
  {
    id: 'chatgpt' as ProviderType,
    name: 'ChatGPT',
    description: 'OpenAI ChatGPT',
    color: 'bg-green-500',
    url: 'https://chat.openai.com',
  },
  {
    id: 'gemini' as ProviderType,
    name: 'Gemini',
    description: 'Google Gemini',
    color: 'bg-purple-500',
    url: 'https://gemini.google.com',
  },
  {
    id: 'perplexity' as ProviderType,
    name: 'Perplexity',
    description: 'Perplexity AI',
    color: 'bg-cyan-500',
    url: 'https://www.perplexity.ai',
  },
  {
    id: 'custom' as ProviderType,
    name: 'Custom URL',
    description: 'Add your own AI provider',
    color: 'bg-gray-500',
    url: '',
  },
]

export function ProviderSelectionDialog({
  open,
  onOpenChange,
  onSelect,
}: ProviderSelectionDialogProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null)
  const [customUrl, setCustomUrl] = useState('')

  const handleSelect = () => {
    if (!selectedProvider) return

    if (selectedProvider === 'custom' && !customUrl.trim()) {
      return
    }

    onSelect(selectedProvider, selectedProvider === 'custom' ? customUrl : undefined)

    // Reset state
    setSelectedProvider(null)
    setCustomUrl('')
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSelectedProvider(null)
    setCustomUrl('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select AI Provider</DialogTitle>
          <DialogDescription>
            Choose an AI provider to start a new session
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className={`flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-all ${
                selectedProvider === provider.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
            >
              <div className={`h-10 w-10 rounded-full ${provider.color}`} />
              <div className="flex-1">
                <div className="font-semibold">{provider.name}</div>
                <div className="text-sm text-muted-foreground">
                  {provider.description}
                </div>
              </div>
              {selectedProvider === provider.id && (
                <div className="h-5 w-5 rounded-full border-2 border-primary bg-primary">
                  <svg
                    className="h-full w-full text-primary-foreground"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {selectedProvider === 'custom' && (
          <div className="space-y-2">
            <Label htmlFor="custom-url">Custom Provider URL</Label>
            <Input
              id="custom-url"
              type="url"
              placeholder="https://example.com"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedProvider || (selectedProvider === 'custom' && !customUrl.trim())}
          >
            Create Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
