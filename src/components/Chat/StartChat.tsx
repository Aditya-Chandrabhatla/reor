import React, { useCallback, useEffect, useState } from 'react'
import { PiPaperPlaneRight, PiCaretDown } from 'react-icons/pi'
import { LLMConfig } from 'electron/main/electron-store/storeConfig'
import '../../styles/chat.css'
import { FiSettings } from 'react-icons/fi'
import { AgentConfig, ToolDefinition, DatabaseSearchFilters } from './utils/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { allAvailableToolDefinitions } from './utils/tools'
import { Button } from '@/components/ui/button'
import DbSearchFilters from './ChatConfigComponents/DBSearchFilters'
import PromptEditor from './ChatConfigComponents/PromptEditor'
import ToolSelector from './ChatConfigComponents/ToolSelector'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import exampleAgents from './ChatConfigComponents/exampleAgents'

interface StartChatProps {
  defaultModelName: string
  handleNewChatMessage: (userTextFieldInput?: string, chatFilters?: AgentConfig) => void
}

const StartChat: React.FC<StartChatProps> = ({ defaultModelName, handleNewChatMessage }) => {
  const [llmConfigs, setLLMConfigs] = useState<LLMConfig[]>([])
  const [selectedLLM, setSelectedLLM] = useState<string>(defaultModelName)
  const [userTextFieldInput, setUserTextFieldInput] = useState<string>('')
  const [agentConfig, setAgentConfig] = useState<AgentConfig>()

  useEffect(() => {
    const fetchAgentConfigs = async () => {
      const agentConfigs = await window.electronStore.getAgentConfigs()
      if (agentConfigs && agentConfigs.length > 0) {
        setAgentConfig(agentConfigs[0])
      } else {
        setAgentConfig(exampleAgents[0])
      }
    }
    fetchAgentConfigs()
  }, [])

  useEffect(() => {
    const fetchLLMModels = async () => {
      const LLMConfigs = await window.llm.getLLMConfigs()
      setLLMConfigs(LLMConfigs)
      const defaultLLM = await window.llm.getDefaultLLMName()
      setSelectedLLM(defaultLLM)
    }
    fetchLLMModels()
  }, [])

  const sendMessageHandler = async () => {
    await window.llm.setDefaultLLM(selectedLLM)
    if (!agentConfig) {
      throw new Error('No agent config found')
    }
    handleNewChatMessage(userTextFieldInput, { ...agentConfig })
  }

  const handleLLMChange = (value: string) => {
    setSelectedLLM(value)
  }

  const handleToolsChange = (tools: ToolDefinition[]) => {
    setAgentConfig((prevConfig) => {
      if (!prevConfig) throw new Error('Agent config must be initialized before setting tools')
      return { ...prevConfig, toolDefinitions: tools }
    })
  }

  const handleDbSearchFiltersChange = useCallback((newFilters: DatabaseSearchFilters) => {
    setAgentConfig((prevConfig) => {
      if (!prevConfig) throw new Error('Agent config must be initialized before setting db search filters')
      return { ...prevConfig, dbSearchFilters: newFilters }
    })
  }, [])

  const handleDbSearchToggle = (checked: boolean) => {
    setAgentConfig((prevConfig) => {
      if (!prevConfig) throw new Error('Agent config must be initialized before setting db search filters')
      return {
        ...prevConfig,
        dbSearchFilters: checked
          ? {
              limit: 33,
              minDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
              maxDate: new Date(),
              passFullNoteIntoContext: true,
            }
          : undefined,
      }
    })
  }

  if (!agentConfig) return <div>Loading...</div>

  return (
    <div className="relative flex size-full flex-col items-center overflow-y-auto">
      <div className="relative flex w-full flex-col text-center lg:top-10 lg:max-w-2xl">
        <div className="flex w-full justify-center">
          <img src="icon.png" style={{ width: '64px', height: '64px' }} alt="ReorImage" />
        </div>
        <h1 className="mb-10 text-[28px] text-foreground">
          Welcome to your AI-powered assistant! Start a conversation with your second brain!
        </h1>

        <div className="flex flex-col">
          <div className="z-50 flex flex-col rounded-md border-2 border-solid border-border bg-secondary focus-within:ring-1 focus-within:ring-ring">
            <textarea
              value={userTextFieldInput}
              onKeyDown={(e) => {
                if (!e.shiftKey && e.key === 'Enter') {
                  e.preventDefault()
                  sendMessageHandler()
                }
              }}
              className="h-[100px] w-full resize-none rounded-t-md border-0 bg-transparent p-4 text-primary caret-foreground focus:outline-none"
              placeholder="What can Reor help you with today?"
              onChange={(e) => setUserTextFieldInput(e.target.value)}
            />
            <div className="mx-auto h-px w-[96%] bg-muted-foreground/20" />
            <div className="flex flex-col items-center justify-between gap-2 px-4 py-2 md:flex-row md:gap-4">
              <div className="flex flex-col items-center justify-between rounded-md border-0 py-2 md:flex-row">
                <Select value={selectedLLM} onValueChange={handleLLMChange}>
                  <SelectTrigger className="w-[180px] border border-solid border-border">
                    <SelectValue placeholder="Select LLM" />
                  </SelectTrigger>
                  <SelectContent>
                    {llmConfigs.map((llm) => (
                      <SelectItem key={llm.modelName} value={llm.modelName}>
                        {llm.modelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className="flex items-center justify-between gap-2 bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={sendMessageHandler}
                    >
                      <PiPaperPlaneRight className="size-4" />
                      Send
                      <PiCaretDown className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <div className="space-y-2">
                      {/* <p className="text-sm font-medium">Send options</p>
                      <select
                        value={sendPriority}
                        onChange={(e) => setSendPriority(e.target.value)}
                        className="w-full rounded-md border p-1 text-sm"
                      >
                        <option value="normal">Normal priority</option>
                        <option value="high">High priority</option>
                        <option value="urgent">Urgent</option>
                      </select> */}
                      {agentConfig.dbSearchFilters && (
                        <DbSearchFilters
                          dbSearchFilters={agentConfig.dbSearchFilters}
                          onFiltersChange={handleDbSearchFiltersChange}
                        />
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="mx-auto w-[96%] rounded-b border border-solid border-border bg-background px-4 py-2">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                Edit prompt:
                <Popover>
                  <PopoverTrigger asChild>
                    <Button>Prompt</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full border border-solid border-muted-foreground bg-border">
                    <PromptEditor
                      promptTemplate={agentConfig.promptTemplate}
                      onSave={(newPromptTemplate) => {
                        setAgentConfig((prevConfig) => {
                          if (!prevConfig)
                            throw new Error('Agent config must be initialized before setting prompt template')
                          return { ...prevConfig, promptTemplate: newPromptTemplate }
                        })
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center space-x-2">
                Add tools for the LLM to call:{' '}
                <ToolSelector
                  allTools={allAvailableToolDefinitions}
                  selectedTools={agentConfig.toolDefinitions}
                  onToolsChange={handleToolsChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="db-search-toggle"
                  checked={!!agentConfig.dbSearchFilters}
                  onCheckedChange={handleDbSearchToggle}
                />
                <Label htmlFor="db-search-toggle" className="text-sm text-muted-foreground">
                  Include initial database search in context
                </Label>
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-8 rounded-full"
                      disabled={!agentConfig.dbSearchFilters}
                    >
                      <FiSettings className="size-4" />
                      <span className="sr-only">Open DB search settings</span>
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>Database Search Filters</DrawerTitle>
                      <DrawerDescription>Configure your database search filters</DrawerDescription>
                    </DrawerHeader>
                    {agentConfig.dbSearchFilters && (
                      <DbSearchFilters
                        dbSearchFilters={agentConfig.dbSearchFilters}
                        onFiltersChange={handleDbSearchFiltersChange}
                      />
                    )}
                    <DrawerFooter>
                      <Button
                        onClick={() =>
                          setAgentConfig((prev) => {
                            if (!prev) throw new Error('Agent config must be initialized')
                            return { ...prev, dbSearchFilters: prev.dbSearchFilters }
                          })
                        }
                      >
                        Save Changes
                      </Button>
                      <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StartChat
