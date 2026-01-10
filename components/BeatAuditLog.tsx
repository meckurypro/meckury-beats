// components/BeatAuditLog.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, History, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface AuditLogEntry {
  id: string
  created_at: string
  beat_id: string
  editor_id: string
  changes: {
    old: any
    new: any
  }
  change_summary: string
  editor_name: string | null
}

interface BeatAuditLogProps {
  beatId: string
  beatTitle: string
  onClose: () => void
}

export default function BeatAuditLog({ beatId, beatTitle, onClose }: BeatAuditLogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    fetchAuditLogs()
  }, [beatId])

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('beat_edit_history')
        .select(`
          *,
          editor:profiles!beat_edit_history_editor_id_fkey(full_name, email)
        `)
        .eq('beat_id', beatId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedLogs = data.map((log: any) => ({
        ...log,
        editor_name: log.editor?.full_name || log.editor?.email || 'Unknown User'
      }))

      setLogs(formattedLogs)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      toast.error('Failed to load edit history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getChangedFields = (changes: any) => {
    const changedFields: string[] = []
    const oldData = changes.old
    const newData = changes.new

    Object.keys(oldData).forEach(key => {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changedFields.push(key)
      }
    })

    return changedFields
  }

  const formatFieldName = (field: string) => {
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-text-muted italic">Not set</span>
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    if (typeof value === 'string' && value.startsWith('http')) {
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-meckury-primary hover:text-meckury-accent underline truncate max-w-xs inline-block"
          title={value}
        >
          View File
        </a>
      )
    }
    return String(value)
  }

  const renderChangeDetail = (field: string, oldValue: any, newValue: any) => {
    // Skip if no actual change
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      return null
    }

    return (
      <div key={field} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background-elevated rounded-lg">
        <div className="font-medium text-white">
          {formatFieldName(field)}
        </div>
        <div className="space-y-1">
          <p className="text-xs text-text-muted uppercase">Before</p>
          <p className="text-text-secondary text-sm">{formatValue(oldValue)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-text-muted uppercase">After</p>
          <p className="text-meckury-success text-sm font-medium">{formatValue(newValue)}</p>
        </div>
      </div>
    )
  }

  const toggleExpand = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-background-card rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-background-card border-b border-meckury-mediumGray px-8 py-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1 flex items-center">
              <History className="w-8 h-8 mr-3 text-meckury-primary" />
              Edit History
            </h2>
            <p className="text-text-secondary">{beatTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-white transition-colors p-2 hover:bg-meckury-mediumGray rounded-lg"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-12 h-12"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-meckury-mediumGray mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Edit History
              </h3>
              <p className="text-text-secondary">
                This beat hasn't been edited yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => {
                const changedFields = getChangedFields(log.changes)
                const isExpanded = expandedLog === log.id

                return (
                  <div
                    key={log.id}
                    className="card bg-background-elevated hover:bg-opacity-70 transition-all"
                  >
                    {/* Log Header */}
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex items-center space-x-2 text-text-secondary">
                            <User className="w-4 h-4" />
                            <span className="font-medium text-white">{log.editor_name}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-text-muted text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(log.created_at)}</span>
                          </div>
                        </div>
                        <p className="text-text-secondary text-sm">
                          Changed {changedFields.length} field{changedFields.length !== 1 ? 's' : ''}: {' '}
                          <span className="text-meckury-primary font-medium">
                            {changedFields.slice(0, 3).map(formatFieldName).join(', ')}
                            {changedFields.length > 3 && ` +${changedFields.length - 3} more`}
                          </span>
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-text-muted" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-text-muted" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-6 pb-6 space-y-3 border-t border-meckury-mediumGray pt-6">
                        {changedFields.map(field => 
                          renderChangeDetail(
                            field,
                            log.changes.old[field],
                            log.changes.new[field]
                          )
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background-card border-t border-meckury-mediumGray px-8 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary px-8"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
