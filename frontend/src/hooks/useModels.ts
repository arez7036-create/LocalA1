import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export function useModels() {
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const res = await api.get('/models')
      const modelList = res.data.models
      setModels(modelList)
      if (modelList.length > 0 && !selectedModel) {
        setSelectedModel(modelList[0])
      }
    } catch (err) {
      console.error('Failed to fetch models:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedModel])

  useEffect(() => { refetch() }, [refetch])

  return { models, selectedModel, setSelectedModel, loading, refetch }
}